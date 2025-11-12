import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsOptional()
  product_variant_id?: string;

  @IsUUID()
  @IsOptional()
  product_lot_id?: string; // Si se vende por lote

  @IsUUID()
  @IsOptional()
  product_serial_id?: string; // Si se vende por serial

  @IsNumber()
  @Min(0.0001)
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  unit_price: number; // Precio unitario al momento de la venta
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  invoice_number: string;

  @IsUUID()
  @IsNotEmpty()
  customer_id: string;

  @IsDateString()
  @IsOptional()
  invoice_date?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax_amount?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  created_by_user_id?: string; // Quién crea la factura

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}