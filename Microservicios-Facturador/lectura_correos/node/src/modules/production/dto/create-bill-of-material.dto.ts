import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
  MaxLength 
} from 'class-validator';
import { Type } from 'class-transformer';

export class BillOfMaterialItemDto {
  @IsUUID()
  @IsNotEmpty()
  component_product_id: string;

  @IsNumber()
  @Min(0.0001)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty() 
  @MaxLength(50)
  unit: string; 
}

export class CreateBillOfMaterialDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0.0001)
  @IsNotEmpty()
  quantity_produced: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillOfMaterialItemDto)
  @IsNotEmpty({ message: 'Una lista de materiales debe tener al menos un componente.' })
  items: BillOfMaterialItemDto[];
}