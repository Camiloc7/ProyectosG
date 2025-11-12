import { PartialType } from '@nestjs/mapped-types';
import { CreateProductSerialDto } from './create-product-serial.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProductSerialDto extends PartialType(CreateProductSerialDto) {
  @IsString()
  @IsOptional()
  status?: string;
}