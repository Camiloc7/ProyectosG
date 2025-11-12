import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { ProveedorEntity } from './entities/proveedor.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { EstablecimientosService } from '../establecimientos/establecimientos.service';
@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(ProveedorEntity)
    private readonly proveedorRepository: Repository<ProveedorEntity>,
    private readonly establecimientosService: EstablecimientosService,
  ) {}
  async create(createProveedorDto: CreateProveedorDto): Promise<ProveedorEntity> {
    const { establecimiento_id, nombre, nit, ...rest } = createProveedorDto;
    if (!establecimiento_id) {
      throw new BadRequestException('El ID del establecimiento no puede ser nulo o indefinido en este punto.');
    }
    const establecimiento = await this.establecimientosService.findOne(establecimiento_id!);
    if (!establecimiento) { 
        throw new NotFoundException(`Establecimiento con ID "${establecimiento_id}" no encontrado.`);
    }
    const existingProveedor = await this.proveedorRepository.findOne({
      where: [
        { establecimiento_id: establecimiento_id!, nombre },
        { establecimiento_id: establecimiento_id!, nit },
      ],
    });
    if (existingProveedor) {
      if (existingProveedor.nombre === nombre) {
        throw new ConflictException(`Ya existe un proveedor con el nombre "${nombre}" en este establecimiento.`);
      }
      if (existingProveedor.nit === nit) {
        throw new ConflictException(`Ya existe un proveedor con el NIT "${nit}" ya existe en este establecimiento.`);
      }
    }
    const proveedor = this.proveedorRepository.create(createProveedorDto);
    return await this.proveedorRepository.save(proveedor);
  }
  async findAll(establecimientoId: string): Promise<ProveedorEntity[]> {
    const establecimiento = await this.establecimientosService.findOne(establecimientoId);
    if (!establecimiento) { 
        throw new NotFoundException(`Establecimiento con ID "${establecimientoId}" no encontrado.`);
    }
    return await this.proveedorRepository.find({
      where: { establecimiento_id: establecimientoId },
      order: { nombre: 'ASC' },
      relations: ['establecimiento'],
    });
  }
  /**
   * Obtiene un proveedor por su ID y opcionalmente por establecimiento.
   * Retorna null si el proveedor no se encuentra, útil para la lógica del seeder.
   * @param id ID del proveedor.
   * @param establecimientoId Opcional: ID del establecimiento (para seguridad).
   * @returns El proveedor encontrado o null.
   */
  async findOne(id: string, establecimientoId?: string): Promise<ProveedorEntity | null> { 
    const whereCondition: any = { id };
    if (establecimientoId) {
      const establecimiento = await this.establecimientosService.findOne(establecimientoId);
      if (!establecimiento) { 
          return null;
      }
      whereCondition.establecimiento_id = establecimientoId;
    }
    const proveedor = await this.proveedorRepository.findOne({
      where: whereCondition,
      relations: ['establecimiento'],
    });
    return proveedor;
  }
  /**
   * Busca un proveedor por su nombre o NIT dentro de un establecimiento específico.
   * Retorna null si no existe.
   * @param nombre Nombre del proveedor.
   * @param nit NIT del proveedor.
   * @param establecimientoId ID del establecimiento.
   * @returns El proveedor encontrado o null si no existe.
   */
  async findByNameOrNit(nombre: string, nit: string, establecimientoId: string): Promise<ProveedorEntity | null> { 
    const establecimiento = await this.establecimientosService.findOne(establecimientoId);
    if (!establecimiento) { 
        return null;
    }
    return await this.proveedorRepository.findOne({
      where: [
        { establecimiento_id: establecimientoId, nombre },
        { establecimiento_id: establecimientoId, nit },
      ],
    });
  }
  async update(id: string, updateProveedorDto: UpdateProveedorDto, establecimientoId?: string): Promise<ProveedorEntity> {
    const { nombre, nit, ...rest } = updateProveedorDto;
    const proveedor = await this.findOne(id, establecimientoId); 
    if (!proveedor) { 
      throw new NotFoundException(`Proveedor con ID "${id}" no encontrado.`);
    }
    if ((nombre && nombre !== proveedor.nombre) || (nit && nit !== proveedor.nit)) {
      const existingProveedor = await this.proveedorRepository.findOne({
        where: [
          { establecimiento_id: proveedor.establecimiento_id, nombre },
          { establecimiento_id: proveedor.establecimiento_id, nit },
        ],
      });
      if (existingProveedor && existingProveedor.id !== id) {
        if (existingProveedor.nombre === nombre) {
          throw new ConflictException(`Ya existe otro proveedor con el nombre "${nombre}" en este establecimiento.`);
        }
        if (existingProveedor.nit === nit) {
          throw new ConflictException(`Ya existe otro proveedor con el NIT "${nit}" en este establecimiento.`);
        }
      }
    }
    Object.assign(proveedor, rest);
    if (nombre) proveedor.nombre = nombre;
    if (nit) proveedor.nit = nit;
    return await this.proveedorRepository.save(proveedor);
  }
  async remove(id: string, establecimientoId?: string): Promise<DeleteResult> {
    const proveedor = await this.findOne(id, establecimientoId); 
    if (!proveedor) { 
      throw new NotFoundException(`Proveedor con ID "${id}" no encontrado para eliminar.`);
    }
    const result = await this.proveedorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Proveedor con ID "${id}" no encontrado para eliminar.`);
    }
    return result;
  }
}
