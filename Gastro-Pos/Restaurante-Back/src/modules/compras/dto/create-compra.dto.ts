import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsNumber, IsPositive, IsDateString, IsOptional, IsString } from 'class-validator'; 

export class CreateCompraDto {
  @ApiProperty({ description: 'ID del establecimiento al que pertenece la compra (UUID)', format: 'uuid', required: false })
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
  @IsOptional() 
  establecimiento_id?: string;

  @ApiProperty({ description: 'ID del ingrediente comprado (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ingrediente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del ingrediente es obligatorio' })
  ingrediente_id: string;

  @ApiProperty({ description: 'ID del proveedor de la compra (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'El ID del proveedor debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del proveedor es obligatorio' })
  proveedor_id: string;

  @ApiProperty({ description: 'Cantidad comprada del ingrediente', example: 50.0 })
  @IsNumber({}, { message: 'La cantidad comprada debe ser un número' })
  @IsPositive({ message: 'La cantidad comprada debe ser un número positivo' })
  @IsNotEmpty({ message: 'La cantidad comprada es obligatoria' })
  cantidad_comprada: number;

  @ApiProperty({ description: 'Unidad de medida de la compra (ej. "libras", "unidades")', example: 'libras' })
  @IsString({ message: 'La unidad de medida de compra debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La unidad de medida de compra es obligatoria' })
  unidad_medida_compra: string; 

  @ApiProperty({ description: 'Costo unitario del ingrediente en esta compra específica', example: 2.50 })
  @IsNumber({}, { message: 'El costo unitario de compra debe ser un número' })
  @IsPositive({ message: 'El costo unitario de compra debe ser un número positivo' })
  @IsNotEmpty({ message: 'El costo unitario de compra es obligatorio' })
  costo_unitario_compra: number;

  @ApiProperty({ description: 'Fecha de la compra (YYYY-MM-DD)', example: '2025-06-26', required: false })
  @IsDateString({}, { message: 'La fecha de compra debe ser una cadena de fecha válida' })
  @IsOptional()
  fecha_compra?: string;

  @ApiProperty({ description: 'Número de factura de la compra (opcional)', example: 'INV-2025-001', required: false })
  @IsOptional()
  @IsString({ message: 'El número de factura debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El número de factura no puede estar vacío si se proporciona' })
  numero_factura?: string;

  @ApiProperty({ description: 'Notas adicionales sobre la compra (opcional)', example: 'Entrega rápida', required: false })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsNotEmpty({ message: 'Las notas no pueden estar vacías si se proporcionan' })
  notas?: string;
}