import { Module, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SeederService } from './seeder.service';
import * as fs from 'fs';
import * as path from 'path';
import { EstablecimientosModule } from '../modules/establecimientos/establecimientos.module';
import { UsuariosModule } from '../modules/usuarios/usuarios.module';
import { RolesModule } from '../modules/roles/roles.module';
import { MediosPagoModule } from '../modules/medios-pago/medios-pago.module';
import { CategoriasModule } from '../modules/categorias/categorias.module';
import { MesasModule } from '../modules/mesas/mesas.module';
import { ProveedoresModule } from '../modules/proveedores/proveedores.module';
import { IngredientesModule } from '../modules/ingredientes/ingredientes.module';
import { ProductosModule } from '../modules/productos/productos.module';
import { ComprasModule } from '../modules/compras/compras.module';
import { PedidosModule } from '../modules/pedidos/pedidos.module';
import { FacturasModule } from '../modules/facturas/facturas.module';
import { ClientesModule } from '../modules/clientes/clientes.module';
import { CuentasBancariasModule } from '../modules/cuentas-banco/cuentas-bancarias.module';
import { CierreCajaModule } from '../modules/cierre-caja/cierre-caja.module';


const SEED_DATA_FILE = path.resolve(__dirname, 'seed-data.json');

@Module({
  imports: [
    EstablecimientosModule,
    UsuariosModule,
    RolesModule,
    MediosPagoModule,
    CategoriasModule,
    MesasModule,
    ProveedoresModule,
    IngredientesModule,
    ProductosModule,
    ComprasModule,
    PedidosModule,
    FacturasModule,
    ClientesModule,
    CuentasBancariasModule,
    CierreCajaModule,
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule implements OnModuleInit {
  constructor(private readonly seederService: SeederService) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'development') {
      console.log('--- SeederModule: Ejecutando seeder al inicio de la aplicación (NODE_ENV=development) ---');
      try {
        // const seedData = JSON.parse(fs.readFileSync(SEED_DATA_FILE, 'utf8')); 
        await this.seederService.seed(); 
      } catch (error) {
        console.error('ERROR: Fallo al ejecutar el seeder desde SeederModule.onModuleInit:', error);
      }
    } else {
      console.log('--- SeederModule: Seeder no ejecutado al inicio (NODE_ENV no es "development"). Ejecutar "npm run seed" para seeding manual. ---');
    }
  }
}
