import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Controller('movements')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMovementDto: CreateMovementDto) {
    return this.movementsService.create(createMovementDto);
  }

  @Get()
  findAll() {
    return this.movementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movementsService.findOne(id);
  }

  @Get('product/:productId')
  findMovementsByProduct(@Param('productId') productId: string) {
    return this.movementsService.findMovementsByProduct(productId);
  }

  @Get('location/:locationId')
  findMovementsByLocation(@Param('locationId') locationId: string) {
    return this.movementsService.findMovementsByLocation(locationId);
  }

}