import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsBoolean, ValidateIf, IsObject, Min, IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateFacturaAndPaymentDto {
  @ApiHideProperty()
  @IsOptional()
  @IsUUID()
  establecimiento_id?: string;

  @ApiProperty({ description: 'ID del pedido al que se aplica la factura y el pago', format: 'uuid' })
  @IsUUID()
  pedido_id: string;

  @ApiPropertyOptional({ description: 'Número de documento del cliente', nullable: true })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  numero_documento?: string | null;

  @ApiPropertyOptional({ description: 'Nombre completo del cliente', nullable: true })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  nombre_completo?: string | null;

  @ApiPropertyOptional({ description: 'Correo electrónico del cliente', nullable: true })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  correo_electronico?: string | null;

  @ApiPropertyOptional({ description: 'Tipo de documento del cliente (ej. CC, NIT)', nullable: true })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  tipo_documento?: string | null;

  @ApiPropertyOptional({ description: 'Dirección del cliente', nullable: true })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  direccion?: string | null;

  @ApiPropertyOptional({ description: 'Número de teléfono del cliente', nullable: true })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  telefono?: string | null;

  @ApiPropertyOptional({ description: 'Dígito de verificación (DV) para NIT, si aplica', nullable: true })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  DV?: string | null;

  @ApiPropertyOptional({ description: 'Porcentaje de descuento global aplicado al pedido (0-100)', minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  descuentos?: number;

  @ApiProperty({ description: 'Monto fijo de propina', minimum: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  propina: number;

  @ApiPropertyOptional({ description: 'Notas adicionales para la factura', nullable: true })
  @IsOptional()
  @IsString()
  notas?: string | null;

  @ApiProperty({ description: 'Monto total pagado en esta transacción', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  monto_pagado: number;

  @ApiProperty({ description: 'Indica si el pago es en efectivo (true) o no (false)' })
  @IsBoolean()
  es_efectivo: boolean;

  @ApiPropertyOptional({
    description: 'ID de la cuenta bancaria asociada al pago. Opcional si es_efectivo es true (se usará la caja por defecto).',
    format: 'uuid',
    nullable: true
  })
  @IsOptional() 
  @IsUUID()
  @ValidateIf(o => o.es_efectivo === false)
  @IsNotEmpty({ message: 'cuenta_id es requerido cuando es_efectivo es false' })
  cuenta_id?: string;

  @ApiPropertyOptional({
    description: 'Desglose de denominaciones de efectivo recibidas (ej. {"10000": 2, "5000": 1})',
    type: 'object',
    additionalProperties: { type: 'number' },
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @ValidateIf(o => o.es_efectivo === true)
  @IsNotEmpty({ message: 'Las denominaciones de efectivo son requeridas cuando es_efectivo es true' })
  denominaciones_efectivo?: { [key: string]: number } | null;

  @ValidateIf(o => o.es_efectivo === false)
  @IsOptional()
  @Transform(() => null)
  denominaciones_efectivo_invalid?: null;
}