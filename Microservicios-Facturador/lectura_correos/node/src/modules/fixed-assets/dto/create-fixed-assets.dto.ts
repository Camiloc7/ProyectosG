import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';

export class FixedAssetDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  barcode: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  responsible: string;

  @IsNotEmpty()
  @IsDateString()
  purchase_date: string;

  @IsNotEmpty()
  @IsNumber()
  purchase_value: number;

  @IsNotEmpty()
  @IsNumber()
  useful_life_years: number;

  @IsNotEmpty()
  @IsString()
  depreciation_method: string;

  @IsOptional()
  @IsString()
  puc_code: string;

  @IsOptional()
  @IsString()
  classification: string;

  @IsOptional()
  @IsString()
  accounting_note: string;
}

export class CreateFixedAssetDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FixedAssetDto)
  assets: FixedAssetDto[];
}
