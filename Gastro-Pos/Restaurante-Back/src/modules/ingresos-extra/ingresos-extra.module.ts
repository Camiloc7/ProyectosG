import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CierreCajaModule } from '../cierre-caja/cierre-caja.module';
import { RolesModule } from '../roles/roles.module';
import { IngresoExtraEntity } from './entities/ingreso-extra.entity';
import { IngresosExtraController } from './ingresos-extra.controller';
import { IngresosExtraService } from './ingresos-extra.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IngresoExtraEntity]),
    forwardRef(() => CierreCajaModule), 
    RolesModule,
  ],
  controllers: [IngresosExtraController],
  providers: [IngresosExtraService],
  exports: [IngresosExtraService, TypeOrmModule], 
})
export class IngresosExtraModule {}