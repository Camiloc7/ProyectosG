import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RolEntity } from './entities/rol.entity';
import { UsuarioEntity } from '../usuarios/entities/usuario.entity'; 
import { EstablecimientoEntity } from '../establecimientos/entities/establecimiento.entity'; 


@Module({
  imports: [
    TypeOrmModule.forFeature([RolEntity, UsuarioEntity, EstablecimientoEntity]), 
  ],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService, TypeOrmModule], 
})
export class RolesModule {} 