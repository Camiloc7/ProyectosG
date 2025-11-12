import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Inventory } from './entities/inventory.entity';
import { Location } from './entities/location.entity';
import { ProductLot } from './entities/product-lot.entity';
import { ProductSerial } from './entities/product-serial.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { InventoryOrchestrationService } from './inventory-orchestration.service';
import { InventoryOrchestrationController } from './inventory-orchestration.controller';
import { ProductsModule } from '../products/products.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { MovementsModule } from '../movements/movements.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      Location,
      ProductLot,
      ProductSerial,
      Product, 
      ProductVariant,
      Supplier, 
    ]),
    ProductsModule, 
    SuppliersModule,
    MovementsModule,
  ],
  controllers: [InventoryController, InventoryOrchestrationController],
  providers: [InventoryService, InventoryOrchestrationService],
  exports: [InventoryService, TypeOrmModule], 
  
})
export class InventoryModule {}