import { PartialType } from '@nestjs/mapped-types';
import { CreateProductLotDto } from './create-product-lot.dto';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateProductLotDto extends PartialType(CreateProductLotDto) {
  @IsNumber()
  @Min(0)
  @IsOptional()
  current_quantity?: number;

  @IsString()
  @IsOptional()
  status?: string; 
}