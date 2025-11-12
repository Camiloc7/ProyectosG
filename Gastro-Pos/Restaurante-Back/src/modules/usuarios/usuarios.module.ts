import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { UsuarioEntity } from './entities/usuario.entity';
import { EstablecimientoEntity } from '../establecimientos/entities/establecimiento.entity';
import { RolEntity } from '../roles/entities/rol.entity'; 
import { EstablecimientosModule } from '../establecimientos/establecimientos.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioEntity, EstablecimientoEntity, RolEntity]), 
    EstablecimientosModule, 
    RolesModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService, TypeOrmModule],
})
export class UsuariosModule {}