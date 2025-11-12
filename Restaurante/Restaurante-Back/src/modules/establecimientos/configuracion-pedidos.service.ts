import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstablecimientoConfiguracionPedidoEntity } from './entities/configuracion-pedidos.entity';
import { CreateEstablecimientoConfiguracionPedidoDto } from './dto/create-configuracion-pedidos.dto';
import { UpdateEstablecimientoConfiguracionPedidoDto } from './dto/update-configuracion-pedidos.dto';

@Injectable()
export class EstablecimientoConfiguracionPedidoService {
  constructor(
    @InjectRepository(EstablecimientoConfiguracionPedidoEntity)
    private readonly configuracionPedidoRepository: Repository<EstablecimientoConfiguracionPedidoEntity>,
  ) {}

  async create(createDto: CreateEstablecimientoConfiguracionPedidoDto): Promise<EstablecimientoConfiguracionPedidoEntity> {
    const configuracion = this.configuracionPedidoRepository.create(createDto);
    return await this.configuracionPedidoRepository.save(configuracion);
  }

  async findOneByEstablecimientoId(establecimientoId: string): Promise<EstablecimientoConfiguracionPedidoEntity> {
    const configuracion = await this.configuracionPedidoRepository.findOne({
      where: { establecimiento_id: establecimientoId },
    });
    if (!configuracion) {
      throw new NotFoundException(`Configuración de pedido para el establecimiento ${establecimientoId} no encontrada.`);
    }
    return configuracion;
  }

  async update(establecimientoId: string, updateDto: UpdateEstablecimientoConfiguracionPedidoDto): Promise<EstablecimientoConfiguracionPedidoEntity> {
    const configuracion = await this.findOneByEstablecimientoId(establecimientoId);
    Object.assign(configuracion, updateDto);
    return await this.configuracionPedidoRepository.save(configuracion);
  }
}