import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GastoEntity } from './entities/gasto.entity';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { CierreCajaService } from '../cierre-caja/cierre-caja.service';

@Injectable()
export class GastosService {
  constructor(
    @InjectRepository(GastoEntity)
    private readonly gastoRepository: Repository<GastoEntity>,
  ) {}

  async create(createGastoDto: CreateGastoDto): Promise<GastoEntity> {
    const nuevoGasto = this.gastoRepository.create(createGastoDto);
    return this.gastoRepository.save(nuevoGasto);
  }

   async createWithCierre(
    monto: number,
    descripcion: string,
    usuarioRegistroId: string,
    establecimientoId: string,
    cierreCajaId: string,
  ): Promise<GastoEntity> {
    const nuevoGasto = this.gastoRepository.create({
      monto,
      descripcion,
      usuario_registro_id: usuarioRegistroId,
      establecimiento_id: establecimientoId,
      cierre_caja_id: cierreCajaId,
    });
    return this.gastoRepository.save(nuevoGasto);
  }



  async findByCierreCajaId(cierreCajaId: string): Promise<GastoEntity[]> {
    return this.gastoRepository.find({ where: { cierre_caja_id: cierreCajaId } });
  }

  async sumByCierreCajaId(cierreCajaId: string): Promise<number> {
    const gastos = await this.findByCierreCajaId(cierreCajaId);
    return gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0);
  }
}