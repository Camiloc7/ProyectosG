import { Module, forwardRef } from '@nestjs/common'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediosPagoService } from './medios-pago.service';
import { MediosPagoController } from './medios-pago.controller';
import { MedioPagoEntity } from './entities/medio-pago.entity';

import { EstablecimientosModule } from '../establecimientos/establecimientos.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedioPagoEntity]),
    forwardRef(() => EstablecimientosModule),
    RolesModule,
  ],
  controllers: [MediosPagoController],
  providers: [MediosPagoService],
  exports: [MediosPagoService], 
})
export class MediosPagoModule {}


