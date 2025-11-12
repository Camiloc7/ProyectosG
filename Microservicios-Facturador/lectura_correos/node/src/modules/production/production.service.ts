import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { BillOfMaterial, BillOfMaterialItem } from './entities/bill-of-material.entity';
import { ProductionOrder, ProductionOrderStatus } from './entities/production-order.entity'; 
import { ProductionInput } from './entities/production-input.entity';
import { ProductionOutput } from './entities/production-output.entity';
import { QualityCheck } from './entities/quality-check.entity';
import { Product } from '../products/entities/product.entity';
import { ProductLot } from '../inventory/entities/product-lot.entity';
import { ProductSerial } from '../inventory/entities/product-serial.entity';
import { Location } from '../inventory/entities/location.entity';
import { User } from '../users/entities/user.entity';
import { MovementsService } from '../movements/movements.service';
import { CreateBillOfMaterialDto } from './dto/create-bill-of-material.dto';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { CreateProductionInputDto } from './dto/create-production-input.dto';
import { CreateProductionOutputDto } from './dto/create-production-output.dto';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { UpdateBillOfMaterialDto } from './dto/update-bill-of-material.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
import { UpdateQualityCheckDto } from './dto/update-quality-check.dto';
import { v4 as uuidv4 } from 'uuid'; 

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(BillOfMaterial)
    private bomRepository: Repository<BillOfMaterial>,
    @InjectRepository(BillOfMaterialItem)
    private bomItemRepository: Repository<BillOfMaterialItem>,
    @InjectRepository(ProductionOrder)
    private productionOrderRepository: Repository<ProductionOrder>,
    @InjectRepository(ProductionInput)
    private productionInputRepository: Repository<ProductionInput>,
    @InjectRepository(ProductionOutput)
    private productionOutputRepository: Repository<ProductionOutput>,
    @InjectRepository(QualityCheck)
    private qualityCheckRepository: Repository<QualityCheck>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(ProductLot)
    private productLotRepository: Repository<ProductLot>,
    @InjectRepository(ProductSerial)
    private productSerialRepository: Repository<ProductSerial>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private movementsService: MovementsService,
    private connection: Connection,
  ) {}
  async createBillOfMaterial(createBomDto: CreateBillOfMaterialDto): Promise<BillOfMaterial> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, { where: { id: createBomDto.product_id } });
      if (!product) {
        throw new NotFoundException(`Product with ID "${createBomDto.product_id}" not found.`);
      }

      const newBom = queryRunner.manager.create(BillOfMaterial, {
        name: createBomDto.name,
        description: createBomDto.description,
        product: product,
        quantity_produced: createBomDto.quantity_produced,
      });

      const savedBom = await queryRunner.manager.save(newBom);

      if (createBomDto.items && createBomDto.items.length > 0) {
        for (const itemDto of createBomDto.items) {
          const componentProduct = await queryRunner.manager.findOne(Product, { where: { id: itemDto.component_product_id } });
          if (!componentProduct) {
            throw new NotFoundException(`Component Product with ID "${itemDto.component_product_id}" not found for BOM item.`);
          }
          const bomItem = queryRunner.manager.create(BillOfMaterialItem, {
            billOfMaterial: savedBom,
            componentProduct: componentProduct,
            quantity: itemDto.quantity,
          });
          await queryRunner.manager.save(bomItem);
        }
      }
      await queryRunner.commitTransaction();
      const bom = await this.bomRepository.findOne({ where: { id: savedBom.id }, relations: ['product', 'items', 'items.componentProduct'] });
      if (!bom) {
        throw new NotFoundException(`Bill of Material with ID "${savedBom.id}" not found after creation.`);
      }
      return bom;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Bill of Material name already exists for this product.');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllBillsOfMaterial(): Promise<BillOfMaterial[]> {
    return this.bomRepository.find({ relations: ['product', 'items', 'items.componentProduct'] });
  }

  async findBillOfMaterialById(id: string): Promise<BillOfMaterial> {
    const bom = await this.bomRepository.findOne({
      where: { id },
      relations: ['product', 'items', 'items.componentProduct'],
    });
    if (!bom) {
      throw new NotFoundException(`Bill of Material with ID "${id}" not found.`);
    }
    return bom;
  }

  async updateBillOfMaterial(id: string, updateBomDto: UpdateBillOfMaterialDto): Promise<BillOfMaterial> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const bom = await queryRunner.manager.findOne(BillOfMaterial, { where: { id }, relations: ['items'] });
      if (!bom) {
        throw new NotFoundException(`Bill of Material with ID "${id}" not found.`);
      }

      if (updateBomDto.product_id && updateBomDto.product_id !== bom.product_id) {
        const product = await queryRunner.manager.findOne(Product, { where: { id: updateBomDto.product_id } });
        if (!product) throw new NotFoundException(`Product with ID "${updateBomDto.product_id}" not found.`);
        bom.product = product;
      }

      queryRunner.manager.merge(BillOfMaterial, bom, updateBomDto);

      if (updateBomDto.items !== undefined) {
        await queryRunner.manager.delete(BillOfMaterialItem, { bom_id: bom.id });
        for (const itemDto of updateBomDto.items) {
          const componentProduct = await queryRunner.manager.findOne(Product, { where: { id: itemDto.component_product_id } });
          if (!componentProduct) {
            throw new NotFoundException(`Component Product with ID "${itemDto.component_product_id}" not found for BOM item.`);
          }
          const bomItem = queryRunner.manager.create(BillOfMaterialItem, {
            billOfMaterial: bom,
            componentProduct: componentProduct,
            quantity: itemDto.quantity,
          });
          await queryRunner.manager.save(bomItem);
        }
      }

      const updatedBom = await queryRunner.manager.save(bom);
      await queryRunner.commitTransaction();
      const bomResult = await this.bomRepository.findOne({ where: { id: updatedBom.id }, relations: ['product', 'items', 'items.componentProduct'] });
      if (!bomResult) {
        throw new NotFoundException(`Bill of Material with ID "${updatedBom.id}" not found after update.`);
      }
      return bomResult;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Bill of Material name already exists for this product.');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteBillOfMaterial(id: string): Promise<void> {
    const ordersCount = await this.productionOrderRepository.count({ where: { bom_id: id } });
    if (ordersCount > 0) {
      throw new BadRequestException('Cannot delete BOM as it is used in existing production orders.');
    }
    const result = await this.bomRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Bill of Material with ID "${id}" not found.`);
    }
  }


  async createProductionOrder(createOrderDto: CreateProductionOrderDto): Promise<ProductionOrder> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, { where: { id: createOrderDto.product_id } });
      if (!product) throw new NotFoundException(`Product with ID "${createOrderDto.product_id}" not found.`);

      let bom: BillOfMaterial | null = null;
      if (createOrderDto.bom_id) {
        bom = await queryRunner.manager.findOne(BillOfMaterial, { where: { id: createOrderDto.bom_id } });
        if (!bom) throw new NotFoundException(`BOM with ID "${createOrderDto.bom_id}" not found.`);
        if (bom.product_id !== product.id) {
            throw new BadRequestException(`BOM with ID "${createOrderDto.bom_id}" is not for product "${product.name}".`);
        }
      }

      let productionLocation: Location | null = null;
      if (createOrderDto.production_location_id) {
        productionLocation = await queryRunner.manager.findOne(Location, { where: { id: createOrderDto.production_location_id } });
        if (!productionLocation) throw new NotFoundException(`Production Location with ID "${createOrderDto.production_location_id}" not found.`);
      }

      let createdBy: User | null = null;
      if (createOrderDto.created_by_user_id) {
        createdBy = await queryRunner.manager.findOne(User, { where: { id: createOrderDto.created_by_user_id } });
        if (!createdBy) throw new NotFoundException(`User with ID "${createOrderDto.created_by_user_id}" not found.`);
      }
      const orderNumber = createOrderDto.order_number || uuidv4(); 
      const newOrder = queryRunner.manager.create(ProductionOrder, {
        order_number: orderNumber,
        product,
        billOfMaterial: bom,
        quantity_to_produce: createOrderDto.quantity_to_produce,
        productionLocation,
        start_date: createOrderDto.start_date,
        end_date: createOrderDto.end_date,
        notes: createOrderDto.notes,
        createdBy,
        status: ProductionOrderStatus.PENDING, 
        quantity_produced: 0,
      });
      const savedOrder = await queryRunner.manager.save(newOrder);
      await queryRunner.commitTransaction();
      const order = await this.productionOrderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['product', 'billOfMaterial', 'productionLocation', 'createdBy'],
      });
      if (!order) {
        throw new NotFoundException(`Production Order with ID "${savedOrder.id}" not found after creation.`);
      }
      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Production Order number already exists.');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async findAllProductionOrders(): Promise<ProductionOrder[]> {
    return this.productionOrderRepository.find({
      relations: ['product', 'billOfMaterial', 'productionLocation', 'createdBy'],
    });
  }
  async findProductionOrderById(id: string): Promise<ProductionOrder> {
    const order = await this.productionOrderRepository.findOne({
      where: { id },
      relations: ['product', 'billOfMaterial', 'productionLocation', 'createdBy', 'inputs', 'outputs', 'qualityChecks'],
    });
    if (!order) {
      throw new NotFoundException(`Production Order with ID "${id}" not found.`);
    }
    return order;
  }
  async updateProductionOrder(id: string, updateOrderDto: UpdateProductionOrderDto): Promise<ProductionOrder> {
    const order = await this.findProductionOrderById(id);
    const { product_id, bom_id, production_location_id, created_by_user_id, ...orderData } = updateOrderDto;
    if (product_id && product_id !== order.product_id) {
        const product = await this.productRepository.findOne({ where: { id: product_id } });
        if (!product) throw new NotFoundException(`Product with ID "${product_id}" not found.`);
        order.product = product;
    }

    if (bom_id !== undefined) {
        if (bom_id === null) {
            order.billOfMaterial = null;
        } else {
            const bom = await this.bomRepository.findOne({ where: { id: bom_id } });
            if (!bom) throw new NotFoundException(`BOM with ID "${bom_id}" not found.`);
            if (bom.product_id !== order.product.id) {
                throw new BadRequestException(`BOM with ID "${bom_id}" is not for product "${order.product.name}".`);
            }
            order.billOfMaterial = bom;
        }
    }
    if (production_location_id !== undefined) {
        if (production_location_id === null) {
            order.productionLocation = null;
        } else {
            const productionLocation = await this.locationRepository.findOne({ where: { id: production_location_id } });
            if (!productionLocation) throw new NotFoundException(`Production Location with ID "${production_location_id}" not found.`);
            order.productionLocation = productionLocation;
        }
    }
    if (created_by_user_id !== undefined) {
        if (created_by_user_id === null) {
            order.createdBy = null;
        } else {
            const createdBy = await this.userRepository.findOne({ where: { id: created_by_user_id } });
            if (!createdBy) throw new NotFoundException(`User with ID "${created_by_user_id}" not found.`);
            order.createdBy = createdBy;
        }
    }
    this.productionOrderRepository.merge(order, orderData); // Aquí solo se fusionan las propiedades permitidas de orderData
    try {
        return await this.productionOrderRepository.save(order);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new BadRequestException('Production Order number already exists.');
        }
        throw error;
    }
  }

  async deleteProductionOrder(id: string): Promise<void> {
    const order = await this.productionOrderRepository.findOne({ where: { id }, relations: ['inputs', 'outputs', 'qualityChecks'] });
    if (!order) {
        throw new NotFoundException(`Production Order with ID "${id}" not found.`);
    }
    if (order.status === ProductionOrderStatus.IN_PROGRESS || order.status === ProductionOrderStatus.COMPLETED) {
        throw new BadRequestException(`Cannot delete production order with status "${order.status}". Consider canceling instead.`);
    }
    if (order.inputs.length > 0 || order.outputs.length > 0 || order.qualityChecks.length > 0) {
        throw new BadRequestException('Cannot delete production order with associated inputs, outputs, or quality checks. Consider canceling instead.');
    }
    const result = await this.productionOrderRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Production Order with ID "${id}" not found.`);
    }
  }
  async createProductionInput(createInputDto: CreateProductionInputDto): Promise<ProductionInput> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(ProductionOrder, { where: { id: createInputDto.production_order_id } });
      if (!order) throw new NotFoundException(`Production Order with ID "${createInputDto.production_order_id}" not found.`);
            if (order.status !== ProductionOrderStatus.IN_PROGRESS && order.status !== ProductionOrderStatus.PENDING) {
          throw new BadRequestException(`Cannot add input to order with status "${order.status}".`);
      }
      const materialProduct = await queryRunner.manager.findOne(Product, { where: { id: createInputDto.material_product_id } });
      if (!materialProduct) throw new NotFoundException(`Material Product with ID "${createInputDto.material_product_id}" not found.`);

      const fromLocation = await queryRunner.manager.findOne(Location, { where: { id: createInputDto.from_location_id } });
      if (!fromLocation) throw new NotFoundException(`Origin Location with ID "${createInputDto.from_location_id}" not found.`);

      let productLot: ProductLot | null = null;
      if (createInputDto.product_lot_id) {
        productLot = await queryRunner.manager.findOne(ProductLot, { where: { id: createInputDto.product_lot_id, product_id: createInputDto.material_product_id } });
        if (!productLot) throw new NotFoundException(`Product Lot with ID "${createInputDto.product_lot_id}" for product "${createInputDto.material_product_id}" not found.`);
      }

      let productSerial: ProductSerial | null = null;
      if (createInputDto.product_serial_id) {
        productSerial = await queryRunner.manager.findOne(ProductSerial, { where: { id: createInputDto.product_serial_id, product_id: createInputDto.material_product_id } });
        if (!productSerial) throw new NotFoundException(`Product Serial with ID "${createInputDto.product_serial_id}" for product "${createInputDto.material_product_id}" not found.`);
        if (createInputDto.quantity_consumed !== 1) { 
            throw new BadRequestException('Quantity consumed for serialized product must be 1.');
        }
      } else if (materialProduct.barcode && !productLot) { 
      }
      const newProductionInput = queryRunner.manager.create(ProductionInput, {
        ...createInputDto,
      });
      newProductionInput.productionOrder = order;
      newProductionInput.materialProduct = materialProduct;
      newProductionInput.fromLocation = fromLocation;
      if (productLot) {
        newProductionInput.productLot = productLot;
      }
      if (productSerial) {
        newProductionInput.productSerial = productSerial;
      }
      

      const savedInput = await queryRunner.manager.save(newProductionInput);

      await this.movementsService.create({
        movement_type: 'production_input',
        product_id: materialProduct.id,
        from_location_id: fromLocation.id,
        quantity: createInputDto.quantity_consumed,
        product_lot_id: productLot ? productLot.id : undefined,
        product_serial_id: productSerial ? productSerial.id : undefined,
        reference_document_id: order.id,
        reference_document_type: 'ProductionOrder',
        notes: `Consumed for Production Order: ${order.order_number}`,
      });

      if (order.status === ProductionOrderStatus.PENDING) {
          order.status = ProductionOrderStatus.IN_PROGRESS;
          await queryRunner.manager.save(order); 
      }

      await queryRunner.commitTransaction();
      const result = await this.productionInputRepository.findOne({
        where: { id: savedInput.id },
        relations: ['productionOrder', 'materialProduct', 'fromLocation', 'productLot', 'productSerial']
      });
      if (!result) {
        throw new InternalServerErrorException('Production input was not found after creation.');
      }
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create production input.');
    } finally {
      await queryRunner.release();
    }
  }
  async createProductionOutput(createOutputDto: CreateProductionOutputDto): Promise<ProductionOutput> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(ProductionOrder, { where: { id: createOutputDto.production_order_id } });
      if (!order) throw new NotFoundException(`Production Order with ID "${createOutputDto.production_order_id}" not found.`);
      
      if (order.status !== ProductionOrderStatus.IN_PROGRESS) {
          throw new BadRequestException(`Cannot add output to order with status "${order.status}". Production must be in progress.`);
      }
      const producedProduct = await queryRunner.manager.findOne(Product, { where: { id: createOutputDto.produced_product_id } });
      if (!producedProduct) throw new NotFoundException(`Produced Product with ID "${createOutputDto.produced_product_id}" not found.`);
      if (order.product_id !== producedProduct.id) {
          throw new BadRequestException(`Produced product "${producedProduct.name}" does not match the product for order "${order.order_number}".`);
      }

      const toLocation = await queryRunner.manager.findOne(Location, { where: { id: createOutputDto.to_location_id } });
      if (!toLocation) throw new NotFoundException(`Destination Location with ID "${createOutputDto.to_location_id}" not found.`);

      let productLot: ProductLot | null = null;
      if (createOutputDto.product_lot_id) {
        productLot = await queryRunner.manager.findOne(ProductLot, { where: { id: createOutputDto.product_lot_id, product_id: createOutputDto.produced_product_id } });
        if (!productLot) throw new NotFoundException(`Product Lot with ID "${createOutputDto.product_lot_id}" for product "${createOutputDto.produced_product_id}" not found.`);
      }

      let productSerial: ProductSerial | null = null;
      if (createOutputDto.product_serial_id) {
        productSerial = await queryRunner.manager.findOne(ProductSerial, { where: { id: createOutputDto.product_serial_id, product_id: createOutputDto.produced_product_id } });
        if (!productSerial) throw new NotFoundException(`Product Serial with ID "${createOutputDto.product_serial_id}" for product "${createOutputDto.produced_product_id}" not found.`);
        if (createOutputDto.quantity_produced !== 1) { 
            throw new BadRequestException('Quantity produced for serialized product must be 1.');
        }
      }
      const newProductionOutput = queryRunner.manager.create(ProductionOutput, {
        ...createOutputDto,
      });
      newProductionOutput.productionOrder = order;
      newProductionOutput.producedProduct = producedProduct;
      newProductionOutput.toLocation = toLocation;
      if (productLot) {
        newProductionOutput.productLot = productLot;
      }
      if (productSerial) {
        newProductionOutput.productSerial = productSerial;
      }
      
      
      const savedOutput = await queryRunner.manager.save(newProductionOutput);

      await this.movementsService.create({
        movement_type: 'production_output',
        product_id: producedProduct.id,
        to_location_id: toLocation.id,
        quantity: createOutputDto.quantity_produced,
        product_lot_id: productLot ? productLot.id : undefined,
        product_serial_id: productSerial ? productSerial.id : undefined,
        reference_document_id: order.id,
        reference_document_type: 'ProductionOrder',
        notes: `Produced from Production Order: ${order.order_number}`,
      });
      order.quantity_produced += createOutputDto.quantity_produced;
      if (order.quantity_produced >= order.quantity_to_produce) {
        order.status = ProductionOrderStatus.COMPLETED; 
      }
      await queryRunner.manager.save(order); 
      await queryRunner.commitTransaction();
      const result = await this.productionOutputRepository.findOne({
        where: { id: savedOutput.id },
        relations: ['productionOrder', 'producedProduct', 'toLocation', 'productLot', 'productSerial']
      });
      if (!result) {
        throw new InternalServerErrorException('Production output was not found after creation.');
      }
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create production output.');
    } finally {
      await queryRunner.release();
    }
  }

  async cancelProductionOrder(id: string): Promise<ProductionOrder> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(ProductionOrder, { where: { id } });
      if (!order) {
        throw new NotFoundException(`Production Order with ID "${id}" not found.`);
      }
      if (order.status === ProductionOrderStatus.COMPLETED) {
        throw new BadRequestException('Cannot cancel a completed production order.');
      }
      order.status = ProductionOrderStatus.CANCELLED;
      const savedOrder = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to cancel production order.');
    } finally {
      await queryRunner.release();
    }
  }
  async createQualityCheck(createCheckDto: CreateQualityCheckDto): Promise<QualityCheck> {
    const productionOrder = createCheckDto.production_order_id
      ? await this.productionOrderRepository.findOne({ where: { id: createCheckDto.production_order_id } })
      : null;
    if (createCheckDto.production_order_id && !productionOrder) {
      throw new NotFoundException(`Production Order with ID "${createCheckDto.production_order_id}" not found.`);
    }

    const product = await this.productRepository.findOne({ where: { id: createCheckDto.product_id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${createCheckDto.product_id}" not found.`);
    }

    const checkedBy = createCheckDto.checked_by_user_id
      ? await this.userRepository.findOne({ where: { id: createCheckDto.checked_by_user_id } })
      : null;
    if (createCheckDto.checked_by_user_id && !checkedBy) {
      throw new NotFoundException(`User with ID "${createCheckDto.checked_by_user_id}" not found.`);
    }

    if (createCheckDto.quantity_accepted + createCheckDto.quantity_rejected > createCheckDto.quantity_inspected) {
      throw new BadRequestException('Accepted and rejected quantities cannot exceed inspected quantity.');
    }

    const newCheck = this.qualityCheckRepository.create({
      quantity_inspected: createCheckDto.quantity_inspected,
      quantity_accepted: createCheckDto.quantity_accepted,
      quantity_rejected: createCheckDto.quantity_rejected,
      result: createCheckDto.result,
      failure_reason: createCheckDto.failure_reason,
      check_date: createCheckDto.check_date,
      productionOrder,
      product,
      checkedBy,
    });
    return this.qualityCheckRepository.save(newCheck);
  }

  async findAllQualityChecks(): Promise<QualityCheck[]> {
    return this.qualityCheckRepository.find({ relations: ['productionOrder', 'product', 'checkedBy'] });
  }

  async findQualityCheckById(id: string): Promise<QualityCheck> {
    const check = await this.qualityCheckRepository.findOne({
      where: { id },
      relations: ['productionOrder', 'product', 'checkedBy'],
    });
    if (!check) {
      throw new NotFoundException(`Quality Check with ID "${id}" not found.`);
    }
    return check;
  }

  async updateQualityCheck(id: string, updateCheckDto: UpdateQualityCheckDto): Promise<QualityCheck> {
    const check = await this.findQualityCheckById(id);
    this.qualityCheckRepository.merge(check, updateCheckDto);
    return this.qualityCheckRepository.save(check);
  }

  async deleteQualityCheck(id: string): Promise<void> {
    const result = await this.qualityCheckRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Quality Check with ID "${id}" not found.`);
    }
  }
}