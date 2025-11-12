import { Module, forwardRef } from '@nestjs/common'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstablecimientosService } from './establecimientos.service';
import { EstablecimientosController } from './establecimientos.controller';
import { EstablecimientoEntity } from './entities/establecimiento.entity';
import { EstablecimientoConfiguracionPedidoEntity } from './entities/configuracion-pedidos.entity';
import { EstablecimientoConfiguracionPedidoService } from './configuracion-pedidos.service';
import { EstablecimientoConfiguracionPedidoController } from './configuracion-pedidos.controller';
import { RolesModule } from '../roles/roles.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { MediosPagoModule } from '../medios-pago/medios-pago.module';
import { CuentasBancariasModule } from '../cuentas-banco/cuentas-bancarias.module'; 
import { ArchivosModule } from '../archivos/archivos.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([EstablecimientoEntity, EstablecimientoConfiguracionPedidoEntity]),
    RolesModule,
    CategoriasModule,
    forwardRef(() => MediosPagoModule),
    forwardRef(() => CuentasBancariasModule),
    forwardRef(() => ArchivosModule),
  ],
  controllers: [
    EstablecimientosController,
    EstablecimientoConfiguracionPedidoController,
  ],
  providers: [EstablecimientosService, EstablecimientoConfiguracionPedidoService],
  exports: [
    EstablecimientosService,
    EstablecimientoConfiguracionPedidoService,
  ],
})
export class EstablecimientosModule {}
