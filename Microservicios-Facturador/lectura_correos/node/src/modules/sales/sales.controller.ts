import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; 
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('sales')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
// @UseGuards(JwtAuthGuard) 
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.salesService.createCustomer(createCustomerDto);
  }

  @Get('customers')
  findAllCustomers() {
    return this.salesService.findAllCustomers();
  }

  @Get('customers/:id')
  findCustomerById(@Param('id') id: string) {
    return this.salesService.findCustomerById(id);
  }

  @Patch('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.salesService.updateCustomer(id, updateCustomerDto);
  }

  @Delete('customers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCustomer(@Param('id') id: string) {
    return this.salesService.deleteCustomer(id);
  }

  // --- Invoice Endpoints ---
  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.salesService.createInvoice(createInvoiceDto);
  }

  @Get('invoices')
  findAllInvoices() {
    return this.salesService.findAllInvoices();
  }

  @Get('invoices/:id')
  findInvoiceById(@Param('id') id: string) {
    return this.salesService.findInvoiceById(id);
  }

  @Patch('invoices/:id')
  updateInvoice(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.salesService.updateInvoice(id, updateInvoiceDto);
  }

  @Delete('invoices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteInvoice(@Param('id') id: string) {
    return this.salesService.deleteInvoice(id);
  }
}