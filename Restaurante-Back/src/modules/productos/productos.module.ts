import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { ProductoEntity } from './entities/producto.entity';
import { RecetaProductoEntity } from './entities/receta-producto.entity';
import { EstablecimientosModule } from '../establecimientos/establecimientos.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { IngredientesModule } from '../ingredientes/ingredientes.module';
import { RolesModule } from '../roles/roles.module';
import { ProductoConfigurableEntity } from './entities/producto-configurable.entity';
import { ConfiguracionOpcion } from './entities/configuracion-opcion.entity';
import { OpcionValor } from './entities/opcion-valor.entity';
import { OpcionValorPrecio } from './entities/opcion-valor-precio.entity';
import { OpcionValorIngrediente } from './entities/opcion-valor-ingrediente.entity';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductoEntity,
      RecetaProductoEntity,
      ProductoConfigurableEntity,
      ConfiguracionOpcion,
      OpcionValor,
      OpcionValorPrecio,
      OpcionValorIngrediente,
    ]),
    EstablecimientosModule,
    CategoriasModule,
    IngredientesModule,
    RolesModule,
    forwardRef(() => PedidosModule),
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService, TypeOrmModule],
})
export class ProductosModule {}

