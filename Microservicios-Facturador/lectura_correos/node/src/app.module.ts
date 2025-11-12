import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';
import { validate } from './config/env.validation';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { InventoryModule } from './modules/inventory/inventory.module'; 
import { MovementsModule } from './modules/movements/movements.module'; 
import { ProductionModule } from './modules/production/production.module'; 
import { SalesModule } from './modules/sales/sales.module';
import { AuthModule } from './modules/auth/auth.module'; 
import { InvoicesModule } from './modules/invoices/invoices.module';
import { SupplierCausationModule } from './modules/supplier-causation/supplier-causation.module';
import { FixedAssetsModule } from './modules/fixed-assets/fixed-assets.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validate,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
      inject: [ConfigService],
    }),
    UsersModule,
    ProductsModule, 
    SuppliersModule, 
    InventoryModule, 
    MovementsModule, 
    ProductionModule, 
    SalesModule, 
    AuthModule, 
    InvoicesModule, 
    SupplierCausationModule,
    FixedAssetsModule,
  ],
})
export class AppModule {}





