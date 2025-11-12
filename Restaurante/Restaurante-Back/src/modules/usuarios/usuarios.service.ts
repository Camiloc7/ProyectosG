import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsuarioEntity } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RolEntity } from '../roles/entities/rol.entity';
import { EstablecimientoEntity } from '../establecimientos/entities/establecimiento.entity';


@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly usuarioRepository: Repository<UsuarioEntity>,
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
    @InjectRepository(EstablecimientoEntity)
    private readonly establecimientoRepository: Repository<EstablecimientoEntity>,
  ) { }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async create(createUsuarioDto: CreateUsuarioDto): Promise<UsuarioEntity> {
    const { establecimientoName, rolName, username, password, ...rest } = createUsuarioDto;

    let rol: RolEntity | null = null;
    try {
      rol = await this.rolRepository.findOneBy({ nombre: rolName });
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn(`ADVERTENCIA: TypeError al buscar rol '${rolName}'. Asumiendo que no existe.`);
        rol = null;
      } else {
        throw error;
      }
    }
    if (!rol) {
      throw new NotFoundException(`Rol con nombre "${rolName}" no encontrado.`);
    }

    if (!establecimientoName) {
      throw new BadRequestException('El nombre del establecimiento es obligatorio para la creación del usuario.');
    }
    let establecimiento: EstablecimientoEntity | null = null;
    try {
      establecimiento = await this.establecimientoRepository.findOneBy({ nombre: establecimientoName });
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn(`ADVERTENCIA: TypeError al buscar establecimiento '${establecimientoName}'. Asumiendo que no existe.`);
        establecimiento = null;
      } else {
        throw error;
      }
    }
    if (!establecimiento) {
      throw new NotFoundException(`Establecimiento con nombre "${establecimientoName}" no encontrado.`);
    }

    let existingUser: UsuarioEntity | null = null;
    try {
      existingUser = await this.usuarioRepository.findOneBy({ username });
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn(`ADVERTENCIA: TypeError al buscar usuario existente '${username}'. Asumiendo que no existe.`);
        existingUser = null;
      } else {
        throw error;
      }
    }
    if (existingUser) {
      throw new ConflictException(`El nombre de usuario "${username}" ya está en uso.`);
    }

    const passwordHash = await this.hashPassword(password);
    const usuario = this.usuarioRepository.create({
      ...rest,
      username,
      password_hash: passwordHash,
      establecimiento_id: establecimiento.id,
      rol_id: rol.id,
    });
    const savedUser = await this.usuarioRepository.save(usuario);
    return (await this.usuarioRepository.findOne({ where: { id: savedUser.id }, relations: ['establecimiento', 'rol'] }))!;
  }
  async importUserFromCloud(cloudUserData: any, plainPassword?: string): Promise<UsuarioEntity> {
    const now = new Date();
    if (!cloudUserData || typeof cloudUserData !== 'object') {
      throw new Error('❌ Datos de usuario inválidos o vacíos.');
    }
    if (!cloudUserData.id || typeof cloudUserData.id !== 'string') {
      throw new Error('❌ ID del usuario faltante o inválido.');
    }
    let user = await this.usuarioRepository.findOneBy({ id: cloudUserData.id });
    if (user) console.log(`🔄 Usuario '${cloudUserData.username}' ya existe localmente. Se actualizará.`);

    const cloudEst = cloudUserData.establecimiento;
    if (!cloudEst || !cloudUserData.establecimiento_id) {
      throw new Error('❌ Establecimiento faltante en datos de nube.');
    }

    let establecimiento = await this.establecimientoRepository.findOneBy({ id: cloudUserData.establecimiento_id });
    if (!establecimiento) {
      establecimiento = this.establecimientoRepository.create({
        id: cloudUserData.establecimiento_id,
        nombre: cloudEst.nombre,
        direccion: cloudEst.direccion || '',
        telefono: cloudEst.telefono || '',
        activo: cloudEst.activo ?? true,
        impuesto_porcentaje: parseFloat(cloudEst.impuesto_porcentaje) || 0,
        created_at: cloudEst.created_at ? new Date(cloudEst.created_at) : now,
        updated_at: cloudEst.updated_at ? new Date(cloudEst.updated_at) : now,
      });
      establecimiento = await this.establecimientoRepository.save(establecimiento);
    }
    const cloudRol = cloudUserData.rol;
    if (!cloudRol || !cloudUserData.rol_id) {
      throw new Error('❌ Rol faltante en datos de nube.');
    }

    let rol = await this.rolRepository.findOneBy({ id: cloudUserData.rol_id });
    if (!rol) {
      rol = this.rolRepository.create({
        id: cloudUserData.rol_id,
        nombre: cloudRol.nombre,
        created_at: cloudRol.created_at ? new Date(cloudRol.created_at) : now,
        updated_at: cloudRol.updated_at ? new Date(cloudRol.updated_at) : now,
      });
    } else {
      rol.nombre = cloudRol.nombre;
      rol.updated_at = cloudRol.updated_at ? new Date(cloudRol.updated_at) : now;
    }
    rol = await this.rolRepository.save(rol);
    if (!plainPassword || typeof plainPassword !== 'string') {
      throw new Error('❌ No se proporcionó una contraseña válida para crear o actualizar el usuario.');
    }
    const password_hash = await bcrypt.hash(plainPassword, 10);
    if (user) {
      Object.assign(user, {
        username: cloudUserData.username,
        nombre: cloudUserData.nombre,
        apellido: cloudUserData.apellido,
        activo: cloudUserData.activo ?? true,
        password_hash,
        establecimiento,
        establecimiento_id: establecimiento.id,
        rol,
        rol_id: rol.id,
        updated_at: cloudUserData.updated_at ? new Date(cloudUserData.updated_at) : now,
      });
    } else {
      user = this.usuarioRepository.create({
        id: cloudUserData.id,
        username: cloudUserData.username,
        nombre: cloudUserData.nombre,
        apellido: cloudUserData.apellido,
        activo: cloudUserData.activo ?? true,
        password_hash,
        establecimiento,
        establecimiento_id: establecimiento.id,
        rol,
        rol_id: rol.id,
        created_at: cloudUserData.created_at ? new Date(cloudUserData.created_at) : now,
        updated_at: cloudUserData.updated_at ? new Date(cloudUserData.updated_at) : now,
      });
    }
    const savedUser = await this.usuarioRepository.save(user);
    const fullUser = await this.usuarioRepository.findOneOrFail({
      where: { id: savedUser.id },
      relations: ['establecimiento', 'rol'],
    });
    return fullUser;
  }
  async findAll(establecimientoId?: string): Promise<UsuarioEntity[]> {
    const whereCondition: FindOptionsWhere<UsuarioEntity> = {};
    if (establecimientoId) {
      whereCondition.establecimiento_id = establecimientoId;
    }
    let usuarios: UsuarioEntity[] = [];
    try {
      usuarios = await this.usuarioRepository.find({
        where: whereCondition,
        relations: ['establecimiento', 'rol'],
      });
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn(`ADVERTENCIA: TypeError al buscar todos los usuarios. Asumiendo que la tabla está vacía.`);
        usuarios = [];
      } else {
        throw error;
      }
    }
    return usuarios;
  }

  async findOne(id: string, establecimientoId?: string): Promise<UsuarioEntity> {
    const whereCondition: FindOptionsWhere<UsuarioEntity> = { id };
    if (establecimientoId) {
      whereCondition.establecimiento_id = establecimientoId;
    }

    let usuario: UsuarioEntity | null = null;
    try {
      usuario = await this.usuarioRepository.findOne({
        where: whereCondition,
        relations: ['establecimiento', 'rol'],
      });
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn(`ADVERTENCIA: TypeError al buscar usuario por ID '${id}'. Asumiendo que no existe.`);
        usuario = null;
      } else {
        throw error;
      }
    }

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
    return usuario;
  }

  async findOneByUsername(username: string): Promise<UsuarioEntity | null> {
    let usuario: UsuarioEntity | null = null;
    try {
      usuario = await this.usuarioRepository.findOne({
        where: { username },
        select: ['id', 'establecimiento_id', 'rol_id', 'nombre', 'apellido', 'username', 'password_hash', 'activo', 'created_at', 'updated_at'],
        relations: ['establecimiento', 'rol'],
      });
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn(`ADVERTENCIA: TypeError al buscar usuario por nombre de usuario '${username}'. Asumiendo que no existe.`);
        usuario = null;
      } else {
        throw error;
      }
    }
    return usuario;
  }

  async findOneByRoleAndEstablecimiento(roleId: string, establecimientoId: string): Promise<UsuarioEntity | null> {
    let usuario: UsuarioEntity | null = null;
    try {
      usuario = await this.usuarioRepository.findOne({
        where: {
          rol_id: roleId,
          establecimiento_id: establecimientoId,
        },
        relations: ['rol', 'establecimiento'],
      });
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn(`ADVERTENCIA: TypeError al buscar usuario por rol y establecimiento. Asumiendo que no existe.`);
        usuario = null;
      } else {
        throw error;
      }
    }
    return usuario;
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto, establecimientoId?: string): Promise<UsuarioEntity> {
    const { username, password_nueva, establecimientoName, rolName, ...rest } = updateUsuarioDto;

    const usuario = await this.findOne(id, establecimientoId);

    if (establecimientoName) {
      let nuevoEstablecimiento: EstablecimientoEntity | null = null;
      try {
        nuevoEstablecimiento = await this.establecimientoRepository.findOneBy({ nombre: establecimientoName });
      } catch (error: any) {
        if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
          console.warn(`ADVERTENCIA: TypeError al buscar nuevo establecimiento '${establecimientoName}'. Asumiendo que no existe.`);
          nuevoEstablecimiento = null;
        } else {
          throw error;
        }
      }
      if (!nuevoEstablecimiento) {
        throw new NotFoundException(`Establecimiento con nombre "${establecimientoName}" no encontrado.`);
      }
      if (usuario.establecimiento_id !== nuevoEstablecimiento.id) {
        throw new BadRequestException('No se permite cambiar el establecimiento de un usuario directamente a través de esta operación.');
      }
    }

    if (rolName) {
      let nuevoRol: RolEntity | null = null;
      try {
        nuevoRol = await this.rolRepository.findOneBy({ nombre: rolName });
      } catch (error: any) {
        if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
          console.warn(`ADVERTENCIA: TypeError al buscar nuevo rol '${rolName}'. Asumiendo que no existe.`);
          nuevoRol = null;
        } else {
          throw error;
        }
      }
      if (!nuevoRol) {
        throw new NotFoundException(`Rol con nombre "${rolName}" no encontrado.`);
      }
      if (usuario.rol_id !== nuevoRol.id) {
        throw new BadRequestException('No se permite cambiar el rol de un usuario directamente a través de esta operación.');
      }
    }

    if (username && username !== usuario.username) {
      let existingUser: UsuarioEntity | null = null;
      try {
        existingUser = await this.usuarioRepository.findOneBy({ username });
      } catch (error: any) {
        if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
          console.warn(`ADVERTENCIA: TypeError al buscar usuario existente por nombre de usuario '${username}'. Asumiendo que no existe.`);
          existingUser = null;
        } else {
          throw error;
        }
      }
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`El nombre de usuario "${username}" ya está en uso.`);
      }
      usuario.username = username;
    }
    if (updateUsuarioDto.password_nueva) {
      usuario.password_hash = await this.hashPassword(updateUsuarioDto.password_nueva);
    }

    Object.assign(usuario, rest);

    const savedUser = await this.usuarioRepository.save(usuario);
    return (await this.usuarioRepository.findOne({ where: { id: savedUser.id }, relations: ['establecimiento', 'rol'] }))!;
  }

  async remove(id: string, establecimientoId?: string): Promise<DeleteResult> {
    const usuario = await this.findOne(id, establecimientoId);
    try {
      const result = await this.usuarioRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Usuario con ID "${id}" no encontrado para eliminar.`);
      }
      return result;
    } catch (error: any) {
      if (error.code === 'ER_ROW_IS_REFERENCED' || error.errno === 1451) {
        throw new BadRequestException('No se puede eliminar el usuario porque tiene registros asociados (ej. pedidos u otras entidades).');
      }
      throw error;
    }
  }
}
