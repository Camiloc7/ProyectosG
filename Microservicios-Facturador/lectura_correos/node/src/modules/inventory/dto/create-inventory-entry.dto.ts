import { IsString, IsNumber, IsOptional, IsArray, IsDateString, ValidateNested, IsUUID, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; 

export class ProductDto {
  @ApiPropertyOptional({ description: 'SKU del producto' })
  @IsString()
  @IsOptional() 
  sku?: string;

  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Código de barras', nullable: true }) 
  @IsString()
  @IsOptional() 
  barcode?: string | null;

  @ApiProperty({ description: 'ID de la categoría' })
  @IsString()
  @IsNotEmpty()
  category_id: string;
}

export class LotDto {
  @ApiProperty({ description: 'Número de lote' })
  @IsString()
  @IsNotEmpty()
  lot_number: string;

  @ApiProperty({ description: 'Fecha de fabricación' })
  @IsDateString() 
  @IsNotEmpty()
  manufacture_date: string;

  @ApiProperty({ description: 'Fecha de expiración' })
  @IsDateString()
  @IsNotEmpty()
  expiration_date: string;

  @ApiProperty({ description: 'Cantidad inicial' })
  @IsNumber()
  @Min(0) 
  @IsNotEmpty()
  initial_quantity: number;
}

export class MovementDto {
  @ApiProperty({ description: 'Tipo de movimiento', example: 'entry' })
  @IsString()
  @IsNotEmpty()
  movement_type: string;

  @ApiProperty({ description: 'Cantidad' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ description: 'Fecha del movimiento' })
  @IsDateString()
  @IsNotEmpty()
  movement_date: string;
}

export class CreateInventoryEntryDto {
  @ApiProperty({ type: () => ProductDto, description: 'Información del producto' })
  @ValidateNested() 
  @Type(() => ProductDto) 
  product: ProductDto;

  @ApiPropertyOptional({ description: 'NIT del proveedor', nullable: true }) 
  @IsString()
  @IsOptional() 
  supplier_nit?: string | null;

  @ApiPropertyOptional({ type: () => LotDto, description: 'Información del lote', nullable: true }) 
  @ValidateNested() 
  @IsOptional() 
  @Type(() => LotDto) 
  lot?: LotDto | null;

  @ApiProperty({ description: 'ID de la ubicación' })
  @IsUUID() 
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ type: () => MovementDto, description: 'Información del movimiento' })
  @ValidateNested() 
  @Type(() => MovementDto) 
  movement: MovementDto;

  @ApiPropertyOptional({ description: 'Serie(s) del producto', isArray: true, type: String, nullable: true })
  @IsArray() 
  @IsString({ each: true }) 
  @IsOptional() 
  serials?: string[] | null;
}