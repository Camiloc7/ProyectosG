import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateProductLotDto {
  @IsString()
  @IsNotEmpty()
  lot_number: string;

  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsOptional()
  supplier_id?: string;

  @IsDateString()
  @IsOptional()
  manufacture_date?: Date;

  @IsDateString()
  @IsOptional()
  expiration_date?: Date;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  initial_quantity: number; 
}