import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsNumber, IsPositive, IsBoolean, IsOptional, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class RecetaItemDto {
  @ApiProperty({ description: 'ID del ingrediente (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ingrediente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del ingrediente es obligatorio' })
  ingrediente_id: string;

  @ApiProperty({ description: 'Cantidad necesaria de este ingrediente para el producto', example: 100.0 })
  @IsNumber({}, { message: 'La cantidad necesaria debe ser un número' })
  @IsPositive({ message: 'La cantidad necesaria debe ser un número positivo' })
  @IsNotEmpty({ message: 'La cantidad necesaria es obligatoria' })
  cantidad_necesaria: number;
}

export class CreateProductoDto {
  @ApiHideProperty()
  @IsOptional()
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
  establecimiento_id?: string;

  @ApiProperty({ description: 'ID de la categoría a la que pertenece el producto (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'El ID de la categoría debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la categoría es obligatorio' })
  categoria_id: string;

  @ApiProperty({ description: 'Nombre del producto', maxLength: 100 })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no debe exceder los 100 caracteres' })
  nombre: string;

  @ApiProperty({ description: 'Descripción del producto', maxLength: 255, required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La descripción no debe exceder los 255 caracteres' })
  descripcion?: string;

  @ApiProperty({ description: 'Precio de venta del producto', example: 15.99 })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsPositive({ message: 'El precio debe ser un número positivo' })
  @IsNotEmpty({ message: 'El precio es obligatorio' })
  precio: number;

  @ApiProperty({ description: 'URL de la imagen del producto', maxLength: 255, required: false })
  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La URL de la imagen no debe exceder los 255 caracteres' })
  imagen_url?: string;

  @ApiProperty({ description: 'Indica si el producto está activo (opcional, por defecto true)', required: false })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo?: boolean;


  @ApiProperty({ description: 'Indica si el producto aplica IVA', required: true, example: false })
  @IsBoolean({ message: 'El valor de iva debe ser un booleano' })
  iva: boolean;

  @ApiProperty({ description: 'Indica si el producto aplica Impuesto al Consumo (IC)', required: true, example: false })
  @IsBoolean({ message: 'El valor de ic debe ser un booleano' })
  ic: boolean;

  @ApiProperty({ description: 'Indica si el producto aplica Impuesto Nacional al Consumo (INC)', required: true, example: true })
  @IsBoolean({ message: 'El valor de inc debe ser un booleano' })
  inc: boolean;

  @ApiProperty({ type: [RecetaItemDto], description: 'Receta del producto (lista de ingredientes y cantidades necesarias)', required: false })
  @IsOptional()
  @IsArray({ message: 'La receta debe ser un array de ítems de receta' })
  @ValidateNested({ each: true })
  @Type(() => RecetaItemDto)
  receta?: RecetaItemDto[];
}