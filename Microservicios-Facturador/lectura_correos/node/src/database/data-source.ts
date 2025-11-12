import { config } from 'dotenv';
config();
import { DataSource } from 'typeorm';
import { Role } from '../modules/users/entities/role.entity';
import { User } from '../modules/users/entities/user.entity';
import { SupplierCategory } from '../modules/suppliers/entities/supplier-category.entity';
import { Supplier } from '../modules/suppliers/entities/supplier.entity';
import { Category } from '../modules/products/entities/category.entity';
import { Product } from '../modules/products/entities/product.entity';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { Location } from '../modules/inventory/entities/location.entity';
import { ProductLot } from '../modules/inventory/entities/product-lot.entity';
import { ProductSerial } from '../modules/inventory/entities/product-serial.entity';
import { Inventory } from '../modules/inventory/entities/inventory.entity';
import { Movement } from '../modules/movements/entities/movement.entity';
import { BillOfMaterial, BillOfMaterialItem } from '../modules/production/entities/bill-of-material.entity';
import { ProductionOrder } from '../modules/production/entities/production-order.entity';
import { ProductionInput } from '../modules/production/entities/production-input.entity';
import { ProductionOutput } from '../modules/production/entities/production-output.entity';
import { QualityCheck } from '../modules/production/entities/quality-check.entity';
import { Factura } from '../modules/invoices/entities/invoice.entity';
import { ItemFactura } from '../modules/invoices/entities/item-factura.entity';
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventory_db',
  entities: [
    User,
    Role,
    Supplier,
    SupplierCategory,
    Category,
    Product,
    ProductVariant,
    Location,
    ProductLot,
    ProductSerial,
    Inventory,
    Movement,
    BillOfMaterial,
    BillOfMaterialItem,
    ProductionOrder,
    ProductionInput,
    ProductionOutput,
    QualityCheck,
    Factura,
    ItemFactura
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: true,
});
