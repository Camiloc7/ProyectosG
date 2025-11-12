import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturasService } from './facturas.service';
import { FacturasController } from './facturas.controller';
import { FacturaEntity } from './entities/factura.entity';
import { FacturaPedidoEntity } from './entities/factura-pedido.entity';
import { PedidosModule } from '../pedidos/pedidos.module';
import { EstablecimientosModule } from '../establecimientos/establecimientos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ClienteEntity } from '../clientes/entities/cliente.entity';
import { FacturaPagosCliente } from './entities/factura-pagos-cliente.entity';
import { PagoEntity } from '../pagos/entities/pago.entity';
import { RolesModule } from '../roles/roles.module';
import { CuentasBancariasModule } from '../cuentas-banco/cuentas-bancarias.module';
import { FacturasScheduler } from './facturas.scheduler';
import { FacturaRetryEntity } from './entities/factura-retry.entity';
import { ImpresionModule } from '../impresion/impresion.module';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FacturaEntity,
      FacturaPedidoEntity,
      FacturaRetryEntity,
      ClienteEntity,
      FacturaPagosCliente,
      PagoEntity,
      
    ]),
    PedidosModule,
    EstablecimientosModule,
    UsuariosModule,
    RolesModule,
    WebsocketModule, 
        CuentasBancariasModule, 
    forwardRef(() => ImpresionModule), 

  ],
  controllers: [FacturasController],
  providers: [FacturasService, FacturasScheduler],
  exports: [FacturasService],
})
export class FacturasModule {}

