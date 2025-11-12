import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MesasService } from './mesas.service';
import { MesasController } from './mesas.controller';
import { MesaEntity } from './entities/mesa.entity';
import { EstablecimientosModule } from '../establecimientos/establecimientos.module';
import { RolesModule } from '../roles/roles.module'; 
@Module({
  imports: [
    TypeOrmModule.forFeature([MesaEntity]), 
    EstablecimientosModule, 
    RolesModule, 
  ],
  controllers: [MesasController],
  providers: [MesasService],
  exports: [MesasService, TypeOrmModule], 
})
export class MesasModule {}