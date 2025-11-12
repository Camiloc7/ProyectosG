// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Factura } from './entities/invoice.entity';
// import { ItemFactura } from './entities/item-factura.entity';
// import { InvoicesService } from './invoices.service';
// import { InvoicesController } from './invoices.controller';
// import { SuppliersModule } from '../suppliers/suppliers.module'; // Importa el módulo de proveedores

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([Factura, ItemFactura]),
//     SuppliersModule, // Importa SuppliersModule para usar SuppliersService
//   ],
//   providers: [InvoicesService],
//   controllers: [InvoicesController],
//   exports: [InvoicesService, TypeOrmModule.forFeature([Factura, ItemFactura])], // Exporta el servicio y las entidades si otros módulos los necesitan
// })
// export class InvoicesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factura } from './entities/invoice.entity';
import { ItemFactura } from './entities/item-factura.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { SuppliersModule } from '../suppliers/suppliers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Factura, ItemFactura]),
    SuppliersModule,
  ],
  providers: [InvoicesService],
  controllers: [InvoicesController],
  exports: [InvoicesService, TypeOrmModule.forFeature([Factura, ItemFactura])],
})
export class InvoicesModule {}