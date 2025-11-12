import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsDateString } from 'class-validator';

export class CreateProductionInputDto {
  @IsUUID()
  @IsNotEmpty()
  production_order_id: string;

  @IsUUID()
  @IsNotEmpty()
  material_product_id: string;

  @IsUUID()
  @IsOptional()
  product_lot_id?: string;

  @IsUUID()
  @IsOptional()
  product_serial_id?: string;

  @IsUUID()
  @IsNotEmpty()
  from_location_id: string;

  @IsNumber()
  @Min(0.0001)
  @IsNotEmpty()
  quantity_consumed: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  consumption_date?: Date;
}