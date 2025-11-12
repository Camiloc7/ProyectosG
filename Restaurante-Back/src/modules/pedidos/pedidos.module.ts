import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { PedidoEntity } from './entities/pedido.entity';
import { PedidoItemEntity } from './entities/pedido-item.entity';
import { EstablecimientosModule } from '../establecimientos/establecimientos.module';
import { MesasModule } from '../mesas/mesas.module';
import { ProductosModule } from '../productos/productos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { RolesModule } from '../roles/roles.module'; 
import { WebsocketModule } from '../../websocket/websocket.module'; 
import { IngredientesModule } from '../ingredientes/ingredientes.module';
import { FacturaPedidoEntity } from '../facturas/entities/factura-pedido.entity';
import { ImpresionModule } from '../impresion/impresion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PedidoEntity, PedidoItemEntity, FacturaPedidoEntity]), 
    forwardRef(() => EstablecimientosModule), 
    forwardRef(() => MesasModule),
    forwardRef(() => ProductosModule), 
    forwardRef(() => UsuariosModule), 
    
    forwardRef(() => ImpresionModule), 
    RolesModule, 
    WebsocketModule, 
    IngredientesModule,
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService, TypeOrmModule], 
})
export class PedidosModule {}