import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CierreCajaService } from './cierre-caja.service';
import { CierreCajaController }  from './cierre-caja.controller';
import { CierreCajaEntity } from './entities/cierre-caja.entity';
import { FacturaEntity } from '../facturas/entities/factura.entity'; 
import { PagoEntity } from '../pagos/entities/pago.entity';
import { EstablecimientoEntity } from '../establecimientos/entities/establecimiento.entity'; 
import { UsuarioEntity } from '../usuarios/entities/usuario.entity'; 
import { RolesModule } from '../roles/roles.module'; 
import { RolesGuard } from '../../common/guards/roles.guard'; 
import { GastosModule } from '../gastos/gastos.module';
import { CierreCajaScheduler } from './cierre-caja.scheduler';
import { IngresosExtraModule } from '../ingresos-extra/ingresos-extra.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CierreCajaEntity,
      FacturaEntity, 
      PagoEntity,     
      EstablecimientoEntity, 
      UsuarioEntity, 
    ]),
    RolesModule, 
        forwardRef(() => GastosModule), 
        forwardRef(() => IngresosExtraModule), 

  ],
  providers: [
    CierreCajaService,
    CierreCajaScheduler, 
    RolesGuard, 
  ], 
  controllers: [CierreCajaController],
  exports: [CierreCajaService], 
})
export class CierreCajaModule {}