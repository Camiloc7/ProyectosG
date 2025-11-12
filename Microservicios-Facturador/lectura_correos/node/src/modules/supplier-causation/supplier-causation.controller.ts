
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  Delete, 
  HttpCode, 
  HttpStatus,
  UseGuards, 
} from '@nestjs/common';
import { SupplierCausationService } from './supplier-causation.service';
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { UpdateSupplierCategoryDto } from './dto/update-supplier-category.dto';
import { CreateCausationRuleDto } from './dto/create-causation-rule.dto';
import { UpdateCausationRuleDto } from './dto/update-causation-rule.dto';

import { TenantId } from '../../common/decorators/tenant-id.decorator'; 
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard) 
@Controller('supplier-causation')
export class SupplierCausationController {
  constructor(private readonly supplierCausationService: SupplierCausationService) {}

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Body() createCategoryDto: CreateSupplierCategoryDto,
    @TenantId() tenantId: string, 
  ) {
    const category = await this.supplierCausationService.createSupplierCategory(createCategoryDto, tenantId); 
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Categoría de proveedor y reglas de causación creadas exitosamente.',
      data: category,
    };
  }

  @Get('categories')
  async findAllCategories(
    @TenantId() tenantId: string, 
  ) {
    const categories = await this.supplierCausationService.findAllSupplierCategories(tenantId); 
    return {
      statusCode: HttpStatus.OK,
      message: 'Categorías de proveedor y sus reglas de causación recuperadas exitosamente.',
      data: categories,
    };
  }

  @Get('categories/:id')
  async findOneCategory(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const category = await this.supplierCausationService.findOneSupplierCategoryById(id, tenantId); 
    return {
      statusCode: HttpStatus.OK,
      message: `Categoría de proveedor con ID ${id} recuperada exitosamente.`,
      data: category,
    };
  }

  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string, 
    @Body() updateCategoryDto: UpdateSupplierCategoryDto,
    @TenantId() tenantId: string,
  ) {
    const updatedCategory = await this.supplierCausationService.updateSupplierCategory(id, updateCategoryDto, tenantId); 
    return {
      statusCode: HttpStatus.OK,
      message: `Categoría de proveedor con ID ${id} actualizada exitosamente.`,
      data: updatedCategory,
    };
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(
    @Param('id') id: string,
    @TenantId() tenantId: string, 
  ) {
    await this.supplierCausationService.deleteSupplierCategory(id, tenantId); 
  }


  @Post('categories/:supplierCategoryId/rules')
  @HttpCode(HttpStatus.CREATED)
  async createRuleForCategory(
    @Param('supplierCategoryId') supplierCategoryId: string, 
    @Body() createRuleDto: CreateCausationRuleDto,
    @TenantId() tenantId: string, 
  ) {
    const rule = await this.supplierCausationService.createCausationRule(supplierCategoryId, createRuleDto, tenantId); 
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Regla de causación creada exitosamente.',
      data: rule,
    };
  }

  @Get('rules/:id')
  async findRule(
    @Param('id') id: string,
    @TenantId() tenantId: string, 
  ) {
    const rule = await this.supplierCausationService.findRuleById(id, tenantId); 
    return {
      statusCode: HttpStatus.OK,
      message: `Regla de causación con ID ${id} recuperada exitosamente.`,
      data: rule,
    };
  }

  @Patch('rules/:id')
  async updateRule(
    @Param('id') id: string, 
    @Body() updateRuleDto: UpdateCausationRuleDto,
    @TenantId() tenantId: string, 
  ) {
    const updatedRule = await this.supplierCausationService.updateCausationRule(id, updateRuleDto, tenantId); 
    return {
      statusCode: HttpStatus.OK,
      message: `Regla de causación con ID ${id} actualizada exitosamente.`,
      data: updatedRule,
    };
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRule(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    await this.supplierCausationService.deleteCausationRule(id, tenantId); 
  }
}