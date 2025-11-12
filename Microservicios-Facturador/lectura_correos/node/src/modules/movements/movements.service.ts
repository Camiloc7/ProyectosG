import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, IsNull } from 'typeorm'; 
import { Movement } from './entities/movement.entity';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Location } from '../inventory/entities/location.entity';
import { ProductLot } from '../inventory/entities/product-lot.entity';
import { ProductSerial } from '../inventory/entities/product-serial.entity';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(Movement)
    private movementRepository: Repository<Movement>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(ProductLot)
    private productLotRepository: Repository<ProductLot>,
    @InjectRepository(ProductSerial)
    private productSerialRepository: Repository<ProductSerial>,
    private connection: Connection, 
  ) {}

  async create(createMovementDto: CreateMovementDto): Promise<Movement> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { 
        product_id, 
        product_variant_id, 
        from_location_id, 
        to_location_id, 
        product_lot_id, 
        product_serial_id, 
        quantity, 
        created_by_user_id,
        ...movementData 
      } = createMovementDto;

      const product = await queryRunner.manager.findOne(Product, { where: { id: product_id } });
      if (!product) throw new NotFoundException(`Product with ID "${product_id}" not found.`);

      let productVariant: ProductVariant | undefined = undefined;
      if (product_variant_id) {
        productVariant = await queryRunner.manager.findOne(ProductVariant, { where: { id: product_variant_id, product_id } }) ?? undefined;
        if (!productVariant) throw new NotFoundException(`Product Variant with ID "${product_variant_id}" for product "${product_id}" not found.`);
      }

      const fromLocation = await queryRunner.manager.findOne(Location, { where: { id: from_location_id } });
      if (!fromLocation) throw new NotFoundException(`Origin location with ID "${from_location_id}" not found.`);

      let toLocation: Location | undefined = undefined;
      if (to_location_id) {
        toLocation = await queryRunner.manager.findOne(Location, { where: { id: to_location_id } })?? undefined;
        if (!toLocation) throw new NotFoundException(`Destination location with ID "${to_location_id}" not found.`);
      }

      let productLot: ProductLot | undefined = undefined;
      if (product_lot_id) {
        productLot = await queryRunner.manager.findOne(ProductLot, { where: { id: product_lot_id, product_id } })?? undefined;
        if (!productLot) throw new NotFoundException(`Product Lot with ID "${product_lot_id}" for product "${product_id}" not found.`);
      }

      let productSerial: ProductSerial | undefined = undefined;
      if (product_serial_id) {
        productSerial = await queryRunner.manager.findOne(ProductSerial, { where: { id: product_serial_id, product_id } })?? undefined;
        if (!productSerial) throw new NotFoundException(`Product Serial with ID "${product_serial_id}" for product "${product_id}" not found.`);
      }


      await this.processInventoryUpdate(
        queryRunner,
        createMovementDto.movement_type,
        product,
        fromLocation, 
        quantity,
        productVariant,
        toLocation,
        productLot,
        productSerial,
      );

      const newMovement = queryRunner.manager.create(Movement, {
        ...movementData,
        product,
        productVariant,
        fromLocation,
        toLocation,
        productLot,
        productSerial,
        quantity,
        product_id: product.id,
        product_variant_id: productVariant?.id,
        from_location_id: fromLocation.id,
        to_location_id: toLocation?.id,
        product_lot_id: productLot?.id,
        product_serial_id: productSerial?.id,
        createdBy: null, 
      });

      const savedMovement = await queryRunner.manager.save(newMovement);

      await queryRunner.commitTransaction();
      return savedMovement;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to create movement due to an unexpected error.');
    } finally {
      await queryRunner.release();
    }
  }

  private async processInventoryUpdate(
    queryRunner: any,
    movementType: string,
    product: Product, 
    fromLocation: Location,
    quantity: number,
    productVariant?: ProductVariant,
    toLocation?: Location,
    productLot?: ProductLot,
    productSerial?: ProductSerial,
  ) {
    switch (movementType) {
      case 'reception':
        if (!toLocation) {
          throw new BadRequestException('Reception movements require a "to_location_id".');
        }
        await this.updateInventoryQuantity(queryRunner, product, productVariant, toLocation, productLot, productSerial, quantity);
        if (productLot) {
          productLot.current_quantity += quantity;
          await queryRunner.manager.save(productLot);
        }
        if (productSerial) {
          productSerial.status = 'available';
          await queryRunner.manager.save(productSerial);
        }
        break;

      case 'sale':
        await this.updateInventoryQuantity(queryRunner, product, productVariant, fromLocation, productLot, productSerial, -quantity);
        if (productLot) {
          productLot.current_quantity -= quantity;
          await queryRunner.manager.save(productLot);
        }
        if (productSerial) {
          productSerial.status = 'sold';
          await queryRunner.manager.save(productSerial);
        }
        break;

      case 'transfer':
        if (!toLocation) {
          throw new BadRequestException('Transfer movements require both "from_location_id" and "to_location_id".');
        }
        await this.updateInventoryQuantity(queryRunner, product, productVariant, fromLocation, productLot, productSerial, -quantity);
        await this.updateInventoryQuantity(queryRunner, product, productVariant, toLocation, productLot, productSerial, quantity);
        break;

      case 'production_input':
        await this.updateInventoryQuantity(queryRunner, product, productVariant, fromLocation, productLot, productSerial, -quantity);
        if (productLot) {
          productLot.current_quantity -= quantity;
          await queryRunner.manager.save(productLot);
        }
        if (productSerial) {
          productSerial.status = 'in_use';
          await queryRunner.manager.save(productSerial);
        }
        break;

      case 'production_output':
        if (!toLocation) {
          throw new BadRequestException('Production output movements require a "to_location_id".');
        }
        await this.updateInventoryQuantity(queryRunner, product, productVariant, toLocation, productLot, productSerial, quantity);
        if (productLot) {
          productLot.current_quantity += quantity;
          await queryRunner.manager.save(productLot);
        }
        if (productSerial) {
          productSerial.status = 'available';
          await queryRunner.manager.save(productSerial);
        }
        break;

      case 'adjustment':
        await this.updateInventoryQuantity(queryRunner, product, productVariant, fromLocation, productLot, productSerial, quantity);
        if (productLot) {
          productLot.current_quantity += quantity;
          await queryRunner.manager.save(productLot);
        }
        break;

      case 'loss':
        await this.updateInventoryQuantity(queryRunner, product, productVariant, fromLocation, productLot, productSerial, -quantity);
        if (productLot) {
          productLot.current_quantity -= quantity;
          await queryRunner.manager.save(productLot);
        }
        if (productSerial) {
          productSerial.status = 'damaged';
          await queryRunner.manager.save(productSerial);
        }
        break;

      default:
        throw new BadRequestException(`Unsupported movement type: "${movementType}"`);
    }
  }

  private async updateInventoryQuantity(
    queryRunner: any,
    product: Product,
    productVariant: ProductVariant | undefined,
    location: Location,
    productLot?: ProductLot,
    productSerial?: ProductSerial,
    change: number = 0,  
  ) {
    const inventoryItem = await queryRunner.manager.findOne(Inventory, {
      where: {
        product_id: product.id,
        product_variant_id: productVariant ? productVariant.id : IsNull(),
        location_id: location.id,
        product_lot_id: productLot ? productLot.id : IsNull(),
        product_serial_id: productSerial ? productSerial.id : IsNull(),
      },
    });

    if (inventoryItem) {
      const newQuantity = inventoryItem.quantity + change;
      if (newQuantity < 0) {
        throw new BadRequestException(`Insufficient quantity of product "${product.name}" in location "${location.name}" for this operation.`);
      }
      inventoryItem.quantity = newQuantity;
      await queryRunner.manager.save(inventoryItem);
    } else {
      if (change < 0) {
        throw new BadRequestException(`Cannot fulfill movement: Product "${product.name}" is not available in location "${location.name}" or specific lot/serial.`);
      }
      const newInventoryItem = queryRunner.manager.create(Inventory, {
        product,
        productVariant,
        location,
        productLot,
        productSerial,
        quantity: change,
      });
      await queryRunner.manager.save(newInventoryItem);
    }
  }

  async findAll(): Promise<Movement[]> {
    return this.movementRepository.find({
      relations: ['product', 'productVariant', 'fromLocation', 'toLocation', 'productLot', 'productSerial'],
      order: { movement_date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Movement> {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: ['product', 'productVariant', 'fromLocation', 'toLocation', 'productLot', 'productSerial'],
    });
    if (!movement) {
      throw new NotFoundException(`Movement with ID "${id}" not found.`);
    }
    return movement;
  }

  async findMovementsByProduct(productId: string): Promise<Movement[]> {
    return this.movementRepository.find({
      where: { product_id: productId },
      relations: ['product', 'productVariant', 'fromLocation', 'toLocation', 'productLot', 'productSerial'],
      order: { movement_date: 'DESC' },
    });
  }

  async findMovementsByLocation(locationId: string): Promise<Movement[]> {
    return this.movementRepository.find({
      where: [{ from_location_id: locationId }, { to_location_id: locationId }],
      relations: ['product', 'productVariant', 'fromLocation', 'toLocation', 'productLot', 'productSerial'], 
      order: { movement_date: 'DESC' },
    });
  }

  async update(id: string, updateMovementDto: UpdateMovementDto): Promise<Movement> {
    const movement = await this.findOne(id);
    this.movementRepository.merge(movement, updateMovementDto);
    return this.movementRepository.save(movement);
  }

  async remove(id: string): Promise<void> {
    const result = await this.movementRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Movement with ID "${id}" not found.`);
    }
  }
}