import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateLocationDto} from './dto/create-location.dto';
import { CreateProductLotDto} from './dto/create-product-lot.dto';
import { CreateProductSerialDto } from './dto/create-product-serial.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateProductLotDto } from './dto/update-product-lot.dto';
import { UpdateProductSerialDto } from './dto/update-product-serial.dto';

@Controller('inventory')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}
  @Post('locations')
  @HttpCode(HttpStatus.CREATED)
  createLocation(@Body() createLocationDto: CreateLocationDto) {
    return this.inventoryService.createLocation(createLocationDto);
  }
  @Get('locations')
  findAllLocations() {
    return this.inventoryService.findAllLocations();
  }
  @Get('locations/:id')
  findLocationById(@Param('id') id: string) {
    return this.inventoryService.findLocationById(id);
  }
  @Patch('locations/:id')
  updateLocation(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.inventoryService.updateLocation(id, updateLocationDto);
  }
  @Delete('locations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLocation(@Param('id') id: string) {
    return this.inventoryService.deleteLocation(id);
  }
  @Post('lots')
  @HttpCode(HttpStatus.CREATED)
  createProductLot(@Body() createProductLotDto: CreateProductLotDto) {
    return this.inventoryService.createProductLot(createProductLotDto);
  }
  @Get('lots')
  findAllProductLots() {
    return this.inventoryService.findAllProductLots();
  }
  @Get('lots/:id')
  findProductLotById(@Param('id') id: string) {
    return this.inventoryService.findProductLotById(id);
  }
  @Patch('lots/:id')
  updateProductLot(@Param('id') id: string, @Body() updateProductLotDto: UpdateProductLotDto) {
    return this.inventoryService.updateProductLot(id, updateProductLotDto);
  }
  @Delete('lots/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProductLot(@Param('id') id: string) {
    return this.inventoryService.deleteProductLot(id);
  }
  @Post('serials')
  @HttpCode(HttpStatus.CREATED)
  createProductSerial(@Body() createProductSerialDto: CreateProductSerialDto) {
    return this.inventoryService.createProductSerial(createProductSerialDto);
  }
  @Get('serials')
  findAllProductSerials() {
    return this.inventoryService.findAllProductSerials();
  }
  @Get('serials/:id')
  findProductSerialById(@Param('id') id: string) {
    return this.inventoryService.findProductSerialById(id);
  }
  @Patch('serials/:id')
  updateProductSerial(@Param('id') id: string, @Body() updateProductSerialDto: UpdateProductSerialDto) {
    return this.inventoryService.updateProductSerial(id, updateProductSerialDto);
  }
  @Delete('serials/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProductSerial(@Param('id') id: string) {
    return this.inventoryService.deleteProductSerial(id);
  }
  @Get('snapshot')
  getInventorySnapshot() {
    return this.inventoryService.getInventorySnapshot();
  }
  @Get('product/:productId')
  getProductInventory(@Param('productId') productId: string) {
    return this.inventoryService.getProductInventory(productId);
  }
  @Get('location/:locationId')
  getLocationInventory(@Param('locationId') locationId: string) {
    return this.inventoryService.getLocationInventory(locationId);
  }
}