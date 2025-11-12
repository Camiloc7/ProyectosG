import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientesService } from './ingredientes.service';
import { IngredientesController } from './ingredientes.controller';
import { IngredienteEntity } from './entities/ingrediente.entity';
import { EstablecimientosModule } from '../establecimientos/establecimientos.module'; 
import { RolesModule } from '../roles/roles.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([IngredienteEntity]), 
    EstablecimientosModule, 
    RolesModule, 
  ],
  controllers: [IngredientesController],
  providers: [IngredientesService],
  exports: [IngredientesService, TypeOrmModule], 
})
export class IngredientesModule {}