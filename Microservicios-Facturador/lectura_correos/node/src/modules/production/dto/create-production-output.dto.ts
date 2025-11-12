import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsDateString } from 'class-validator';

export class CreateProductionOutputDto {
  @IsUUID()
  @IsNotEmpty()
  production_order_id: string;

  @IsUUID()
  @IsNotEmpty()
  produced_product_id: string;

  @IsUUID()
  @IsOptional()
  product_lot_id?: string;

  @IsUUID()
  @IsOptional()
  product_serial_id?: string;

  @IsNumber()
  @Min(0.0001)
  @IsNotEmpty()
  quantity_produced: number;

  @IsUUID()
  @IsNotEmpty()
  to_location_id: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  output_date?: Date;
}