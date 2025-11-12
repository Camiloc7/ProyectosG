/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { faker } from '@faker-js/faker';
import { AppDataSource } from '../database/data-source';
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
import { Movement} from '../modules/movements/entities/movement.entity'; 
import { BillOfMaterial, BillOfMaterialItem } from '../modules/production/entities/bill-of-material.entity';
import { ProductionOrder, ProductionOrderStatus } from '../modules/production/entities/production-order.entity';
import { ProductionInput } from '../modules/production/entities/production-input.entity';
import { ProductionOutput } from '../modules/production/entities/production-output.entity';
import { QualityCheck } from '../modules/production/entities/quality-check.entity';
import { IsNull } from 'typeorm'; 
import * as fs from 'fs';
import * as path from 'path';

import {
  SeedData,
  RoleSeedData,
  UserSeedData,
  SupplierCategorySeedData,
  SupplierSeedData,
  ProductCategorySeedData,
  LocationSeedData,
  ProductSeedData,
  ProductLotSeedData,
  ProductSerialSeedData,
  InventorySeedData,
  MovementSeedData,
  BillOfMaterialSeedData,
  ProductionOrderSeedData
} from '../database/seed-data';

async function seed(data: SeedData = {}) {
  await AppDataSource.initialize();
  console.log('🔁 Seeding iniciado...');

  // Repositorios
  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const supplierCategoryRepo = AppDataSource.getRepository(SupplierCategory);
  const supplierRepo = AppDataSource.getRepository(Supplier);
  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  const locationRepo = AppDataSource.getRepository(Location);
  const lotRepo = AppDataSource.getRepository(ProductLot);
  const serialRepo = AppDataSource.getRepository(ProductSerial);
  const inventoryRepo = AppDataSource.getRepository(Inventory);
  const movementRepo = AppDataSource.getRepository(Movement);
  const bomRepo = AppDataSource.getRepository(BillOfMaterial);
  const bomItemRepo = AppDataSource.getRepository(BillOfMaterialItem);
  const prodOrderRepo = AppDataSource.getRepository(ProductionOrder);
  const inputRepo = AppDataSource.getRepository(ProductionInput);
  const outputRepo = AppDataSource.getRepository(ProductionOutput);
  const qcRepo = AppDataSource.getRepository(QualityCheck);

  // --- Roles ---
  const roleEntities: Role[] = [];
  const initialRoles: RoleSeedData[] = data.roles || ['Admin', 'WarehouseManager', 'Salesperson', 'ProductionOperator'].map(name => ({ name, description: `Rol para ${name}` }));
  for (const roleData of initialRoles) {
    let role = await roleRepo.findOne({ where: { name: roleData.name } });
    if (!role) {
      role = roleRepo.create(roleData);
      await roleRepo.save(role);
    }
    roleEntities.push(role);
  }
  if (roleEntities.length === 0) {
    throw new Error('❌ Error: No se crearon roles. No se puede continuar con el seeding.');
  }
  console.log(`Roles creados: ${roleEntities.length}`);

  // --- Usuarios ---
  const userEntities: User[] = [];
  const initialUsers: UserSeedData[] = data.users || Array.from({ length: 5 }).map(() => ({
    username: faker.internet.userName().toLowerCase(),
    password_hash: faker.internet.password(),
    roleName: faker.helpers.arrayElement(roleEntities).name,
    is_active: faker.datatype.boolean(),
  }));

  for (const userData of initialUsers) {
    const role = roleEntities.find(r => r.name === userData.roleName);
    if (!role) {
      console.warn(`⚠️ Rol '${userData.roleName}' no encontrado para el usuario '${userData.username}'. Saltando usuario.`);
      continue;
    }
    let user = await userRepo.findOne({ where: { username: userData.username } });
    if (!user) {
      user = userRepo.create({
        ...userData,
        role: role,
        password_hash: userData.password_hash || faker.internet.password(),
        is_active: userData.is_active !== undefined ? userData.is_active : true,
      });
      await userRepo.save(user);
    }
    userEntities.push(user);
  }
  if (userEntities.length === 0) {
    throw new Error('❌ Error: No se crearon usuarios. No se puede continuar con el seeding.');
  }
  console.log(`Usuarios creados: ${userEntities.length}`);

  // --- Categorías de Proveedores ---
  const supplierCategories: SupplierCategory[] = [];
  const initialSupplierCategories: SupplierCategorySeedData[] = data.supplierCategories || Array.from({ length: 3 }).map(() => ({
    name: faker.company.buzzNoun() + ' Supplies',
    description: faker.lorem.sentence(),
  }));

  for (const catData of initialSupplierCategories) {
    let cat = await supplierCategoryRepo.findOne({ where: { name: catData.name } });
    if (!cat) {
      cat = supplierCategoryRepo.create(catData);
      await supplierCategoryRepo.save(cat); // Corregido: Usar supplierCategoryRepo.save(cat)
    }
    supplierCategories.push(cat);
  }
  console.log(`Categorías de proveedores creadas: ${supplierCategories.length}`);

  // --- Proveedores ---
  const suppliers: Supplier[] = [];
  const initialSuppliers: SupplierSeedData[] = data.suppliers || Array.from({ length: 10 }).map(() => ({
    nit: faker.string.numeric(10),
    name: faker.company.name(),
    contact_person: faker.person.fullName(),
    phone: faker.phone.number(),
    email: faker.internet.email(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    verification_digit: faker.string.numeric(1),
    categoryName: faker.helpers.arrayElement(supplierCategories).name,
    document_type: faker.helpers.arrayElement(['NIT', 'CC', 'CE']),
    commercial_name: faker.company.catchPhraseAdjective() + ' ' + faker.company.buzzVerb(),
    bank_name: faker.company.name(),
    bank_account_number: faker.finance.accountNumber(),
    bank_account_type: faker.helpers.arrayElement(['Ahorros', 'Corriente']),
    contact_first_name: faker.person.firstName(),
    contact_last_name: faker.person.lastName(),
  }));

  for (const supData of initialSuppliers) {
    const category = supplierCategories.find(c => c.name === supData.categoryName);
    if (!category) {
      console.warn(`⚠️ Categoría de proveedor '${supData.categoryName}' no encontrada para el proveedor '${supData.name}'. Saltando proveedor.`);
      continue;
    }
    let supplier = await supplierRepo.findOne({ where: { nit: supData.nit } });
    if (!supplier) {
      supplier = supplierRepo.create({
        ...supData,
        category: category,
      });
      await supplierRepo.save(supplier);
    }
    suppliers.push(supplier);
  }
  console.log(`Proveedores creados: ${suppliers.length}`);

  // --- Categorías de Productos ---
  const productCategories: Category[] = [];
  const initialProductCategories: ProductCategorySeedData[] = data.productCategories || Array.from({ length: 5 }).map(() => ({
    name: faker.commerce.productAdjective() + ' ' + faker.commerce.productMaterial(),
    description: faker.lorem.sentence(),
  }));

  for (const catData of initialProductCategories) {
    let category = await categoryRepo.findOne({ where: { name: catData.name } });
    if (!category) {
      category = categoryRepo.create(catData);
      await categoryRepo.save(category);
    }
    productCategories.push(category);
  }
  if (productCategories.length === 0) {
    throw new Error('❌ Error: No se crearon categorías de productos. No se puede continuar con el seeding.');
  }
  console.log(`Categorías de productos creadas: ${productCategories.length}`);

  // --- Ubicaciones ---
  const locations: Location[] = [];
  const initialLocations: LocationSeedData[] = data.locations || Array.from({ length: 3 }).map((_, i) => ({
    name: `Sitio Obra ${i + 1}`,
    description: `Ubicación de almacenamiento o trabajo para la obra ${i + 1}`,
    is_active: true,
  }));

  for (const locData of initialLocations) {
    let location = await locationRepo.findOne({ where: { name: locData.name } });
    if (!location) {
      location = locationRepo.create(locData);
      await locationRepo.save(location);
    }
    locations.push(location);
  }
  if (locations.length === 0) {
    throw new Error('❌ Error: No se crearon ubicaciones. No se puede continuar con la creación de órdenes de producción.');
  }
  console.log(`Ubicaciones creadas: ${locations.length}`);

  // --- Productos, Variantes, Lotes, Series, Inventario, Movimientos ---
  console.log('Iniciando creación de productos, variantes, lotes, series e inventario...');
  const products: Product[] = [];
  const productionProducts: Product[] = []; // Productos que pueden ser usados como salida de una BOM

  const initialProducts: ProductSeedData[] = data.products || Array.from({ length: 10 }).map(() => {
    const costPrice = parseFloat(faker.commerce.price({ min: 10, max: 500, dec: 2 }));
    const salePrice = parseFloat((costPrice * 1.5 + faker.number.float({ min: 10, max: 100 })).toFixed(2));
    const category = faker.helpers.arrayElement(productCategories);
    return {
      name: faker.commerce.productName(),
      sku: faker.string.alphanumeric(8).toUpperCase(),
      barcode: faker.string.numeric(12),
      description: faker.commerce.productDescription(),
      cost_price: costPrice,
      sale_price: salePrice,
      categoryName: category.name,
      variants: faker.datatype.boolean() && faker.number.int({ min: 0, max: 2 }) > 0 ? [{
        name: faker.commerce.productName() + ' ' + faker.lorem.word(),
        sku: faker.string.alphanumeric(10).toUpperCase(),
        barcode: faker.string.numeric(13),
        cost_price: parseFloat((costPrice * faker.number.float({ min: 0.9, max: 1.1, fractionDigits: 2 })).toFixed(2)), // Actualizado
        sale_price: parseFloat((salePrice * faker.number.float({ min: 0.9, max: 1.1, fractionDigits: 2 })).toFixed(2)), // Actualizado
        attribute1_name: faker.lorem.word(),
        attribute1_value: faker.color.human(),
        attribute2_name: faker.lorem.word(),
        attribute2_value: faker.commerce.productAdjective(),
      }] : [],
      lots: faker.datatype.boolean() && faker.number.int({ min: 0, max: 2 }) > 0 ? [{
        lot_number: faker.string.alphanumeric(8).toUpperCase(),
        supplierName: faker.helpers.arrayElement(suppliers).name,
        initial_quantity: faker.number.int({ min: 50, max: 500 }),
        current_quantity: faker.number.int({ min: 10, max: 50 }),
        manufacture_date: faker.date.recent({ days: 365 }),
        expiration_date: faker.date.future({ years: 5 }),
        status: 'available',
      }] : [],
      serials: faker.datatype.boolean() && faker.number.int({ min: 0, max: 2 }) > 0 ? Array.from({ length: faker.number.int({ min: 1, max: 3 }) }).map(() => ({
        serial_number: faker.string.alphanumeric(12).toUpperCase(),
        status: 'available',
      })) : [],
      inventory: [],
      movements: [],
    };
  });

  for (const productData of initialProducts) {
    const category = productCategories.find(c => c.name === productData.categoryName);
    if (!category) {
      console.warn(`⚠️ Categoría de producto '${productData.categoryName}' no encontrada para el producto '${productData.name}'. Saltando producto.`);
      continue;
    }
    let product = await productRepo.findOne({ where: { sku: productData.sku } });
    if (!product) {
      product = productRepo.create({
        ...productData,
        category: category,
      });
      await productRepo.save(product);
    }
    products.push(product);

    // Crea variantes
    if (productData.variants && productData.variants.length > 0) {
      for (const variantData of productData.variants) {
        let variant = await variantRepo.findOne({ where: { sku: variantData.sku } });
        if (!variant) {
          variant = variantRepo.create({
            ...variantData,
            product: product,
          });
          await variantRepo.save(variant);
        }
      }
    }

    // Crea lotes
    const productLots: ProductLot[] = [];
    if (productData.lots && productData.lots.length > 0) {
      for (const lotData of productData.lots) {
        const supplier = suppliers.find(s => s.name === lotData.supplierName);
        if (!supplier) {
          console.warn(`⚠️ Proveedor '${lotData.supplierName}' no encontrado para el lote '${lotData.lot_number}'. Saltando lote.`);
          continue;
        }
        let lot = await lotRepo.findOne({ where: { lot_number: lotData.lot_number } });
        if (!lot) {
          lot = lotRepo.create({
            ...lotData,
            product: product,
            supplier: supplier,
            manufacture_date: lotData.manufacture_date ? new Date(lotData.manufacture_date) : faker.date.past(),
            expiration_date: lotData.expiration_date ? new Date(lotData.expiration_date) : faker.date.future(),
          });
          await lotRepo.save(lot);
          productLots.push(lot);
        }
      }
    }

    // Crea seriales
    const productSerials: ProductSerial[] = [];
    if (productData.serials && productData.serials.length > 0) {
      for (const serialData of productData.serials) {
        let serial = await serialRepo.findOne({ where: { serial_number: serialData.serial_number } });
        if (!serial) {
          serial = serialRepo.create({
            ...serialData,
            product: product,
          });
          await serialRepo.save(serial);
          productSerials.push(serial);
        }
      }
    }

    // Crea inventario y movimientos iniciales
    if (productLots.length > 0 || productSerials.length > 0) {
      const targetLocation = faker.helpers.arrayElement(locations);
      const targetUser = faker.helpers.arrayElement(userEntities);

      if (productLots.length > 0) {
        for (const lot of productLots) {
          let inventory = await inventoryRepo.findOne({
            where: {
              product: { id: product.id },
              productLot: { id: lot.id },
              location: { id: targetLocation.id }
            }
          });
          if (!inventory) {
            inventory = inventoryRepo.create({
              product: product,
              productLot: lot,
              location: targetLocation,
              quantity: lot.current_quantity,
            });
            await inventoryRepo.save(inventory);

            // Crear movimiento de recepción para el lote
            const movement = movementRepo.create({
              movement_type: 'recepción',
              product: product,
              productLot: lot,
              fromLocation: targetLocation,
              quantity: lot.initial_quantity,
              notes: `Recepción inicial de lote ${lot.lot_number}`,
              createdBy: targetUser, // Usar la relación 'createdBy'
            });
            await movementRepo.save(movement);
          }
        }
      } else if (productSerials.length > 0) {
        for (const serial of productSerials) {
          let inventory = await inventoryRepo.findOne({
            where: {
              product: { id: product.id },
              productSerial: { id: serial.id },
              location: { id: targetLocation.id }
            }
          });
          if (!inventory) {
            inventory = inventoryRepo.create({
              product: product,
              productSerial: serial,
              location: targetLocation,
              quantity: 1,
            });
            await inventoryRepo.save(inventory);
            serial.inventoryItem = inventory;
            await serialRepo.save(serial);

            // Crear movimiento de recepción para el serial
            const movement = movementRepo.create({
              movement_type: 'recepción', // Usar MovementType
              product: product,
              productSerial: serial,
              fromLocation: targetLocation,
              quantity: 1,
              notes: `Recepción inicial de serial ${serial.serial_number}`,
              createdBy: targetUser, // Usar la relación 'createdBy'
            });
            await movementRepo.save(movement);
          }
        }
      } else {
        let inventory = await inventoryRepo.findOne({
          where: {
            product: { id: product.id },
            location: { id: targetLocation.id },
            productLot: IsNull(), // Corregido: Usar IsNull()
            productSerial: IsNull() // Corregido: Usar IsNull()
          }
        });
        if (!inventory) {
          inventory = inventoryRepo.create({
            product: product,
            location: targetLocation,
            quantity: faker.number.int({ min: 50, max: 200 }),
          });
          await inventoryRepo.save(inventory);

          const movement = movementRepo.create({
            movement_type: 'recepción', // Usar MovementType
            product: product,
            fromLocation: targetLocation,
            quantity: inventory.quantity,
            notes: `Recepción inicial de producto genérico ${product.name}`,
            createdBy: targetUser, // Usar la relación 'createdBy'
          });
          await movementRepo.save(movement);
        }
      }
    }
  }
  console.log(`Productos + Variantes + Lotes + Series + Inventario + Movimientos creados: ${products.length}`);


  // Lógica para seleccionar/generar productos para BOMs/Órdenes de Producción
  if (!data.products || data.products.length === 0) {
    for (let i = 0; i < 5; i++) {
      const prod = productRepo.create({
        name: `Prod Fabricado ${faker.commerce.productName()}`,
        sku: `FAB-${faker.string.alphanumeric(5).toUpperCase()}`,
        barcode: faker.string.numeric(12),
        description: `Producto fabricado internamente: ${faker.lorem.sentence()}`,
        cost_price: faker.number.float({ min: 50, max: 200, fractionDigits: 2 }), // Actualizado
        sale_price: faker.number.float({ min: 200, max: 400, fractionDigits: 2 }), // Actualizado
        category: faker.helpers.arrayElement(productCategories),
      });
      await productRepo.save(prod);
      productionProducts.push(prod);
    }
  } else {
    const productsFromJson = products.filter(p => data.boms?.some(b => b.productSku === p.sku));
    if (productsFromJson.length > 0) {
      productionProducts.push(...productsFromJson);
    } else {
      productionProducts.push(...products.slice(0, Math.min(5, products.length)));
    }
  }
  console.log(`Productos de producción creados/identificados: ${productionProducts.length}`);


  // --- Bills of Material (BOMs) ---
  const boms: BillOfMaterial[] = [];
  const initialBoms: BillOfMaterialSeedData[] = data.boms || Array.from({ length: productionProducts.length }).map((_, i) => {
    const productForBom = productionProducts[i];
    return {
      name: `BOM - ${productForBom.name.slice(0, 20)}`,
      description: faker.lorem.sentence(),
      quantity_produced: faker.number.float({ min: 1, max: 10, fractionDigits: 2 }), // Actualizado
      productSku: productForBom.sku,
      items: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }).map(() => ({
        componentProductSku: faker.helpers.arrayElement(products.filter(p => p.sku !== productForBom.sku)).sku,
        quantity: faker.number.float({ min: 1, max: 10, fractionDigits: 2 }), // Actualizado
      })),
    };
  });

  console.log('Iniciando creación de Bills of Material (BOMs)...');
  for (const bomData of initialBoms) {
    const product = products.find(p => p.sku === bomData.productSku);
    if (!product) {
      console.warn(`⚠️ Producto con SKU '${bomData.productSku}' no encontrado para el BOM '${bomData.name}'. Saltando BOM.`);
      continue;
    }

    let bom = await bomRepo.findOne({ where: { name: bomData.name } });
    if (!bom) {
      bom = bomRepo.create({
        name: bomData.name,
        description: bomData.description,
        quantity_produced: bomData.quantity_produced,
        product: product,
      });
      await bomRepo.save(bom);
    }
    if (bomData.items && bomData.items.length > 0) {
      for (const itemData of bomData.items) {
        const componentProduct = products.find(p => p.sku === itemData.componentProductSku);
        if (!componentProduct) {
          console.warn(`⚠️ Producto componente con SKU '${itemData.componentProductSku}' no encontrado para el BOM item del BOM '${bomData.name}'. Saltando item.`);
          continue;
        }
        let item = await bomItemRepo.findOne({
            where: {
                billOfMaterial: { id: bom.id },
                componentProduct: { id: componentProduct.id }
            }
        });
        if (!item) {
            item = bomItemRepo.create({
                billOfMaterial: bom,
                componentProduct: componentProduct,
                quantity: itemData.quantity,
            });
            await bomItemRepo.save(item);
        }
      }
    }
    boms.push(bom);
  }
  console.log(`BOMs creados: ${boms.length}`);

  // --- Órdenes de Producción ---
  const productionOrders: ProductionOrder[] = [];
  const initialProductionOrders: ProductionOrderSeedData[] = data.productionOrders || Array.from({ length: Math.min(5, boms.length) }).map((_, i) => {
    const bom = boms[i];
    const user = faker.helpers.arrayElement(userEntities);
    const location = faker.helpers.arrayElement(locations);

    const productSku = bom?.product?.sku || 'UNKNOWN_SKU';
    const bomName = bom?.name || 'UNKNOWN_BOM';

    return {
      order_number: `OP-${faker.string.numeric(7)}`,
      productSku: productSku,
      bomName: bomName,
      quantity_to_produce: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }), // Actualizado
      status: ProductionOrderStatus.PENDING,
      productionLocationName: location.name,
      start_date: faker.date.recent().toISOString().split('T')[0],
      createdByUser: user.username,
    };
  });

  console.log('Iniciando creación de Órdenes de Producción...');
  for (const orderData of initialProductionOrders) {
    const product = products.find(p => p.sku === orderData.productSku);
    const bom = boms.find(b => b.name === orderData.bomName);
    const productionLocation = locations.find(loc => loc.name === orderData.productionLocationName);
    const createdBy = userEntities.find(u => u.username === orderData.createdByUser);

    if (!product || !bom || !productionLocation || !createdBy) {
      console.warn(`⚠️ Faltan datos para crear la orden de producción para SKU '${orderData.productSku}' o BOM '${orderData.bomName}'. Saltando orden.`);
      continue;
    }

    let order = await prodOrderRepo.findOne({
        where: {
            order_number: orderData.order_number
        }
    });

    if (!order) {
        order = prodOrderRepo.create({
            order_number: orderData.order_number,
            product: product,
            product_id: product.id,
            billOfMaterial: bom,
            bom_id: bom.id,
            quantity_to_produce: orderData.quantity_to_produce,
            quantity_produced: orderData.quantity_produced || 0,
            status: orderData.status || ProductionOrderStatus.PENDING,
            productionLocation: productionLocation,
            production_location_id: productionLocation.id,
            start_date: new Date(orderData.start_date),
            createdBy: createdBy, // Usar la relación 'createdBy'
            created_by_user_id: createdBy.id,
        });
        await prodOrderRepo.save(order);
    }
    productionOrders.push(order);
  }
  console.log(`Órdenes de Producción creadas: ${productionOrders.length}`);


  console.log('✅ Seeder completado.');
  await AppDataSource.destroy();
}

async function runSeed() {
  const jsonPath = path.join(__dirname, 'seed-data.json');
  let customSeedData: SeedData = {};

  try {
      if (fs.existsSync(jsonPath)) {
          const rawData = fs.readFileSync(jsonPath, 'utf-8');
          customSeedData = JSON.parse(rawData);
          console.log(`✅ Datos cargados desde ${jsonPath}`);
      } else {
          console.warn(`⚠️ Archivo de datos JSON no encontrado en ${jsonPath}. Se usará faker para generar datos.`);
      }
  } catch (error) {
      console.error('❌ Error al leer o parsear el archivo JSON de datos para el seeder:', error);
  }

  await seed(customSeedData);
}

runSeed().catch((error) => {
console.error('❌ Error en seeder:', error.message || error);
if (AppDataSource.isInitialized) {
  AppDataSource.destroy().then(() => {
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }).catch(destroyErr => {
    console.error('Error al cerrar la conexión en el catch:', destroyErr);
    setTimeout(() => {
      process.exit(1);
    }, 100);
  });
} else {
  setTimeout(() => {
    process.exit(1);
  }, 100);
}
});