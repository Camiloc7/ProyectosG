import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, IsObject, Min, IsEmail } from 'class-validator';
import { PagoDto } from './pago.dto'; 

export class AddPaymentToInvoiceDto {
  @ApiProperty({ description: 'ID del medio de pago utilizado', format: 'uuid' })
  @IsUUID()
  medio_pago_id: string;

  @ApiProperty({ description: 'Monto pagado en esta transacción', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  monto_pagado: number;

  @ApiProperty({ description: 'Referencia de la transacción (para pagos electrónicos)', nullable: true })
  @IsOptional()
  @IsString()
  referencia_transaccion?: string | null;

  @ApiProperty({
    description: 'Desglose de billetes/monedas para pagos en efectivo (ej. {"50000": 1, "1000": 3})',
    type: 'object',
    additionalProperties: { type: 'number' },
    nullable: true
  })
  @IsOptional()
  @IsObject()
  denominaciones_efectivo?: { [key: string]: number } | null;

  @ApiProperty({ description: 'Tipo de documento del cliente', nullable: true })
  @IsOptional()
  @IsString()
  tipo_documento?: string | null;

  @ApiProperty({ description: 'Número de documento del cliente', nullable: true })
  @IsOptional()
  @IsString()
  numero_documento?: string | null;

  @ApiProperty({ description: 'Nombre completo del cliente', nullable: true })
  @IsOptional()
  @IsString()
  nombre_completo?: string | null;

  @ApiProperty({ description: 'Correo electrónico del cliente', nullable: true })
  @IsOptional()
  @IsEmail()
  correo_electronico?: string | null;
}