import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { ClienteEntity } from './entities/cliente.entity';
import { RolesModule } from '../roles/roles.module';
import { EstablecimientosModule } from '../establecimientos/establecimientos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClienteEntity]),
        RolesModule,
        EstablecimientosModule, 
  ],
  providers: [ClientesService],
  controllers: [ClientesController],
  exports: [ClientesService, TypeOrmModule], 
})
export class ClientesModule {}