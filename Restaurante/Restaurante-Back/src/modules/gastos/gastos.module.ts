import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';
import { GastoEntity } from './entities/gasto.entity';
import { CierreCajaModule } from '../cierre-caja/cierre-caja.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GastoEntity]),
    forwardRef(() => CierreCajaModule), 
    RolesModule,
  ],
  controllers: [GastosController],
  providers: [GastosService],
  exports: [GastosService, TypeOrmModule], 
})
export class GastosModule {}