import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImpresoraEntity } from './entities/impresora.entity';
import { ImpresionService } from './impresion.service';
import { ImpresionController } from './impresion.controller';
import { PedidoEntity } from '../pedidos/entities/pedido.entity';
import { EstablecimientoEntity } from '../establecimientos/entities/establecimiento.entity';
import { PedidoItemEntity } from '../pedidos/entities/pedido-item.entity';
import { PedidosModule } from '../pedidos/pedidos.module';
import { RolesModule } from '../roles/roles.module';
import { FacturasModule } from '../facturas/facturas.module';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImpresoraEntity, PedidoEntity, EstablecimientoEntity, PedidoItemEntity]),
    forwardRef(() => PedidosModule),
    RolesModule,
    WebsocketModule,
  ],
  providers: [ImpresionService],
  controllers: [ImpresionController],
  exports: [ImpresionService], 
})
export class ImpresionModule {}