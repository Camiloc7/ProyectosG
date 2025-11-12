import { IsString, IsOptional, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierCategoryDto {
  @ApiProperty({ description: 'Nombre de la categoria del Proveedor', example: 'Compra EPPS' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'DEscripción de la categoria del Proveedor', example: 'Casco, guantes', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'URL para la imagen de la categoria', example: 'https://example.com/epps.png', required: false })
  @IsString()
  @IsOptional()
  @IsUrl({ require_protocol: true }) 
  imageUrl?: string; 
}