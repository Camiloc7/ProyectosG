import { Injectable, ConflictException, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { EstablecimientoEntity } from './entities/establecimiento.entity';
import { CreateEstablecimientoDto } from './dto/create-establecimiento.dto';
import { UpdateEstablecimientoDto } from './dto/update-establecimiento.dto';
import { EstablecimientoConfiguracionPedidoService } from './configuracion-pedidos.service';
import { CreateEstablecimientoConfiguracionPedidoDto } from './dto/create-configuracion-pedidos.dto';
import { CreateMedioPagoDto } from '../medios-pago/dto/create-medio-pago.dto';
import { CreateCuentaBancariaDto } from '../cuentas-banco/dto/create-cuenta-bancaria.dto';
import { v4 as uuidv4 } from 'uuid';
import { MediosPagoService } from '../medios-pago/medios-pago.service';
import { CuentasBancariasService } from '../cuentas-banco/cuentas-bancarias.service';
import { CloudinaryService } from '../archivos/cloudinary.service';

@Injectable()
export class EstablecimientosService {
  constructor(
    @InjectRepository(EstablecimientoEntity)
    private readonly establecimientoRepository: Repository<EstablecimientoEntity>,
    private readonly establecimientoConfiguracionPedidoService: EstablecimientoConfiguracionPedidoService,
    private readonly mediosPagoService: MediosPagoService,
    private readonly cuentasBancariasService: CuentasBancariasService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Crea un nuevo establecimiento, generando su clave de licencia y fecha de expiración.
   * La fecha de expiración puede ser provista o se calcula por defecto (1 año).
   * @param createEstablecimientoDto DTO para crear el establecimiento.
   * @returns El establecimiento creado.
   */
  async create(createEstablecimientoDto: CreateEstablecimientoDto): Promise<EstablecimientoEntity> {
    const { fecha_expiracion, nit, ...rest } = createEstablecimientoDto;
    let idPorNit = 1;
    if (nit) {
      const establecimientosConMismoNit = await this.establecimientoRepository.find({
        where: { nit: nit }
      });
      idPorNit = establecimientosConMismoNit.length + 1;
    }

    const licenciaKey = uuidv4();
    const licenciaActiva = true;

    let fechaExpiracion: Date;
    if (fecha_expiracion) {
      fechaExpiracion = new Date(fecha_expiracion);
    } else {
      const hoy = new Date();
      fechaExpiracion = new Date(hoy);
      fechaExpiracion.setUTCFullYear(hoy.getUTCFullYear() + 1);
      fechaExpiracion.setUTCHours(0, 0, 0, 0);
    }
    const establecimiento = this.establecimientoRepository.create({
      ...rest,
      nit,
      id_por_nit: idPorNit,
      licencia_key: licenciaKey,
      licencia_activa: licenciaActiva,
      fecha_expiracion: fechaExpiracion,
    });
    
    const savedEstablecimiento = await this.establecimientoRepository.save(establecimiento);
    
    const defaultConfig: CreateEstablecimientoConfiguracionPedidoDto = {
      establecimiento_id: savedEstablecimiento.id,
    };
    await this.establecimientoConfiguracionPedidoService.create(defaultConfig);

    try {
      let medioPagoEfectivo = await this.mediosPagoService.findByName('Efectivo', savedEstablecimiento.id);
      if (!medioPagoEfectivo) {
        const createMedioPagoEfectivoDto: CreateMedioPagoDto = {
          establecimiento_id: savedEstablecimiento.id,
          nombre: 'Efectivo',
          es_efectivo: true,
          activo: true,
        };
        medioPagoEfectivo = await this.mediosPagoService.create(createMedioPagoEfectivoDto);
      }
      const createCajaEfectivoDto: CreateCuentaBancariaDto = {
        medio_pago_asociado_id: medioPagoEfectivo.id,
        nombre_banco: 'Caja Principal',
        tipo_cuenta: 'Efectivo',
        numero_cuenta: `CAJA-${savedEstablecimiento.id}`,
        activa: true,
      };
      await this.cuentasBancariasService.create(createCajaEfectivoDto, savedEstablecimiento.id);
    } catch (error) {
      console.error(`Error al crear medio de pago o cuenta de efectivo por defecto para el establecimiento ${savedEstablecimiento.id}:`, error);
    }

    return savedEstablecimiento;
  }

  async findByName(nombre: string): Promise<EstablecimientoEntity | null> {
    return await this.establecimientoRepository.findOneBy({ nombre });
  }

  async findAll(activo?: boolean): Promise<EstablecimientoEntity[]> {
    const whereCondition: any = {};
    if (activo !== undefined) {
      whereCondition.activo = activo;
    }
    return await this.establecimientoRepository.find({ where: whereCondition, order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<EstablecimientoEntity> {
    const establecimiento = await this.establecimientoRepository.findOne({
      where: { id },
      relations: ['configuracionPedido'],
    });
    if (!establecimiento) {
      throw new NotFoundException(`Establecimiento con ID "${id}" no encontrado.`);
    }
    return establecimiento;
  }
 

  async update(id: string, updateEstablecimientoDto: UpdateEstablecimientoDto): Promise<EstablecimientoEntity> {
  const establecimiento = await this.findOne(id);
  const oldLogoUrl = establecimiento.logo_url;
  const nuevoLogoUrl = updateEstablecimientoDto.logo_url;
  if (oldLogoUrl && (nuevoLogoUrl === null || (nuevoLogoUrl !== undefined && nuevoLogoUrl !== oldLogoUrl))) {
    const publicId = oldLogoUrl.split('/').pop()?.split('.')[0];
    if (publicId) {
      try {
        await this.cloudinaryService.deleteFile(publicId);
      } catch (error) {
        console.error(`Error al eliminar el logo de Cloudinary para el establecimiento ${id}:`, error);
      }
    }
  }
  Object.assign(establecimiento, updateEstablecimientoDto);
  if (updateEstablecimientoDto.nit && updateEstablecimientoDto.nit !== establecimiento.nit) {
    const establecimientosConMismoNit = await this.establecimientoRepository.find({
      where: { nit: updateEstablecimientoDto.nit }
    });
    establecimiento.id_por_nit = establecimientosConMismoNit.length + 1;
  }
  return await this.establecimientoRepository.save(establecimiento);
}








  async remove(id: string): Promise<DeleteResult> {
    const result = await this.establecimientoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Establecimiento con ID "${id}" no encontrado para eliminar.`);
    }
    return result;
  }






  /**
   * Activa una licencia con una clave de producto y un ID de dispositivo.
   * @param licenciaKey La clave de licencia única.
   * @param dispositivoId El ID del dispositivo (ej. MAC Address).
   * @returns El establecimiento con la licencia actualizada.
   */
  async activateLicense(licenciaKey: string, dispositivoId: string): Promise<EstablecimientoEntity> {
    const establecimiento = await this.establecimientoRepository.findOneBy({ licencia_key: licenciaKey });

    if (!establecimiento) {
      throw new NotFoundException('Clave de licencia no encontrada.');
    }

    if (establecimiento.dispositivo_id && establecimiento.dispositivo_id !== dispositivoId) {
      throw new ConflictException('Esta licencia ya está activa en otro dispositivo.');
    }
    const hoy = new Date();
    if (!establecimiento.licencia_activa || (establecimiento.fecha_expiracion && establecimiento.fecha_expiracion <= hoy)) {
      throw new UnauthorizedException('La licencia ha expirado o no está activa.');
    }

    establecimiento.dispositivo_id = dispositivoId;
    establecimiento.fecha_activacion = new Date();
    return this.establecimientoRepository.save(establecimiento);
  }



  /**
   * Verifica el estado de la licencia de un establecimiento por su ID.
   * @param establecimientoId El ID del establecimiento.
   * @returns `true` si la licencia es válida, `false` en caso contrario.
   */

async verifyLicense(establecimientoId: string, dispositivoId: string): Promise<boolean> {
  const establecimiento = await this.establecimientoRepository.findOneBy({ id: establecimientoId });

  if (!establecimiento) {
    return false; 
  }
  if (establecimiento.dispositivo_id && establecimiento.dispositivo_id !== dispositivoId) {
    throw new UnauthorizedException('La licencia ha sido activada en otro dispositivo.');
  }
  const hoy = new Date();
  const fechaExpiracion = new Date(establecimiento.fecha_expiracion);

  const isLicenseValid = establecimiento.licencia_activa && fechaExpiracion.getTime() > hoy.getTime();
   
  if (establecimiento.licencia_activa && fechaExpiracion.getTime() <= hoy.getTime()) {
    establecimiento.licencia_activa = false;
    await this.establecimientoRepository.save(establecimiento);
    return false;
  }

  return isLicenseValid;
}

  /**
   * Método para que un administrador pueda renovar o cambiar la fecha de expiración de una licencia.
   * @param id El ID del establecimiento.
   * @param nuevaFechaExpiracion La nueva fecha de expiración.
   * @returns El establecimiento actualizado.
   */
  async updateLicenseExpiration(id: string, nuevaFechaExpiracion: Date): Promise<EstablecimientoEntity> {
    const establecimiento = await this.findOne(id);
    establecimiento.fecha_expiracion = nuevaFechaExpiracion;
    establecimiento.licencia_activa = true;
    return this.establecimientoRepository.save(establecimiento);
  }

  /**
   * Método para que un administrador pueda desactivar manualmente una licencia.
   * @param id El ID del establecimiento.
   * @returns El establecimiento actualizado.
   */
  async deactivateLicense(id: string): Promise<EstablecimientoEntity> {
    const establecimiento = await this.findOne(id);
    establecimiento.licencia_activa = false;
    return this.establecimientoRepository.save(establecimiento);
  }


async listarAgrupadosPorNit(): Promise<any[]> {
    const establecimientos = await this.establecimientoRepository
        .createQueryBuilder('e')
        .select([
            'e.nit AS nit',
            "GROUP_CONCAT(CONCAT('{ \"id\": \"', e.id, '\", \"id_por_nit\": ', e.id_por_nit, ', \"nombre\": \"', e.nombre, '\" }')) AS establecimientos_str"
        ])
        .groupBy('e.nit')
        .orderBy('e.nit', 'ASC')
        .getRawMany();
    return establecimientos.map(item => {
        const jsonString = `[${item.establecimientos_str}]`;
        try {
            return {
                nit: item.nit,
                establecimientos: JSON.parse(jsonString),
            };
        } catch (error) {
            console.error('Error al parsear JSON de GROUP_CONCAT:', error);
            return {
                nit: item.nit,
                establecimientos: [], 
            };
        }
    });
}


async listarPorNit(nit: string): Promise<any> {
  const establecimientos = await this.establecimientoRepository.find({
    where: { nit },
    order: { id_por_nit: 'ASC' },
    relations: ['configuracionPedido', 'mediosPago', 'cuentasBancarias'], 
  });

  if (!establecimientos || establecimientos.length === 0) {
    throw new NotFoundException(`No se encontraron establecimientos con el NIT "${nit}".`);
  }

  return {
    nit,
    establecimientos, 
  };
}




}