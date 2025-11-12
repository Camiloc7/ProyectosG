import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsDateString } from 'class-validator';

export class CreateProductionOrderDto {
  @IsString()
  @IsOptional()
  order_number: string;

  @IsUUID()
  @IsNotEmpty()
  product_id: string; 

  @IsUUID()
  @IsOptional()
  bom_id?: string; 

  @IsNumber()
  @Min(0.0001)
  @IsNotEmpty()
  quantity_to_produce: number;

  @IsUUID()
  @IsOptional()
  production_location_id?: string; 

  @IsDateString()
  @IsOptional()
  start_date?: Date;

  @IsDateString()
  @IsOptional()
  end_date?: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  created_by_user_id?: string;
}