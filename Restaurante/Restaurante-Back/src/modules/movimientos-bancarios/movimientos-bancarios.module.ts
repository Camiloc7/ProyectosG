import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientosCuentasBancariasService } from './movimientos-bancarios.service';
import {  MovimientoBancarioEntity } from './entities/movimiento-bancario.entity';
import { RolesModule } from '../roles/roles.module'; 
import { CuentasBancariasModule } from '../cuentas-banco/cuentas-bancarias.module';
import { MovimientosCuentasBancariasController } from './movimientos-bancarios.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ MovimientoBancarioEntity]),
    CuentasBancariasModule, 
    RolesModule, 
  ],
  controllers: [MovimientosCuentasBancariasController],
  providers: [MovimientosCuentasBancariasService],
  exports: [MovimientosCuentasBancariasService, TypeOrmModule], 
})
export class MovimientosCuentasBancariasModule {}