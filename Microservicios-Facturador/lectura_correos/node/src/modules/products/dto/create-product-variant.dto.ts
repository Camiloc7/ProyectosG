import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  attribute1_name?: string;
  @IsString()
  @IsOptional()
  attribute1_value?: string;

  @IsString()
  @IsOptional()
  attribute2_name?: string;
  @IsString()
  @IsOptional()
  attribute2_value?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cost_price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sale_price?: number;

  @IsUUID()
  @IsNotEmpty()
  product_id: string; // Obligatorio, la variante debe pertenecer a un producto
}