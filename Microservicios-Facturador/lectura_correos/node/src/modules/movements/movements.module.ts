import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';
import { Movement } from './entities/movement.entity';
import { Inventory } from '../inventory/entities/inventory.entity'; // Necesario para actualizar inventario
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Location } from '../inventory/entities/location.entity';
import { ProductLot } from '../inventory/entities/product-lot.entity';
import { ProductSerial } from '../inventory/entities/product-serial.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movement,
      Inventory, 
      Product,
      ProductVariant,
      Location,
      ProductLot,
      ProductSerial,
      User,
    ]),
  ],
  controllers: [MovementsController],
  providers: [MovementsService],
  exports: [MovementsService],
})
export class MovementsModule {}