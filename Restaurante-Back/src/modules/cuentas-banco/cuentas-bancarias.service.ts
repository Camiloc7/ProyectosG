import { Injectable, NotFoundException, ConflictException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DeleteResult } from 'typeorm';
import { CuentaBancariaEntity } from './entities/cuenta-bancaria.entity';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';
import { EstablecimientosService } from '../establecimientos/establecimientos.service';
import { MediosPagoService } from '../medios-pago/medios-pago.service';
import { ModuleRef } from '@nestjs/core';


@Injectable()
export class CuentasBancariasService implements OnModuleInit {
  constructor(
    @InjectRepository(CuentaBancariaEntity)
    private readonly cuentaBancariaRepository: Repository<CuentaBancariaEntity>,
    private moduleRef: ModuleRef, 
  ) {}

  private establecimientosService: EstablecimientosService;
  private mediosPagoService: MediosPagoService;

  onModuleInit() {
    this.establecimientosService = this.moduleRef.get(EstablecimientosService, { strict: false });
    this.mediosPagoService = this.moduleRef.get(MediosPagoService, { strict: false });
  }
  

  private async generateNextPucCode(establecimientoId: string): Promise<string> {
    const basePuc = '111005-';
    const lastAccount = await this.cuentaBancariaRepository.findOne({
      where: {
        establecimiento_id: establecimientoId,
        codigo_puc: Like(`${basePuc}%`)
      },
      order: {
        codigo_puc: 'DESC'
      },
      select: ['codigo_puc']
    });

    let nextNumber = 1;
    if (lastAccount && lastAccount.codigo_puc) {
      const lastPucSuffix = lastAccount.codigo_puc.split('-')[1];
      const lastNumber = parseInt(lastPucSuffix, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    return `${basePuc}${formattedNumber}`;
  }


  async create(createCuentaBancariaDto: CreateCuentaBancariaDto, establecimientoId: string): Promise<CuentaBancariaEntity> {
    const { medio_pago_asociado_id, numero_cuenta } = createCuentaBancariaDto;

    if (!medio_pago_asociado_id) {
      throw new BadRequestException('El ID del medio de pago asociado es requerido para crear una cuenta bancaria.');
    }
    await this.establecimientosService.findOne(establecimientoId);
    const medioPago = await this.mediosPagoService.findOne(medio_pago_asociado_id, establecimientoId);
    if (!medioPago) {
      throw new NotFoundException(`Medio de pago con ID "${medio_pago_asociado_id}" no encontrado.`);
    }
    const existingCuenta = await this.findByNumeroCuenta(numero_cuenta, establecimientoId);
    if (existingCuenta) {
      throw new ConflictException(`Ya existe una cuenta bancaria con el número "${numero_cuenta}" para este establecimiento.`);
    }
    const codigo_puc = await this.generateNextPucCode(establecimientoId);
    const nuevaCuenta = this.cuentaBancariaRepository.create({
      ...createCuentaBancariaDto,
      establecimiento_id: establecimientoId,
      codigo_puc, 
    });
    return await this.cuentaBancariaRepository.save(nuevaCuenta);
  }
  async findByNumeroCuenta(numeroCuenta: string, establecimientoId: string): Promise<CuentaBancariaEntity | null> {
    return await this.cuentaBancariaRepository.findOne({
      where: { establecimiento_id: establecimientoId, numero_cuenta: numeroCuenta },
    });
  }
  async findByMedioPagoId(medioPagoId: string, establecimientoId: string): Promise<CuentaBancariaEntity | null> {
    return await this.cuentaBancariaRepository.findOne({
      where: { establecimiento_id: establecimientoId, medio_pago_asociado_id: medioPagoId },
    });
  }
  async findAll(establecimientoId: string, activa?: boolean): Promise<CuentaBancariaEntity[]> {
    const whereCondition: any = { establecimiento_id: establecimientoId };
    if (activa !== undefined) {
      whereCondition.activa = activa;
    }
    return await this.cuentaBancariaRepository.find({
      where: whereCondition,
      relations: ['establecimiento', 'medio_pago_asociado'],
      order: { nombre_banco: 'ASC' },
    });
  }
  async findOne(id: string, establecimientoId?: string): Promise<CuentaBancariaEntity> {
    const whereCondition: any = { id };
    if (establecimientoId) {
      whereCondition.establecimiento_id = establecimientoId;
    }
    const cuenta = await this.cuentaBancariaRepository.findOne({
      where: whereCondition,
      relations: ['establecimiento', 'medio_pago_asociado'],
    });
    if (!cuenta) {
      throw new NotFoundException(`Cuenta bancaria con ID "${id}" no encontrada.`);
    }
    return cuenta;
  }
  async findDefaultCashAccount(establecimientoId: string): Promise<CuentaBancariaEntity> {
    const medioPagoEfectivo = await this.mediosPagoService.findByName('Efectivo', establecimientoId);
    if (!medioPagoEfectivo) {
      throw new NotFoundException(`No se encontró un medio de pago 'Efectivo' para el establecimiento "${establecimientoId}".`);
    }
    const cuentaCaja = await this.cuentaBancariaRepository.findOne({
      where: {
        establecimiento_id: establecimientoId,
        medio_pago_asociado_id: medioPagoEfectivo.id,
      },
      relations: ['medio_pago_asociado'],
    });
    if (!cuentaCaja) {
      throw new NotFoundException(`No se encontró una cuenta bancaria por defecto para efectivo en el establecimiento "${establecimientoId}". Asegúrese de que exista una cuenta asociada al medio de pago 'Efectivo'.`);
    }
    return cuentaCaja;
  }







  // async update(id: string, updateCuentaBancariaDto: UpdateCuentaBancariaDto, establecimientoId: string): Promise<CuentaBancariaEntity> {
  //   const cuenta = await this.findOne(id, establecimientoId);
  //   const { medio_pago_asociado_id, numero_cuenta, ...rest } = updateCuentaBancariaDto;

  //   if (numero_cuenta && numero_cuenta !== cuenta.numero_cuenta) {
  //     const existingCuenta = await this.findByNumeroCuenta(numero_cuenta, establecimientoId);
  //     if (existingCuenta && existingCuenta.id !== id) {
  //       throw new ConflictException(`Ya existe otra cuenta bancaria con el número "${numero_cuenta}" para este establecimiento.`);
  //     }
  //     cuenta.numero_cuenta = numero_cuenta;
  //   }
  //   if (medio_pago_asociado_id && medio_pago_asociado_id !== cuenta.medio_pago_asociado_id) {
  //     const medioPago = await this.mediosPagoService.findOne(medio_pago_asociado_id, establecimientoId);
  //     if (!medioPago) {
  //       throw new NotFoundException(`Medio de pago con ID "${medio_pago_asociado_id}" no encontrado.`);
  //     }
  //     cuenta.medio_pago_asociado_id = medio_pago_asociado_id;
  //   }
  //   Object.assign(cuenta, rest);
  //   return await this.cuentaBancariaRepository.save(cuenta);
  // }





async update(id: string, updateCuentaBancariaDto: UpdateCuentaBancariaDto, establecimientoId: string): Promise<CuentaBancariaEntity> {
    const cuenta = await this.findOne(id, establecimientoId);
    Object.assign(cuenta, updateCuentaBancariaDto);
    if (updateCuentaBancariaDto.numero_cuenta && updateCuentaBancariaDto.numero_cuenta !== cuenta.numero_cuenta) {
        const existingCuenta = await this.findByNumeroCuenta(updateCuentaBancariaDto.numero_cuenta, establecimientoId);
        if (existingCuenta && existingCuenta.id !== id) {
            throw new ConflictException(`Ya existe otra cuenta bancaria con el número "${updateCuentaBancariaDto.numero_cuenta}" para este establecimiento.`);
        }
    }

    if (updateCuentaBancariaDto.medio_pago_asociado_id) {
        const medioPago = await this.mediosPagoService.findOne(updateCuentaBancariaDto.medio_pago_asociado_id, establecimientoId);
        if (!medioPago) {
            throw new NotFoundException(`Medio de pago con ID "${updateCuentaBancariaDto.medio_pago_asociado_id}" no encontrado.`);
        }
    }
    return await this.cuentaBancariaRepository.save(cuenta); 
}





  async remove(id: string, establecimientoId: string): Promise<DeleteResult> {
    await this.findOne(id, establecimientoId);
    const result = await this.cuentaBancariaRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Cuenta bancaria con ID "${id}" no encontrada para eliminar.`);
    }
    return result;
  }
}
