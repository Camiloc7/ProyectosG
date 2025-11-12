import { IsNotEmpty, IsString, MaxLength, IsUUID, IsOptional, IsUrl, IsBoolean } from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class CreateCategoriaDto {
  @ApiHideProperty()
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
  @IsOptional()
  establecimiento_id?: string;

  @ApiProperty({ description: 'Nombre de la categoría', maxLength: 100 })
  @IsString({ message: 'El nombre de la categoría debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  @MaxLength(100, { message: 'El nombre de la categoría no debe exceder los 100 caracteres' })
  nombre: string;

  @ApiProperty({ description: 'Descripción de la categoría (opcional)', maxLength: 500, required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(500, { message: 'La descripción no debe exceder los 500 caracteres' })
  descripcion?: string; 

  @ApiProperty({ description: 'URL de la imagen de la categoría (opcional)', maxLength: 255, required: false, example: 'https://ejemplo.com/imagenes/categoria_platillos.jpg' })
  @IsOptional()
  @IsString({ message: 'La URL de la imagen debe ser una cadena de texto' })
  @IsUrl({}, { message: 'La URL de la imagen debe ser una URL válida' }) 
  @MaxLength(255, { message: 'La URL de la imagen no debe exceder los 255 caracteres' })
  imagen_url?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsBoolean({ message: 'El campo es_bebida debe ser un valor booleano' })
  es_bebida?: boolean; 
}
