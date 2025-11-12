  import { Module } from '@nestjs/common';
  import { TypeOrmModule } from '@nestjs/typeorm'; 
  import { ReportesService } from './reportes.service';
  import { ReportesController } from './reportes.controller';
  import { FacturaEntity } from '../facturas/entities/factura.entity';
  import { PagoEntity } from '../pagos/entities/pago.entity';
  import { FacturasModule } from '../facturas/facturas.module';
  import { PedidosModule } from '../pedidos/pedidos.module';
  import { ProductosModule } from '../productos/productos.module';
  import { EstablecimientosModule } from '../establecimientos/establecimientos.module';
  import { RolesModule } from '../roles/roles.module';
  import { UsuariosModule } from '../usuarios/usuarios.module';
  import { IngredientesModule } from '../ingredientes/ingredientes.module';
  import { CierreCajaEntity } from '../cierre-caja/entities/cierre-caja.entity';
import { GastosModule } from '../gastos/gastos.module';
import { IngresosExtraModule } from '../ingresos-extra/ingresos-extra.module';


  @Module({
    imports: [
      TypeOrmModule.forFeature([
        FacturaEntity,
        PagoEntity,
        CierreCajaEntity,
      ]),
      FacturasModule,
      PedidosModule,
      ProductosModule,
      EstablecimientosModule,
      RolesModule,
      UsuariosModule,
      IngredientesModule,
    GastosModule, 
    IngresosExtraModule, 
    ],
    controllers: [ReportesController],
    providers: [ReportesService],
    exports: [ReportesService],
  })
  export class ReportesModule {}