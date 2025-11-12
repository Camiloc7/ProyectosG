import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { RolEntity } from './entities/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { RoleName } from '../../common/constants/app.constants';
import { UsuarioEntity } from '../usuarios/entities/usuario.entity';
import { EstablecimientoEntity } from '../establecimientos/entities/establecimiento.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class RolesService implements OnModuleInit {
  private superAdminRoleCached: RolEntity | null = null;

  constructor(
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepository: Repository<UsuarioEntity>,
    @InjectRepository(EstablecimientoEntity)
    private readonly establecimientoRepository: Repository<EstablecimientoEntity>,
  ) { }

  async onModuleInit() {
    console.log('RolesService: Verificando y creando roles esenciales si es necesario...');
    await this.ensureEssentialRolesExist();
    if (!this.superAdminRoleCached) {
      try {
        this.superAdminRoleCached = await this.rolRepository.findOneBy({ nombre: RoleName.SUPER_ADMIN });
      } catch (error: any) {
        if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
          console.warn(`ADVERTENCIA: Se capturó un TypeError al intentar cachear SUPER_ADMIN.`, error.message);
          this.superAdminRoleCached = null;
        } else {
          throw error;
        }
      }

      if (!this.superAdminRoleCached) {
        console.error('ERROR CRÍTICO: El rol SUPER_ADMIN no pudo ser encontrado ni creado. La aplicación no puede continuar.');
        throw new Error('No se pudo inicializar el rol SUPER_ADMIN.');
      }
    }
    await this.ensureSuperAdminUserExists();
  }

  private async ensureEssentialRolesExist(): Promise<void> {
    const rolesToCreate = [
      RoleName.SUPER_ADMIN,
      RoleName.ADMIN,
      RoleName.SUPERVISOR,
      RoleName.CAJERO,
      RoleName.COCINERO,
      RoleName.MESERO,
      RoleName.DOMICILIARIO,
    ];

    for (const roleName of rolesToCreate) {
      let currentRole: RolEntity | null = null;
      try {
        currentRole = await this.rolRepository.findOneBy({ nombre: roleName });
      } catch (error: any) {
        if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
          console.warn(`ADVERTENCIA: Se capturó un TypeError durante la verificación inicial del rol '${roleName}'. Esto puede ocurrir en la inicialización con SQLite. Asumiendo que el rol no existe y se intentará crear.`, error.message);
          currentRole = null;
        } else {
          console.error(`ERROR: Fallo al intentar buscar el rol '${roleName}':`, error.message);
          throw error;
        }
      }

      if (!currentRole) {
        console.log(`- Rol '${roleName}' no encontrado, creándolo...`);
        try {
          const newRole = this.rolRepository.create({ nombre: roleName });
          currentRole = await this.rolRepository.save(newRole);
          console.log(`- Rol '${roleName}' creado exitosamente.`);
        } catch (creationError: any) {
          if (creationError.code === 'SQLITE_CONSTRAINT' && creationError.message.includes('UNIQUE constraint failed: roles.nombre')) {
            console.log(`- Rol '${roleName}' ya existe (se detectó por error de unicidad durante la creación).`);
            try {
              currentRole = await this.rolRepository.findOneBy({ nombre: roleName });
            } catch (fetchError: any) {
              console.warn(`ADVERTENCIA: Fallo al recuperar el rol '${roleName}' después de un error de unicidad.`, fetchError.message);
              currentRole = null;
            }
          } else {
            console.error(`ERROR: Fallo al crear el rol '${roleName}':`, creationError.message);
            throw creationError;
          }
        }
      } else {
        console.log(`- Rol '${roleName}' ya existe.`);
      }

      if (roleName === RoleName.SUPER_ADMIN) {
        this.superAdminRoleCached = currentRole;
      }
    }
  }

  private async ensureSuperAdminUserExists(): Promise<void> {
    const globalEstablecimientoId = '00000000-0000-0000-0000-000000000000';
    const globalEstablecimientoName = 'Sistema Global';

    let establecimiento: EstablecimientoEntity | null = null;
    try {
      establecimiento = await this.establecimientoRepository.findOneBy({ id: globalEstablecimientoId });
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn(`ADVERTENCIA: Se capturó un TypeError al verificar el establecimiento global por ID.`, error.message);
        establecimiento = null;
      } else {
        throw error;
      }
    }

    if (!establecimiento) {
      try {
        establecimiento = await this.establecimientoRepository.findOneBy({ nombre: globalEstablecimientoName });
      } catch (error: any) {
        if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
          console.warn(`ADVERTENCIA: Se capturó un TypeError al verificar el establecimiento global por nombre.`, error.message);
          establecimiento = null;
        } else {
          throw error;
        }
      }
    }

    if (!establecimiento) {
      console.log(`- Establecimiento Global no encontrado, creándolo... (desde RolesService)`);
      establecimiento = this.establecimientoRepository.create({
        id: globalEstablecimientoId,
        nombre: globalEstablecimientoName,
        direccion: 'N/A',
        telefono: 'N/A',
        activo: true,
        impuesto_porcentaje: 0.00,
      });
      await this.establecimientoRepository.save(establecimiento);
      console.log(`- Establecimiento Global creado exitosamente (desde RolesService).`);
    } else {
      console.log(`- Establecimiento Global ya existe (desde RolesService). ID: ${establecimiento.id}`);
    }

    const superAdminUsername = 'superadmin';
    const superAdminId = 'u1-uuid-superadmin';

    let superAdminUser: UsuarioEntity | null = null;
    try {
      superAdminUser = await this.usuarioRepository.findOneBy({ username: superAdminUsername });
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn(`ADVERTENCIA: Se capturó un TypeError al verificar el usuario superadmin.`, error.message);
        superAdminUser = null;
      } else {
        throw error;
      }
    }
  }

  async create(createRolDto: CreateRolDto): Promise<RolEntity> {
    const { nombre } = createRolDto;
    const existingRol = await this.rolRepository.findOne({ where: { nombre } });
    if (existingRol) {
      throw new ConflictException(`El rol con nombre "${nombre}" ya existe.`);
    }

    const rol = this.rolRepository.create(createRolDto);
    return await this.rolRepository.save(rol);
  }

  async findAll(): Promise<RolEntity[]> {
    return await this.rolRepository.find();
  }

  async findOne(id: string): Promise<RolEntity> {
    const rol = await this.rolRepository.findOne({ where: { id } });
    if (!rol) {
      throw new NotFoundException(`Rol con ID "${id}" no encontrado.`);
    }
    return rol;
  }

  async findOneByName(nombre: string): Promise<RolEntity> {
    const rol = await this.rolRepository.findOne({ where: { nombre } });
    if (!rol) {
      throw new NotFoundException(`Rol con nombre "${nombre}" no encontrado.`);
    }
    return rol;
  }

  async update(id: string, updateRolDto: UpdateRolDto): Promise<RolEntity> {
    const { nombre } = updateRolDto;
    if (nombre) {
      const existingRol = await this.rolRepository.findOne({ where: { nombre } });
      if (existingRol && existingRol.id !== id) {
        throw new ConflictException(`El rol con nombre "${nombre}" ya existe.`);
      }
    }

    const rol = await this.rolRepository.findOneBy({ id });
    if (!rol) {
      throw new NotFoundException(`Rol con ID "${id}" no encontrado para actualizar.`);
    }
    Object.assign(rol, updateRolDto);
    return await this.rolRepository.save(rol);
  }

  async remove(id: string): Promise<DeleteResult> {
    const result = await this.rolRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Rol con ID "${id}" no encontrado para eliminar.`);
    }
    return result;
  }
}
