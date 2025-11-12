import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompraIngredienteEntity } from './entities/compra-ingrediente.entity';
import { ComprasService } from './compras.service';
import { ComprasController } from './compras.controller';
import { IngredientesModule } from '../ingredientes/ingredientes.module'; 
import { ProveedoresModule } from '../proveedores/proveedores.module'; 
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompraIngredienteEntity]),
    IngredientesModule, 
    ProveedoresModule, 
    RolesModule,
  ],
  controllers: [ComprasController],
  providers: [ComprasService],
  exports: [ComprasService, TypeOrmModule],
})
export class ComprasModule {}