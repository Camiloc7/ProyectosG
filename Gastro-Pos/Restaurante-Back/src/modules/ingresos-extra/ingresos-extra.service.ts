import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngresoExtraEntity } from './entities/ingreso-extra.entity';
import { CreateIngresoExtraDto } from './dto/create-ingreso-extra.dto';

@Injectable()
export class IngresosExtraService {
  constructor(
    @InjectRepository(IngresoExtraEntity)
    private readonly ingresoExtraRepository: Repository<IngresoExtraEntity>,
  ) {}

  async create(createIngresoExtraDto: CreateIngresoExtraDto): Promise<IngresoExtraEntity> {
    const nuevoIngreso = this.ingresoExtraRepository.create(createIngresoExtraDto);
    return this.ingresoExtraRepository.save(nuevoIngreso);
  }

  async findByCierreCajaId(cierreCajaId: string): Promise<IngresoExtraEntity[]> {
    return this.ingresoExtraRepository.find({ where: { cierre_caja_id: cierreCajaId } });
  }

  async sumByCierreCajaId(cierreCajaId: string): Promise<number> {
    const ingresos = await this.findByCierreCajaId(cierreCajaId);
    return ingresos.reduce((sum, ingreso) => sum + Number(ingreso.monto), 0);
  }

 async sumByCajaActiva(cierreCajaId: string): Promise<number> {
    const result = await this.ingresoExtraRepository
      .createQueryBuilder('ingreso')
      .select('SUM(ingreso.monto)', 'sum')
      .where('ingreso.cierre_caja_id = :cierreCajaId', { cierreCajaId })
      .getRawOne();

    return parseFloat(result?.sum || 0);
  }
}