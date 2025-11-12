import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { MedioPagoEntity } from './entities/medio-pago.entity';
import { CreateMedioPagoDto } from './dto/create-medio-pago.dto';
import { UpdateMedioPagoDto } from './dto/update-medio-pago.dto';

import { ModuleRef } from '@nestjs/core'; 
import { EstablecimientosService } from '../establecimientos/establecimientos.service'; 
@Injectable()
export class MediosPagoService {
  constructor(
    @InjectRepository(MedioPagoEntity)
    private readonly medioPagoRepository: Repository<MedioPagoEntity>,
    private moduleRef: ModuleRef, 
  ) {}

  private establecimientosService: EstablecimientosService;
  onModuleInit() {
    this.establecimientosService = this.moduleRef.get(EstablecimientosService, { strict: false });
  }

  async create(createMedioPagoDto: CreateMedioPagoDto): Promise<MedioPagoEntity> {
    const { establecimiento_id, nombre, ...rest } = createMedioPagoDto;

    if (!establecimiento_id) {
      throw new BadRequestException('El ID del establecimiento es requerido para crear un medio de pago.');
    }
    await this.establecimientosService.findOne(establecimiento_id);

    const existingMedioPago = await this.medioPagoRepository.findOne({
      where: { establecimiento_id, nombre },
    });

    if (existingMedioPago) {
      throw new ConflictException(`El medio de pago con nombre "${nombre}" ya existe para este establecimiento.`);
    }

    const nuevoMedioPago = this.medioPagoRepository.create(createMedioPagoDto);
    return await this.medioPagoRepository.save(nuevoMedioPago);
  }

  async findAll(establecimientoId: string, activo?: boolean): Promise<MedioPagoEntity[]> {
    const whereCondition: any = { establecimiento_id: establecimientoId };
    if (activo !== undefined) {
      whereCondition.activo = activo;
    }
    return await this.medioPagoRepository.find({
      where: whereCondition,
      order: { nombre: 'ASC' },
      relations: ['establecimiento'],
    });
  }

  async findOne(id: string, establecimientoId?: string): Promise<MedioPagoEntity> {
    const whereCondition: any = { id };
    if (establecimientoId) {
      whereCondition.establecimiento_id = establecimientoId;
    }
    const medioPago = await this.medioPagoRepository.findOne({
      where: whereCondition,
      relations: ['establecimiento'],
    });
    if (!medioPago) {
      const errorMessage = establecimientoId
        ? `Medio de pago con ID "${id}" no encontrado en el establecimiento "${establecimientoId}".`
        : `Medio de pago con ID "${id}" no encontrado.`;
      throw new NotFoundException(errorMessage);
    }
    return medioPago;
  }

  async findByName(nombre: string, establecimientoId: string): Promise<MedioPagoEntity | null> {
    return await this.medioPagoRepository.findOne({
      where: { nombre, establecimiento_id: establecimientoId },
    });
  }

  async update(id: string, updateMedioPagoDto: UpdateMedioPagoDto, establecimientoId: string): Promise<MedioPagoEntity> {
    const medioPago = await this.findOne(id, establecimientoId);

    if (updateMedioPagoDto.nombre && updateMedioPagoDto.nombre !== medioPago.nombre) {
      const existingMedioPago = await this.medioPagoRepository.findOne({
        where: { establecimiento_id: establecimientoId, nombre: updateMedioPagoDto.nombre },
      });
      if (existingMedioPago && existingMedioPago.id !== id) {
        throw new ConflictException(`Ya existe otro medio de pago con el nombre "${updateMedioPagoDto.nombre}" para este establecimiento.`);
      }
    }

    Object.assign(medioPago, updateMedioPagoDto);
    return await this.medioPagoRepository.save(medioPago);
  }

  async remove(id: string, establecimientoId: string): Promise<void> {
    const result = await this.medioPagoRepository.delete({ id, establecimiento_id: establecimientoId });
    if (result.affected === 0) {
      throw new NotFoundException(`Medio de pago con ID "${id}" no encontrado o no pertenece a su establecimiento para eliminar.`);
    }
  }
}
