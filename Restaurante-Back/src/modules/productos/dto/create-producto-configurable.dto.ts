import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsNumber, IsPositive, IsBoolean, IsOptional, IsArray, ValidateNested, IsUUID, ArrayMinSize, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RecetaItemDto } from './create-producto.dto';


export class OpcionValorDto {
  @ApiProperty({ description: 'Nombre del valor de la opción', example: 'Tamaño PERSONAL' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Precio adicional de este valor', example: 8500 })
  @IsNumber()
  @IsOptional()
  precio?: number;
  
  @ApiProperty({ type: [RecetaItemDto], description: 'Receta para este valor de opción', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecetaItemDto)
  receta?: RecetaItemDto[];
}

export class ConfiguracionOpcionDto {
  @ApiProperty({ description: 'Nombre de la opción configurable (ej. "Tamaño", "Sabor")', example: 'Tamaño' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Indica si se pueden seleccionar múltiples valores para esta opción', example: false })
  @IsBoolean()
  es_multiple: boolean;

  @ApiProperty({ type: [OpcionValorDto], description: 'Lista de los posibles valores para esta opción' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OpcionValorDto)
  valores: OpcionValorDto[];
}

export class CreateProductoConfigurableDto {
  @ApiProperty({ description: 'URL de la imagen del producto', required: false })
  @IsString()
  @IsOptional()
  imagen_url?: string;

  @ApiProperty({ description: 'Nombre del producto configurable (ej. "Pizza")', example: 'Pizza Personalizada' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Descripción del producto configurable', required: false, example: 'Una pizza que puedes armar a tu gusto.' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'ID de la categoría a la que pertenece', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-a123-456789abcdef' })
  @IsUUID()
  @IsNotEmpty()
  categoria_id: string;

  @ApiProperty({ description: 'Precio base del producto, si aplica. Puede ser 0.', example: 0, required: false })
  @IsNumber({}, { message: 'El precio base debe ser un número.' })
  @IsOptional()
  @Min(0, { message: 'El precio base no puede ser negativo.' })
  precio_base?: number;

  @ApiProperty({ type: [ConfiguracionOpcionDto], description: 'Opciones de configuración para este producto' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfiguracionOpcionDto)
  opciones: ConfiguracionOpcionDto[];

  @ApiProperty({ description: 'Estado del producto (activo o inactivo)', example: true, required: false })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @ApiProperty({ description: 'Indica si el producto aplica IVA', required: true, example: false })
  @IsBoolean({ message: 'El valor de iva debe ser un booleano' })
  iva: boolean;

  @ApiProperty({ description: 'Indica si el producto aplica Impuesto al Consumo (IC)', required: true, example: false })
  @IsBoolean({ message: 'El valor de ic debe ser un booleano' })
  ic: boolean;

  @ApiProperty({ description: 'Indica si el producto aplica Impuesto Nacional al Consumo (INC)', required: true, example: true })
  @IsBoolean({ message: 'El valor de inc debe ser un booleano' })
  inc: boolean;
}