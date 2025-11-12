import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards, 
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UpdateSupplierCategoryDto } from './dto/update-supplier-category.dto';
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { Supplier } from './entities/supplier.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard) 
@Controller('api/proveedores')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() rawSupplierData: Record<string, any>,
    @TenantId() tenantId: string, 
  ): Promise<Supplier> {
    const createSupplierDto: CreateSupplierDto = {
      name: rawSupplierData.nombre,
      nit: rawSupplierData.nit,
      verification_digit: rawSupplierData.DV,
      address: rawSupplierData.direccion,
      email: rawSupplierData.correo,
      phone: rawSupplierData.telefono,
      city: rawSupplierData.ciudad,
      notifications_enabled:
        rawSupplierData.NOTI === 'NO' ? false : true,
      document_type: rawSupplierData.TIPOD,
      contact_first_name: rawSupplierData.nombre1,
      contact_middle_name: rawSupplierData.nombre2,
      contact_last_name: rawSupplierData.apellido1,
      contact_second_last_name: rawSupplierData.apellido2,
      commercial_name: rawSupplierData.COMERCIO,
      bank_account_type: rawSupplierData.TIPOC,
      bank_account_number: rawSupplierData.NUMCUENTA,
      bank_name: rawSupplierData.BANCO,
      contact_person: rawSupplierData.contact_person,
      notes: rawSupplierData.notes,
      category_id: rawSupplierData.category_id,
    };

    return this.suppliersService.create(createSupplierDto, tenantId); 
  }

  @Get('getAll')
  async findAll(@TenantId() tenantId: string): Promise<Supplier[]> {
    return this.suppliersService.findAll(tenantId); 
  }

  @Get('oneProveedor/:id')
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string, 
  ): Promise<Supplier> {
    return this.suppliersService.findOne(id, tenantId); 
  }

  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body() rawSupplierData: Record<string, any>,
    @TenantId() tenantId: string, 
  ): Promise<Supplier> {
    const updateSupplierDto: UpdateSupplierDto = {
      name: rawSupplierData.nombre,
      nit: rawSupplierData.nit,
      verification_digit: rawSupplierData.DV,
      address: rawSupplierData.direccion,
      email: rawSupplierData.correo,
      phone: rawSupplierData.telefono,
      city: rawSupplierData.ciudad,
      notifications_enabled:
      rawSupplierData.NOTI === 'NO' ? false : true,
      document_type: rawSupplierData.TIPOD,
      contact_first_name: rawSupplierData.nombre1,
      contact_middle_name: rawSupplierData.nombre2,
      contact_last_name: rawSupplierData.apellido1,
      contact_second_last_name: rawSupplierData.apellido2,
      commercial_name: rawSupplierData.COMERCIO,
      bank_account_type: rawSupplierData.TIPOC,
      bank_account_number: rawSupplierData.NUMCUENTA,
      bank_name: rawSupplierData.BANCO,
      category_id: rawSupplierData.id_categoria_proveedor,
      contact_person: rawSupplierData.contact_person,
      notes: rawSupplierData.notes,
    };
    Object.keys(updateSupplierDto).forEach((key) => {
      if (updateSupplierDto[key] === undefined) {
        delete updateSupplierDto[key];
      }
    });

    return this.suppliersService.update(id, updateSupplierDto, tenantId); 
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string, 
  ): Promise<void> {
    return this.suppliersService.remove(id, tenantId); 
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  createCategory(
    @Body() dto: CreateSupplierCategoryDto,
    @TenantId() tenantId: string, 
  ) {
    return this.suppliersService.createCategory(dto, tenantId); 
  }

  @Get('categories')
  findAllCategories(@TenantId() tenantId: string) {
    return this.suppliersService.findAllCategories(tenantId); 
  }

  @Get('categories/:id')
  findCategory(
    @Param('id') id: string,
    @TenantId() tenantId: string, 
  ) {
    return this.suppliersService.findCategoryById(id, tenantId);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierCategoryDto,
    @TenantId() tenantId: string, 
  ) {
    return this.suppliersService.updateCategory(id, dto, tenantId); 
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCategory(
    @Param('id') id: string,
    @TenantId() tenantId: string, 
  ) {
    return this.suppliersService.removeCategory(id, tenantId); 
  }
}