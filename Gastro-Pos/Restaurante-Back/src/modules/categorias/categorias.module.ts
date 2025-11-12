import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasService } from './categorias.service';
import { CategoriasController } from './categorias.controller';
import { CategoriaEntity } from './entities/categoria.entity';
import { EstablecimientoEntity } from '../establecimientos/entities/establecimiento.entity'; 
import { EstablecimientosModule } from '../establecimientos/establecimientos.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoriaEntity, EstablecimientoEntity]),
    forwardRef(() => EstablecimientosModule),
    RolesModule,
  ],
  controllers: [CategoriasController],
  providers: [CategoriasService],
  exports: [CategoriasService, TypeOrmModule],
})
export class CategoriasModule {}

