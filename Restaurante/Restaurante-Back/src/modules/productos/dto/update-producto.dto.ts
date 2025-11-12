import { PartialType } from '@nestjs/swagger';
import { CreateProductoDto, RecetaItemDto } from './create-producto.dto'; 
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductoDto extends PartialType(CreateProductoDto) {
  @ApiProperty({ type: [RecetaItemDto], description: 'Receta actualizada del producto (lista de ingredientes y cantidades necesarias)', required: false })
  @IsOptional()
  @IsArray({ message: 'La receta debe ser un array de ítems de receta' })
  @ValidateNested({ each: true })
  @Type(() => RecetaItemDto)
  receta?: RecetaItemDto[];
}