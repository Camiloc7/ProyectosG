import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, Min, MaxLength, IsUUID } from 'class-validator';

export class CreateIngredienteDto {
  @ApiProperty({ description: 'ID del establecimiento al que pertenece la compra (UUID)', format: 'uuid', required: false })
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
  @IsOptional() 
  establecimiento_id?: string;


  @ApiProperty({ description: 'Nombre del ingrediente', maxLength: 100 })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no debe exceder los 100 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo_barras?: string;

  @ApiProperty({
    description: 'Unidad de medida del ingrediente (ej. kg, g, ml, unidad). Ver /ingredientes/unidades-de-medida para opciones.',
    maxLength: 20,
    example: 'gramos',
  })
  @IsString({ message: 'La unidad de medida debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La unidad de medida es obligatoria' })
  @MaxLength(20, { message: 'La unidad de medida no debe exceder los 20 caracteres' })
  unidad_medida: string;

  @ApiProperty({
    description: 'Volumen de una unidad (en mililitros), obligatorio si la unidad de medida es "unidades" (ej. 250 para una gaseosa de 250ml).',
    example: 250.00,
    required: false,
  })
  @IsNumber({}, { message: 'El volumen por unidad debe ser un número' })
  @IsOptional()
  @Min(0, { message: 'El volumen por unidad no puede ser negativo' })
  volumen_por_unidad?: number;

  @ApiProperty({ description: 'Stock actual del ingrediente', example: 100.50, required: false })
  @IsNumber({}, { message: 'El stock actual debe ser un número' })
  @IsOptional()
  @Min(0, { message: 'El stock actual no puede ser negativo' })
  stock_actual?: number;

  @ApiProperty({ description: 'Stock mínimo del ingrediente para alertas', example: 10.00, required: false })
  @IsNumber({}, { message: 'El stock mínimo debe ser un número' })
  @IsOptional()
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  stock_minimo?: number;

  @ApiProperty({ description: 'Costo unitario promedio o de última compra del ingrediente', example: 5.25 })
  @IsNumber({}, { message: 'El costo unitario debe ser un número' })
  @IsPositive({ message: 'El costo unitario debe ser un número positivo' })
  @IsNotEmpty({ message: 'El costo unitario es obligatorio' })
  costo_unitario: number;

  @ApiProperty({ description: 'Observaciones adicionales sobre el ingrediente', required: false })
  @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
  @IsOptional()
  @MaxLength(255, { message: 'Las observaciones no deben exceder los 255 caracteres' })
  observaciones?: string;
}