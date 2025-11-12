
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInventoryEntryDto } from './dto/create-inventory-entry.dto';
import { InventoryService } from './inventory.service';
import { ProductsService } from '../products/products.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { MovementsService } from '../movements/movements.service';
import { ProductLot } from './entities/product-lot.entity'; 
import { Supplier } from '../suppliers/entities/supplier.entity'; 

@Injectable()
export class InventoryOrchestrationService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly productService: ProductsService,
    private readonly supplierService: SuppliersService,
    private readonly movementService: MovementsService,
  ) {}
  async createInventoryEntry(dto: CreateInventoryEntryDto, tenantId: string): Promise<any> {
    const { product, supplier_nit, lot, location_id, movement, serials } = dto;
    let supplier: Supplier | null = null; 
    if (supplier_nit) {
      supplier = await this.supplierService.findByNit(supplier_nit, tenantId); 
      if (!supplier) {
        throw new NotFoundException('Proveedor no encontrado para el NIT proporcionado.');
      }
    }
    let dbProduct; 
    if (product.sku) {
      dbProduct = await this.productService.findProductBySku(product.sku);
    } else {
      dbProduct = null;
    }
    if (!dbProduct) {
      const productToCreate: any = { 
        name: product.name,
        barcode: product.barcode,
        category_id: product.category_id,
      };
      if (product.sku) {
        productToCreate.sku = product.sku;
      }
      dbProduct = await this.productService.createProduct(productToCreate);
    }
    
    let productLotId: string | undefined = undefined;
    let createdProductLot: ProductLot | undefined = undefined;

    if (lot) {
      if (!supplier && (lot.lot_number || lot.initial_quantity > 0)) {
        throw new NotFoundException('Se requiere un proveedor para registrar un lote con datos.');
      }

      const manufactureDate = lot.manufacture_date ? new Date(lot.manufacture_date) : undefined;
      const expirationDate = lot.expiration_date ? new Date(lot.expiration_date) : undefined;
      createdProductLot = await this.inventoryService.createProductLot({
        lot_number: lot.lot_number,
        product_id: dbProduct.id,
        supplier_id: supplier ? supplier.id : undefined,
        manufacture_date: manufactureDate,
        expiration_date: expirationDate,
        initial_quantity: lot.initial_quantity,
      });
      productLotId = createdProductLot.id;
    }

    if (serials && serials.length > 0) {
      for (const serial of serials) {
        await this.inventoryService.createProductSerial({
          serial_number: serial,
          product_id: dbProduct.id,
        });
      }
    }
    await this.movementService.create({
      movement_type: movement.movement_type,
      product_id: dbProduct.id,
      product_variant_id: undefined,
      product_lot_id: productLotId,
      product_serial_id: undefined,
      to_location_id: location_id,
      from_location_id: undefined,
      quantity: movement.quantity,
      movement_date: new Date(movement.movement_date),
      notes: 'Entrada automática desde orquestación',
      reference_document_id: undefined,
      reference_document_type: undefined,
    });

    return { message: 'Entrada registrada correctamente.' };
  }
}