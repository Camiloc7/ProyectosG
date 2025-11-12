import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeederService } from './seeder.service';
import { UsuarioEntity } from '../modules/usuarios/entities/usuario.entity';
import { EstablecimientoEntity } from '../modules/establecimientos/entities/establecimiento.entity';
import { RolEntity } from '../modules/roles/entities/rol.entity';
import { CategoriaEntity } from '../modules/categorias/entities/categoria.entity';
import { IngredienteEntity } from '../modules/ingredientes/entities/ingrediente.entity';
import { MedioPagoEntity } from '../modules/medios-pago/entities/medio-pago.entity';
import { MesaEntity } from '../modules/mesas/entities/mesa.entity';
import { ProductoEntity } from '../modules/productos/entities/producto.entity';
import { RecetaProductoEntity } from '../modules/productos/entities/receta-producto.entity';
import { ProveedorEntity } from '../modules/proveedores/entities/proveedor.entity';
import { CompraIngredienteEntity } from '../modules/compras/entities/compra-ingrediente.entity';
import { PedidoEntity } from '../modules/pedidos/entities/pedido.entity';
import { PedidoItemEntity } from '../modules/pedidos/entities/pedido-item.entity';
import { FacturaEntity } from '../modules/facturas/entities/factura.entity';
import { FacturaPedidoEntity } from '../modules/facturas/entities/factura-pedido.entity';
import { PagoEntity } from '../modules/pagos/entities/pago.entity';
import { ClienteEntity } from '../modules/clientes/entities/cliente.entity';
import { FacturaPagosCliente } from '../modules/facturas/entities/factura-pagos-cliente.entity';
import { EstablecimientoConfiguracionPedidoEntity } from '../modules/establecimientos/entities/configuracion-pedidos.entity';
import { CierreCajaEntity } from '../modules/cierre-caja/entities/cierre-caja.entity';
import { CuentaBancariaEntity } from '../modules/cuentas-banco/entities/cuenta-bancaria.entity';
import { MovimientoBancarioEntity } from 'src/modules/movimientos-bancarios/entities/movimiento-bancario.entity';
import { AuthModule } from 'src/modules/auth/auth.module';

const AppDataSource = new DataSource({
  type: process.env.DB_TYPE as any,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    AuthModule,
    UsuarioEntity,
    EstablecimientoEntity,
    RolEntity,
    CategoriaEntity,
    IngredienteEntity,
    MedioPagoEntity,
    MesaEntity,
    ProductoEntity,
    RecetaProductoEntity,
    ProveedorEntity,
    CompraIngredienteEntity,
    PedidoEntity,
    PedidoItemEntity,
    FacturaEntity,
    FacturaPedidoEntity,
    PagoEntity,
    ClienteEntity,
    FacturaPagosCliente,
    EstablecimientoConfiguracionPedidoEntity,
    CierreCajaEntity,
    CuentaBancariaEntity,
    MovimientoBancarioEntity,
  ],
  synchronize: true,
  logging: false,
});

const SEED_DATA_FILE = path.resolve(__dirname, 'seed-data.json');

export async function runSeederStandalone() {
  let app: INestApplicationContext | undefined = undefined;
  let activeDataSource: DataSource | undefined = undefined;

  try {
    console.log('Iniciando NestJS Application Context para el seeder (ejecución independiente)...');
    app = await NestFactory.createApplicationContext(AppModule);
    console.log('NestJS Application Context iniciado.');

    activeDataSource = AppDataSource;
    if (!activeDataSource.isInitialized) {
      await activeDataSource.initialize();
      console.log('\n--- Conexión a la base de datos establecida para el seeder (ejecución independiente).');
    } else {
      console.log('\n--- Conexión a la base de datos ya inicializada (ejecución independiente).');
    }

    const seederService = app.get(SeederService);
    console.log('Datos de seed cargados (gestionado por SeederService).');
    await seederService.seed();
  } catch (error) {
    console.error('ERROR FATAL EN EL SEEDER (inicialización de NestJS o DB):', error);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
      console.log('NestJS Application Context cerrado.');
    }
    if (activeDataSource && activeDataSource.isInitialized) {
      await activeDataSource.destroy();
      console.log('Conexión a la base de datos cerrada (seeder independiente).');
    }
  }
}

if (require.main === module) {
  runSeederStandalone().catch(error => {
    console.error('Error al ejecutar el seeder directamente:', error);
    process.exit(1);
  });
}

