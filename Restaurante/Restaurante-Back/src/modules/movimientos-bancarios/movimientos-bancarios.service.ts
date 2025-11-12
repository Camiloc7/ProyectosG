import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import {   MovimientoBancarioEntity } from './entities/movimiento-bancario.entity';
import { CreateMovimientoCuentaBancariaDto } from './dto/create-movimiento-bancario.dto';
import { UpdateMovimientoCuentaBancariaDto } from './dto/update-movimiento-bancario.dto';
import { CuentasBancariasService } from '../cuentas-banco/cuentas-bancarias.service'; 
import { MovimientoTipo } from 'src/common/enums/movimiento-tipo.enum';

@Injectable()
export class MovimientosCuentasBancariasService {
  constructor(
    @InjectRepository( MovimientoBancarioEntity)
    private readonly movimientoCuentaBancariaRepository: Repository< MovimientoBancarioEntity>,
    private readonly cuentasBancariasService: CuentasBancariasService,
  ) {}

  async create(createMovimientoCuentaBancariaDto: CreateMovimientoCuentaBancariaDto, establecimientoId: string): Promise< MovimientoBancarioEntity> {
    const { cuenta_bancaria_id, fecha_movimiento, ...rest } = createMovimientoCuentaBancariaDto;

    const cuentaBancaria = await this.cuentasBancariasService.findOne(cuenta_bancaria_id, establecimientoId);
    if (!cuentaBancaria) {
      throw new BadRequestException('La cuenta bancaria especificada no existe o no pertenece a su establecimiento.');
    }
    const movimiento = this.movimientoCuentaBancariaRepository.create({
      ...rest,
      cuenta_bancaria_id,
      fecha_movimiento: fecha_movimiento ? new Date(fecha_movimiento) : new Date(), 
    });

    return await this.movimientoCuentaBancariaRepository.save(movimiento);
  }

  async findAll(establecimientoId: string, cuentaBancariaId?: string): Promise< MovimientoBancarioEntity[]> {
    const whereCondition: any = {};
    const cuentasDelEstablecimiento = await this.cuentasBancariasService.findAll(establecimientoId);
    const idsCuentasDelEstablecimiento = cuentasDelEstablecimiento.map(c => c.id);

    if (cuentaBancariaId) {
      if (!idsCuentasDelEstablecimiento.includes(cuentaBancariaId)) {
        throw new ForbiddenException('La cuenta bancaria especificada no pertenece a su establecimiento.');
      }
      whereCondition.cuenta_bancaria_id = cuentaBancariaId;
    } else {
      whereCondition.cuenta_bancaria_id = In(idsCuentasDelEstablecimiento); 
    }

    return await this.movimientoCuentaBancariaRepository.find({
      where: whereCondition,
      relations: ['cuentaBancaria'],
      order: { fecha_movimiento: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: string, establecimientoId: string): Promise< MovimientoBancarioEntity> {
    const movimiento = await this.movimientoCuentaBancariaRepository.findOne({
      where: { id },
      relations: ['cuentaBancaria'],
    });

    if (!movimiento) {
      throw new NotFoundException(`Movimiento con ID "${id}" no encontrado.`);
    }
    const cuentaDelMovimiento = await this.cuentasBancariasService.findOne(movimiento.cuenta_bancaria_id, establecimientoId);
    if (!cuentaDelMovimiento) {
      throw new ForbiddenException('No tiene permiso para acceder a este movimiento.');
    }

    return movimiento;
  }

  async update(id: string, updateMovimientoCuentaBancariaDto: UpdateMovimientoCuentaBancariaDto, establecimientoId: string): Promise< MovimientoBancarioEntity> {
    const movimiento = await this.findOne(id, establecimientoId); 

    Object.assign(movimiento, updateMovimientoCuentaBancariaDto);

    return await this.movimientoCuentaBancariaRepository.save(movimiento);
  }

  async remove(id: string, establecimientoId: string): Promise<void> {
    const movimiento = await this.findOne(id, establecimientoId); 

    const result = await this.movimientoCuentaBancariaRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Movimiento con ID "${id}" no encontrado para eliminar.`);
    }
  }

  /**
   * Calcula el total de consignaciones para una cuenta bancaria específica
   * dentro de un rango de fechas.
   * @param cuentaBancariaId El ID de la cuenta bancaria.
   * @param fechaInicio La fecha de inicio del período.
   * @param fechaFin La fecha de fin del período.
   * @param establecimientoId El ID del establecimiento para validación de seguridad.
   * @returns El monto total consignado.
   */
  async getTotalConsignadoPorPeriodo(cuentaBancariaId: string, fechaInicio: Date, fechaFin: Date, establecimientoId: string): Promise<number> {
    await this.cuentasBancariasService.findOne(cuentaBancariaId, establecimientoId);

    const result = await this.movimientoCuentaBancariaRepository
      .createQueryBuilder('movimiento')
      .select('SUM(movimiento.monto)', 'totalConsignado')
      .where('movimiento.cuenta_bancaria_id = :cuentaBancariaId', { cuentaBancariaId })
      .andWhere('movimiento.tipo_movimiento = :tipo', { tipo: MovimientoTipo.CONSIGNACION })
      .andWhere('movimiento.fecha_movimiento BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
      .getRawOne();

    return parseFloat(result?.totalConsignado) || 0;
  }
}