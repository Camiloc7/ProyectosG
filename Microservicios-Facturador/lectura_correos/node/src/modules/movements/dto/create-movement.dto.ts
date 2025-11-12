import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsDateString } from 'class-validator';

export class CreateMovementDto {
  @IsString()
  @IsNotEmpty()
  movement_type: string; 

  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsOptional()
  product_variant_id?: string;

  @IsUUID()
  @IsNotEmpty() 
  from_location_id?: string;

  @IsUUID()
  @IsOptional() 
  to_location_id?: string;

  @IsUUID()
  @IsOptional()
  product_lot_id?: string; 

  @IsUUID()
  @IsOptional()
  product_serial_id?: string; 
  
  @IsNumber()
  @Min(0.0001)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  reference_document_id?: string;

  @IsString()
  @IsOptional()
  reference_document_type?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  movement_date?: Date; 

  @IsString() 
  @IsOptional()
  created_by_user_id?: string;
}