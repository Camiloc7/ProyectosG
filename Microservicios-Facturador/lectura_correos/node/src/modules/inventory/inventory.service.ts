import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Location } from './entities/location.entity';
import { ProductLot } from './entities/product-lot.entity';
import { ProductSerial } from './entities/product-serial.entity';
import { Inventory } from './entities/inventory.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateProductLotDto} from './dto/create-product-lot.dto';
import { CreateProductSerialDto } from './dto/create-product-serial.dto';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateProductLotDto } from './dto/update-product-lot.dto';
import { UpdateProductSerialDto } from './dto/update-product-serial.dto';
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(ProductLot)
    private productLotRepository: Repository<ProductLot>,
    @InjectRepository(ProductSerial)
    private productSerialRepository: Repository<ProductSerial>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Supplier)
    
    private supplierRepository: Repository<Supplier>,
  ) {}
async createLocation(createLocationDto: CreateLocationDto): Promise<Location> {
  const newLocation = this.locationRepository.create(createLocationDto);
  try {
    const savedLocation = await this.locationRepository.save(newLocation);
    const locationWithRelations = await this.locationRepository.findOne({
      where: { id: savedLocation.id },
      relations: [
        'inventoryItems',
        'inventoryItems.product', 
        'inventoryItems.productVariant', 
        'inventoryItems.productLot',     
        'inventoryItems.productSerial', 
      ],
    });
    if (!locationWithRelations) {
      throw new Error('Could not retrieve created location with relations.');
    }
    return locationWithRelations;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new BadRequestException('Location name already exists.');
    }
    throw error;
  }
}
async findAllLocations(): Promise<Location[]> {
  return this.locationRepository.find({
    relations: [
      'inventoryItems',
      'inventoryItems.product',
      'inventoryItems.productVariant',
      'inventoryItems.productLot',
      'inventoryItems.productSerial',
    ],
  });
}
async findLocationById(id: string): Promise<Location> {
  const location = await this.locationRepository.findOne({
    where: { id },
    relations: [
      'inventoryItems',
      'inventoryItems.product',
      'inventoryItems.productVariant',
      'inventoryItems.productLot',
      'inventoryItems.productSerial',
    ],
  });
  if (!location) {
    throw new NotFoundException(`Location with ID "${id}" not found.`);
  }
  return location;
}
  async updateLocation(id: string, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const location = await this.findLocationById(id);
    this.locationRepository.merge(location, updateLocationDto);
    try {
      return await this.locationRepository.save(location);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Location name already exists.');
      }
      throw error;
    }
  }
  async deleteLocation(id: string): Promise<void> {
    const inventoryCount = await this.inventoryRepository.count({ where: { location_id: id } });
    if (inventoryCount > 0) {
      throw new BadRequestException('Cannot delete location with existing inventory items.');
    }
    const result = await this.locationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Location with ID "${id}" not found.`);
    }
  }
  async createProductLot(createProductLotDto: CreateProductLotDto): Promise<ProductLot> {
    const product = await this.productRepository.findOne({ where: { id: createProductLotDto.product_id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${createProductLotDto.product_id}" not found for this lot.`);
    }
    let supplier: Supplier | null = null;
    if (createProductLotDto.supplier_id) {
      supplier = await this.supplierRepository.findOne({ where: { id: createProductLotDto.supplier_id } });
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID "${createProductLotDto.supplier_id}" not found.`);
      }
    }
    const newLot = this.productLotRepository.create({
      ...createProductLotDto,
      product: product,
      supplier: supplier ?? undefined, 
      current_quantity: createProductLotDto.initial_quantity,
    });
    try {
      return await this.productLotRepository.save(newLot);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Product Lot number already exists for this product.');
      }
      throw error;
    }
  }
  async findAllProductLots(): Promise<ProductLot[]> {
    return this.productLotRepository.find({ relations: ['product', 'supplier'] });
  }
  async findProductLotById(id: string): Promise<ProductLot> {
    const lot = await this.productLotRepository.findOne({ where: { id }, relations: ['product', 'supplier'] });
    if (!lot) {
      throw new NotFoundException(`Product Lot with ID "${id}" not found.`);
    }
    return lot;
  }
  async updateProductLot(id: string, updateProductLotDto: UpdateProductLotDto): Promise<ProductLot> {
    const lot = await this.findProductLotById(id);

    const { product_id, supplier_id, ...lotData } = updateProductLotDto;

    if (product_id && product_id !== lot.product_id) {
      const product = await this.productRepository.findOne({ where: { id: product_id } });
      if (!product) {
        throw new NotFoundException(`Product with ID "${product_id}" not found.`);
      }
      lot.product = product;
    }

    if (supplier_id !== undefined) {
      if (supplier_id === null) {
        lot.supplier = supplier_id; 
      } else {
        const supplier = await this.supplierRepository.findOne({ where: { id: supplier_id } });
        if (!supplier) {
          throw new NotFoundException(`Supplier with ID "${supplier_id}" not found.`);
        }
        lot.supplier = supplier;
      }
    }
    if (lotData.current_quantity !== undefined && lotData.current_quantity > lot.initial_quantity) {
    }

    this.productLotRepository.merge(lot, lotData);
    try {
      return await this.productLotRepository.save(lot);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Product Lot number already exists for this product.');
      }
      throw error;
    }
  }
  async deleteProductLot(id: string): Promise<void> {
    const inventoryCount = await this.inventoryRepository.count({ where: { product_lot_id: id } });
    if (inventoryCount > 0) {
      throw new BadRequestException('Cannot delete product lot with existing inventory items.');
    }
    const result = await this.productLotRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product Lot with ID "${id}" not found.`);
    }
  }
  async createProductSerial(createProductSerialDto: CreateProductSerialDto): Promise<ProductSerial> {
    const product = await this.productRepository.findOne({ where: { id: createProductSerialDto.product_id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${createProductSerialDto.product_id}" not found for this serial.`);
    }

    const newSerial = this.productSerialRepository.create({
      ...createProductSerialDto,
      product: product,
    });
    try {
      return await this.productSerialRepository.save(newSerial);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Product Serial number already exists.');
      }
      throw error;
    }
  }
  async findAllProductSerials(): Promise<ProductSerial[]> {
    return this.productSerialRepository.find({ relations: ['product'] });
  }
  async findProductSerialById(id: string): Promise<ProductSerial> {
    const serial = await this.productSerialRepository.findOne({ where: { id }, relations: ['product'] });
    if (!serial) {
      throw new NotFoundException(`Product Serial with ID "${id}" not found.`);
    }
    return serial;
  }
  async updateProductSerial(id: string, updateProductSerialDto: UpdateProductSerialDto): Promise<ProductSerial> {
    const serial = await this.findProductSerialById(id);
    const { product_id, ...serialData } = updateProductSerialDto;
    if (product_id && product_id !== serial.product_id) {
      const product = await this.productRepository.findOne({ where: { id: product_id } });
      if (!product) {
        throw new NotFoundException(`Product with ID "${product_id}" not found.`);
      }
      serial.product = product;
    }
    this.productSerialRepository.merge(serial, serialData);
    try {
      return await this.productSerialRepository.save(serial);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Product Serial number already exists.');
      }
      throw error;
    }
  }
  async deleteProductSerial(id: string): Promise<void> {
    const inventoryCount = await this.inventoryRepository.count({ where: { product_serial_id: id } });
    if (inventoryCount > 0) {
      throw new BadRequestException('Cannot delete product serial with existing inventory items.');
    }
    const result = await this.productSerialRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product Serial with ID "${id}" not found.`);
    }
  }
  async getInventorySnapshot(): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      relations: ['product', 'productVariant', 'location', 'productLot', 'productSerial'],
      where: { quantity: Not(0) }, 
    });
  }
  async getProductInventory(productId: string): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: { product_id: productId, quantity: Not(0) },
      relations: ['product', 'productVariant', 'location', 'productLot', 'productSerial'],
    });
  }
  async getLocationInventory(locationId: string): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: { location_id: locationId, quantity: Not(0) },
      relations: ['product', 'productVariant', 'location', 'productLot', 'productSerial'],
    });
  }
}