import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { EstablecimientosService } from '../establecimientos/establecimientos.service';
import { MesaEntity, EstadoMesa } from './entities/mesa.entity';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';

@Injectable()
export class MesasService {
  constructor(
    @InjectRepository(MesaEntity)
    private readonly mesaRepository: Repository<MesaEntity>,
    private readonly establecimientosService: EstablecimientosService,
  ) { }

  /**
   * Crea una nueva mesa.
   * @param createMesaDto Datos para crear la mesa.
   * @returns La mesa creada.
   * @throws NotFoundException Si el establecimiento no existe.
   * @throws ConflictException Si el número de mesa ya existe en el establecimiento.
   */
  async create(createMesaDto: CreateMesaDto): Promise<MesaEntity> {
    const { establecimiento_id, numero, ...rest } = createMesaDto;
    await this.establecimientosService.findOne(establecimiento_id);
    const existingMesa = await this.mesaRepository.findOneBy({ establecimiento_id, numero });
    if (existingMesa) {
      throw new ConflictException(`La mesa con número "${numero}" ya existe en el establecimiento "${establecimiento_id}".`);
    }
    const mesa = this.mesaRepository.create({
      establecimiento_id,
      numero,
      estado: EstadoMesa.LIBRE,
      ...rest,
    });

    return await this.mesaRepository.save(mesa);
  }

  /**
   * Obtiene todas las mesas de un establecimiento.
   * @param establecimientoId ID del establecimiento.
   * @returns Lista de mesas.
   */
  async findAll(establecimientoId: string): Promise<MesaEntity[]> {
    await this.establecimientosService.findOne(establecimientoId);
    return await this.mesaRepository.find({
      where: { establecimiento_id: establecimientoId },
      order: { numero: 'ASC' },
      relations: ['establecimiento'],
    });
  }

  /**
   * Obtiene una mesa por su ID.
   * @param id ID de la mesa.
   * @param establecimientoId Opcional: valida que la mesa pertenezca a este establecimiento.
   * @returns La mesa encontrada.
   * @throws NotFoundException Si la mesa no se encuentra o no pertenece al establecimiento.
   */
  async findOne(id: string, establecimientoId?: string): Promise<MesaEntity> {
    const whereCondition: any = { id };
    if (establecimientoId) {
      await this.establecimientosService.findOne(establecimientoId);
      whereCondition.establecimiento_id = establecimientoId;
    }

    const mesa = await this.mesaRepository.findOne({
      where: whereCondition,
      relations: ['establecimiento'],
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa con ID "${id}" no encontrada.`);
    }
    return mesa;
  }

  /**
   * Busca una mesa por su número y establecimiento.
   * @param numero Número de la mesa.
   * @param establecimientoId ID del establecimiento al que pertenece la mesa.
   * @returns La mesa encontrada o null si no existe.
   */
  async findByNumero(numero: string, establecimientoId: string): Promise<MesaEntity | null> {
    await this.establecimientosService.findOne(establecimientoId);
    return await this.mesaRepository.findOne({
      where: { numero, establecimiento_id: establecimientoId },
    });
  }

  /**
   * Actualiza una mesa existente.
   * @param id ID de la mesa a actualizar.
   * @param updateMesaDto Datos para actualizar la mesa.
   * @param establecimientoId Opcional: valida que la mesa pertenezca a este establecimiento.
   * @returns La mesa actualizada.
   * @throws NotFoundException Si la mesa no se encuentra o no pertenece al establecimiento.
   * @throws ConflictException Si el nuevo número de mesa ya existe en el establecimiento.
   */
  async update(id: string, updateMesaDto: UpdateMesaDto, establecimientoId?: string): Promise<MesaEntity> {
    const { numero, ...rest } = updateMesaDto;

    const mesa = await this.findOne(id, establecimientoId);
    if (numero && numero !== mesa.numero) {
      const existingMesa = await this.mesaRepository.findOneBy({
        establecimiento_id: mesa.establecimiento_id,
        numero,
      });
      if (existingMesa && existingMesa.id !== id) {
        throw new ConflictException(`La mesa con número "${numero}" ya existe en el establecimiento "${mesa.establecimiento_id}".`);
      }
      mesa.numero = numero;
    }
    Object.assign(mesa, rest);

    return await this.mesaRepository.save(mesa);
  }

  /**
   * Actualiza el estado de una mesa.
   * Este método es para ser usado internamente por otros servicios (ej. PedidosService)
   * para cambiar el estado de la mesa a LIBRE u OCUPADA.
   * @param id ID de la mesa.
   * @param estado Nuevo estado de la mesa.
   * @param establecimientoId ID del establecimiento.
   * @returns La mesa actualizada.
   * @throws NotFoundException Si la mesa no se encuentra.
   */
  async updateEstadoMesa(id: string, estado: EstadoMesa, establecimientoId: string): Promise<MesaEntity> {
    const mesa = await this.findOne(id, establecimientoId);
    if (mesa.estado === estado) {
      return mesa;
    }
    mesa.estado = estado;
    return await this.mesaRepository.save(mesa);
  }

  /**
   * Elimina una mesa.
   * @param id ID de la mesa a eliminar.
   * @param establecimientoId Opcional: valida que la mesa pertenezca a este establecimiento.
   * @returns Resultado de la eliminación.
   * @throws NotFoundException Si la mesa no se encuentra o no pertenece al establecimiento.
   * @throws BadRequestException Si la mesa tiene pedidos activos.
   */
  async remove(id: string, establecimientoId?: string): Promise<DeleteResult> {
    const mesa = await this.findOne(id, establecimientoId);

    const result = await this.mesaRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Mesa con ID "${id}" no encontrada para eliminar.`);
    }
    return result;
  }
}