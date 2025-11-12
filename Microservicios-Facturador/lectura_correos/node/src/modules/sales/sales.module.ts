import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Customer } from './entities/customer.entity';
import { Invoice } from './entities/invoice.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductLot } from '../inventory/entities/product-lot.entity';
import { ProductSerial } from '../inventory/entities/product-serial.entity';
import { User } from '../users/entities/user.entity';
import { Location } from '../inventory/entities/location.entity'; 
import { MovementsModule } from '../movements/movements.module'; 
import { InvoiceItem } from './entities/invoice-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Invoice,
      InvoiceItem,
      Product,
      ProductVariant,
      ProductLot,
      ProductSerial,
      User,
      Location, 
    ]),
    MovementsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService], 
})
export class SalesModule {}