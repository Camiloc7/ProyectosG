import { Module, forwardRef } from '@nestjs/common'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CuentasBancariasController } from './cuentas-bancarias.controller';
import { CuentaBancariaEntity } from './entities/cuenta-bancaria.entity';
import { EstablecimientosModule } from '../establecimientos/establecimientos.module';
import { MediosPagoModule } from '../medios-pago/medios-pago.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CuentaBancariaEntity]),
    forwardRef(() => EstablecimientosModule),
    forwardRef(() => MediosPagoModule),
    RolesModule,
  ],
  controllers: [CuentasBancariasController],
  providers: [CuentasBancariasService],
  exports: [CuentasBancariasService], 
})
export class CuentasBancariasModule {}


