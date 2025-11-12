import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { BillOfMaterial, BillOfMaterialItem } from './entities/bill-of-material.entity';
import { ProductionOrder } from './entities/production-order.entity';
import { ProductionInput } from './entities/production-input.entity';
import { ProductionOutput } from './entities/production-output.entity';
import { QualityCheck } from './entities/quality-check.entity';
import { Product } from '../products/entities/product.entity';
import { ProductLot } from '../inventory/entities/product-lot.entity';
import { ProductSerial } from '../inventory/entities/product-serial.entity';
import { Location } from '../inventory/entities/location.entity';
import { User } from '../users/entities/user.entity';
import { MovementsModule } from '../movements/movements.module'; // Importa MovementsModule para usar su servicio

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillOfMaterial,
      BillOfMaterialItem,
      ProductionOrder,
      ProductionInput,
      ProductionOutput,
      QualityCheck,
      Product,
      ProductLot,
      ProductSerial,
      Location,
      User,
    ]),
    MovementsModule, // Importa el módulo de movimientos para que ProductionService pueda acceder a MovementsService
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService], // Si otros módulos necesitan interactuar con órdenes de producción, etc.
})
export class ProductionModule {}