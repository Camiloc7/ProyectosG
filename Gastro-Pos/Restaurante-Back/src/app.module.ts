import { getSqlitePath } from "./common/patches/sqlite-path";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ScheduleModule } from "@nestjs/schedule";
import { join } from "path";
import { EstablecimientosModule } from "./modules/establecimientos/establecimientos.module";
import { RolesModule } from "./modules/roles/roles.module";
import { UsuariosModule } from "./modules/usuarios/usuarios.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CategoriasModule } from "./modules/categorias/categorias.module";
import { IngredientesModule } from "./modules/ingredientes/ingredientes.module";
import { ProveedoresModule } from "./modules/proveedores/proveedores.module";
import { ComprasModule } from "./modules/compras/compras.module";
import { ProductosModule } from "./modules/productos/productos.module";
import { MesasModule } from "./modules/mesas/mesas.module";
import { PedidosModule } from "./modules/pedidos/pedidos.module";
import { WebsocketModule } from "./websocket/websocket.module";
import { MediosPagoModule } from "./modules/medios-pago/medios-pago.module";
import { FacturasModule } from "./modules/facturas/facturas.module";
import { ReportesModule } from "./modules/reportes/reportes.module";
import { CierreCajaModule } from "./modules/cierre-caja/cierre-caja.module";
// import { SeederModule } from './seeder/seeder.module';
import { ArchivosModule } from "./modules/archivos/archivos.module";
import { CuentasBancariasModule } from "./modules/cuentas-banco/cuentas-bancarias.module";
import { MovimientosCuentasBancariasModule } from "./modules/movimientos-bancarios/movimientos-bancarios.module";
import { ClientesModule } from "./modules/clientes/clientes.module";
import { SyncModule } from "./sync/sync.module";
import { SyncChangelogEntity } from "./sync/entities/sync-changelog.entity";
import { GastosModule } from "./modules/gastos/gastos.module";
import { ImpresionModule } from "./modules/impresion/impresion.module";
import { IngresosExtraModule } from "./modules/ingresos-extra/ingresos-extra.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbEngine = configService.get<string>("DB_ENGINE") || "mysql";
        const synchronize =
          configService.get<string>("NODE_ENV") !== "production";

        const entitiesPath = join(__dirname, "**", "*.entity{.ts,.js}");
        let entitiesToLoad: (string | Function)[] = [entitiesPath];

        if (dbEngine === "sqlite") {
          console.log("Using SQLite database...");
          entitiesToLoad.push(SyncChangelogEntity);
          return {
            type: "sqlite",
            database: join(
              process.cwd(),
              configService.get<string>("DB_LOCAL_FILENAME") ||
                "sistema_pos.sqlite"
            ),
            entities: entitiesToLoad,
            synchronize: synchronize,
            logging: configService.get<string>("NODE_ENV") !== "production",
            // logging: false,
            extra: {
              dateStrings: true,
            },
          };
        } else {
          console.log("Using MySQL database...");
          return {
            type: "mysql",
            host: configService.get<string>("DB_HOST") || "localhost",
            port: parseInt(configService.get<string>("DB_PORT") || "3306", 10),
            username: configService.get<string>("DB_USERNAME") || "root",
            password: configService.get<string>("DB_PASSWORD") || "password",
            database: configService.get<string>("DB_DATABASE") || "sistema_pos",
            entities: [entitiesPath],
            synchronize: synchronize,
            // logging: configService.get<string>("NODE_ENV") !== "production",
            logging: false,
            extra: {
              decimalAsNumber: true,
            },
          };
        }
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads",
    }),
    SyncModule,
    RolesModule,
    // SeederModule,
    AuthModule,
    EstablecimientosModule,
    UsuariosModule,
    CategoriasModule,
    IngredientesModule,
    ProveedoresModule,
    ComprasModule,
    ProductosModule,
    MesasModule,
    PedidosModule,
    WebsocketModule,
    CuentasBancariasModule,
    MovimientosCuentasBancariasModule,
    MediosPagoModule,
    FacturasModule,
    ReportesModule,
    CierreCajaModule,
    ArchivosModule,
    ClientesModule,
    ImpresionModule,
    GastosModule,
    IngresosExtraModule,
  ],
})
export class AppModule {}
