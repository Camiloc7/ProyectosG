import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProveedorEntity } from './entities/proveedor.entity';
import { ProveedoresService } from './proveedores.service';
import { ProveedoresController } from './proveedores.controller';
import { RolesModule } from '../roles/roles.module';
import { EstablecimientoEntity } from '../establecimientos/entities/establecimiento.entity'; 
import { EstablecimientosModule } from '../establecimientos/establecimientos.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([ProveedorEntity, EstablecimientoEntity]),
    RolesModule,
    EstablecimientosModule,
  ],
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
  exports: [ProveedoresService, TypeOrmModule],
})
export class ProveedoresModule {}