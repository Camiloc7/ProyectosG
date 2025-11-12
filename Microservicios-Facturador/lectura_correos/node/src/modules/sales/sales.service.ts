import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Invoice } from './entities/invoice.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductLot } from '../inventory/entities/product-lot.entity';
import { ProductSerial } from '../inventory/entities/product-serial.entity';
import { User } from '../users/entities/user.entity';
import { MovementsService } from '../movements/movements.service';
import { Location } from '../inventory/entities/location.entity'; 
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateInvoiceDto} from './dto/create-invoice.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InvoiceItem } from './entities/invoice-item.entity';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductLot)
    private productLotRepository: Repository<ProductLot>,
    @InjectRepository(ProductSerial)
    private productSerialRepository: Repository<ProductSerial>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private movementsService: MovementsService, 
    private connection: Connection,
  ) {}
  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const newCustomer = this.customerRepository.create(createCustomerDto);
    try {
      return await this.customerRepository.save(newCustomer);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Customer with this email or tax ID already exists.');
      }
      throw error;
    }
  }

  async findAllCustomers(): Promise<Customer[]> {
    return this.customerRepository.find();
  }

  async findCustomerById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found.`);
    }
    return customer;
  }

  async updateCustomer(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findCustomerById(id);
    this.customerRepository.merge(customer, updateCustomerDto);
    try {
      return await this.customerRepository.save(customer);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Customer with this email or tax ID already exists.');
      }
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    const invoicesCount = await this.invoiceRepository.count({ where: { customer_id: id } });
    if (invoicesCount > 0) {
      throw new BadRequestException('Cannot delete customer with existing invoices.');
    }
    const result = await this.customerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID "${id}" not found.`);
    }
  }

  // --- Invoice CRUD ---
  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const customer = await queryRunner.manager.findOne(Customer, { where: { id: createInvoiceDto.customer_id } });
      if (!customer) throw new NotFoundException(`Customer with ID "${createInvoiceDto.customer_id}" not found.`);

      let createdBy: User | null = null;
      if (createInvoiceDto.created_by_user_id) {
        createdBy = await queryRunner.manager.findOne(User, { where: { id: createInvoiceDto.created_by_user_id } });
        if (!createdBy) throw new NotFoundException(`User with ID "${createInvoiceDto.created_by_user_id}" not found.`);
      }

      let subTotal = 0;
      let totalAmount = 0;

      const newInvoice = queryRunner.manager.create(Invoice, {
        invoice_number: createInvoiceDto.invoice_number,
        customer: customer,
        invoice_date: createInvoiceDto.invoice_date || new Date(),
        notes: createInvoiceDto.notes,
        createdBy: createdBy || undefined,
        status: 'pending',
      });

      const savedInvoice = await queryRunner.manager.save(newInvoice);

      for (const itemDto of createInvoiceDto.items) {
        const product = await queryRunner.manager.findOne(Product, { where: { id: itemDto.product_id } });
        if (!product) throw new NotFoundException(`Product with ID "${itemDto.product_id}" not found for invoice item.`);

        let productVariant: ProductVariant | null = null;
        if (itemDto.product_variant_id) {
          productVariant = await queryRunner.manager.findOne(ProductVariant, { where: { id: itemDto.product_variant_id, product_id: itemDto.product_id } });
          if (!productVariant) throw new NotFoundException(`Product Variant with ID "${itemDto.product_variant_id}" for product "${itemDto.product_id}" not found.`);
        }

        let productLot: ProductLot | null = null;
        if (itemDto.product_lot_id) {
          productLot = await queryRunner.manager.findOne(ProductLot, { where: { id: itemDto.product_lot_id, product_id: itemDto.product_id } });
          if (!productLot) throw new NotFoundException(`Product Lot with ID "${itemDto.product_lot_id}" for product "${itemDto.product_id}" not found.`);
        }

        let productSerial: ProductSerial | null = null;
        if (itemDto.product_serial_id) {
          productSerial = await queryRunner.manager.findOne(ProductSerial, { where: { id: itemDto.product_serial_id, product_id: itemDto.product_id } });
          if (!productSerial) throw new NotFoundException(`Product Serial with ID "${itemDto.product_serial_id}" for product "${itemDto.product_id}" not found.`);
          if (itemDto.quantity !== 1) { // Serialized items must have quantity 1
              throw new BadRequestException('Quantity for serialized product must be 1 in invoice item.');
          }
        }

        const itemTotalPrice = itemDto.quantity * itemDto.unit_price;
        subTotal += itemTotalPrice;

        const newInvoiceItem = queryRunner.manager.create(InvoiceItem, {
          invoice: savedInvoice,
          product: product,
          productVariant: productVariant ?? null,
          productLot: productLot ?? null,
          productSerial: productSerial ?? null,
          quantity: itemDto.quantity,
          unit_price: itemDto.unit_price,
          total_price: itemTotalPrice,
        } as Partial<InvoiceItem>);
        await queryRunner.manager.save(newInvoiceItem);

        const salesLocation = await queryRunner.manager.findOne(Location, { where: { name: 'Sales Area' } }); 
        if (!salesLocation) {
            throw new InternalServerErrorException('Default Sales Location not configured or found for inventory deduction.');
        }

        await this.movementsService.create({
          movement_type: 'sale',
          product_id: product.id,
          product_variant_id: productVariant ? productVariant.id : undefined,
          from_location_id: salesLocation.id, 
          quantity: itemDto.quantity,
          product_lot_id: productLot ? productLot.id : undefined,
          product_serial_id: productSerial ? productSerial.id : undefined,
          reference_document_id: savedInvoice.id,
          reference_document_type: 'SalesInvoice',
          notes: `Sold on Invoice: ${savedInvoice.invoice_number}`,
          // user_id: createInvoiceDto.created_by_user_id,
        });
      }

      newInvoice.sub_total = subTotal;
      newInvoice.tax_amount = createInvoiceDto.tax_amount || (subTotal * 0.19); 
      newInvoice.total_amount = newInvoice.sub_total + newInvoice.tax_amount;

      await queryRunner.manager.save(newInvoice);

      await queryRunner.commitTransaction();
      const invoice = await this.invoiceRepository.findOne({
        where: { id: savedInvoice.id },
        relations: [
          'customer',
          'createdBy',
          'items',
          'items.product',
          'items.productVariant',
          'items.productLot',
          'items.productSerial'
        ]
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID "${savedInvoice.id}" not found after creation.`);
      }
      return invoice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Invoice number already exists.');
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create invoice due to an unexpected error.');
    } finally {
      await queryRunner.release();
    }
  }

  async findAllInvoices(): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      relations: ['customer', 'createdBy', 'items', 'items.product', 'items.productVariant', 'items.productLot', 'items.productSerial'],
    });
  }

  async findInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['customer', 'createdBy', 'items', 'items.product', 'items.productVariant', 'items.productLot', 'items.productSerial'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${id}" not found.`);
    }
    return invoice;
  }

  async updateInvoice(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    // Updating invoices with complex item changes (adding/removing items)
    // is often handled by creating new "credit notes" or "adjustment invoices"
    // rather than directly modifying the original.
    // For simplicity here, we'll allow basic updates, but be cautious.

    const invoice = await this.findInvoiceById(id);

    const { customer_id, created_by_user_id, items, ...invoiceData } = updateInvoiceDto;

    if (customer_id && customer_id !== invoice.customer_id) {
        const customer = await this.customerRepository.findOne({ where: { id: customer_id } });
        if (!customer) throw new NotFoundException(`Customer with ID "${customer_id}" not found.`);
        invoice.customer = customer;
    }

    if (created_by_user_id && created_by_user_id !== invoice.created_by_user_id) {
        const createdBy = await this.userRepository.findOne({ where: { id: created_by_user_id } });
        if (!createdBy) throw new NotFoundException(`User with ID "${created_by_user_id}" not found.`);
        invoice.createdBy = createdBy;
    }

    this.invoiceRepository.merge(invoice, invoiceData);

    // If items are updated, this logic needs to be much more robust to handle
    // inventory adjustments for changes. For now, we omit complex item updates here.
    // For a real-world scenario, a dedicated "Invoice Adjustment" flow would be needed.

    try {
      return await this.invoiceRepository.save(invoice);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Invoice number already exists.');
      }
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    // Deleting an invoice implies reversing all its associated inventory movements.
    // This is a complex operation and generally not allowed in financial systems.
    // Instead, invoices are "canceled" or "refunded" by creating new compensating documents and movements.
    // A simplified delete is provided, but use with extreme caution.

    const invoice = await this.invoiceRepository.findOne({ where: { id }, relations: ['items'] });
    if (!invoice) {
        throw new NotFoundException(`Invoice with ID "${id}" not found.`);
    }

    // TODO: Implement inventory reversal movements if deleting a valid invoice
    // This would involve creating compensating 'adjustment' or 'return' movements
    // For simplicity, we'll just delete the invoice and items here, but this is INCOMPLETE for real-world.
    // You would need to check invoice.status and prevent deletion if 'paid' etc.

    const result = await this.invoiceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Invoice with ID "${id}" not found.`);
    }
  }
}