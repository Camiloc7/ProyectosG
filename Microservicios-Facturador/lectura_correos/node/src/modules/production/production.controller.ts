import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateBillOfMaterialDto } from './dto/create-bill-of-material.dto';
import { CreateProductionOrderDto} from './dto/create-production-order.dto';
import { CreateProductionInputDto } from './dto/create-production-input.dto';
import { CreateProductionOutputDto } from './dto/create-production-output.dto';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; 
import { UpdateQualityCheckDto } from './dto/update-quality-check.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
import { UpdateBillOfMaterialDto } from './dto/update-bill-of-material.dto';

@Controller('production')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  // --- BillOfMaterial Endpoints ---
  @Post('boms')
  @HttpCode(HttpStatus.CREATED)
  createBillOfMaterial(@Body() createBomDto: CreateBillOfMaterialDto) {
    return this.productionService.createBillOfMaterial(createBomDto);
  }

  @Get('boms')
  findAllBillsOfMaterial() {
    return this.productionService.findAllBillsOfMaterial();
  }

  @Get('boms/:id')
  findBillOfMaterialById(@Param('id') id: string) {
    return this.productionService.findBillOfMaterialById(id);
  }

  @Patch('boms/:id')
  updateBillOfMaterial(@Param('id') id: string, @Body() updateBomDto: UpdateBillOfMaterialDto) {
    return this.productionService.updateBillOfMaterial(id, updateBomDto);
  }

  @Delete('boms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBillOfMaterial(@Param('id') id: string) {
    return this.productionService.deleteBillOfMaterial(id);
  }

  // --- ProductionOrder Endpoints ---
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  createProductionOrder(@Body() createOrderDto: CreateProductionOrderDto) {
    return this.productionService.createProductionOrder(createOrderDto);
  }

  @Get('orders')
  findAllProductionOrders() {
    return this.productionService.findAllProductionOrders();
  }

  @Get('orders/:id')
  findProductionOrderById(@Param('id') id: string) {
    return this.productionService.findProductionOrderById(id);
  }

  @Patch('orders/:id')
  updateProductionOrder(@Param('id') id: string, @Body() updateOrderDto: UpdateProductionOrderDto) {
    return this.productionService.updateProductionOrder(id, updateOrderDto);
  }

  @Delete('orders/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProductionOrder(@Param('id') id: string) {
    return this.productionService.deleteProductionOrder(id);
  }

  // --- ProductionInput Endpoints ---
  @Post('inputs')
  @HttpCode(HttpStatus.CREATED)
  createProductionInput(@Body() createInputDto: CreateProductionInputDto) {
    return this.productionService.createProductionInput(createInputDto);
  }

  // --- ProductionOutput Endpoints ---
  @Post('outputs')
  @HttpCode(HttpStatus.CREATED)
  createProductionOutput(@Body() createOutputDto: CreateProductionOutputDto) {
    return this.productionService.createProductionOutput(createOutputDto);
  }

  // --- QualityCheck Endpoints ---
  @Post('quality-checks')
  @HttpCode(HttpStatus.CREATED)
  createQualityCheck(@Body() createCheckDto: CreateQualityCheckDto) {
    return this.productionService.createQualityCheck(createCheckDto);
  }

  @Get('quality-checks')
  findAllQualityChecks() {
    return this.productionService.findAllQualityChecks();
  }

  @Get('quality-checks/:id')
  findQualityCheckById(@Param('id') id: string) {
    return this.productionService.findQualityCheckById(id);
  }

  @Patch('quality-checks/:id')
  updateQualityCheck(@Param('id') id: string, @Body() updateCheckDto: UpdateQualityCheckDto) {
    return this.productionService.updateQualityCheck(id, updateCheckDto);
  }

  @Delete('quality-checks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteQualityCheck(@Param('id') id: string) {
    return this.productionService.deleteQualityCheck(id);
  }
}