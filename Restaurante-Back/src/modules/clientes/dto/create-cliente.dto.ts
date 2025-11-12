import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidDocumentType } from 'src/common/validators/is-valid-document-type';
export class CreateClienteDto {
  @ApiProperty({ description: 'Tipo de documento del cliente (ej. "CC", "Cédula de ciudadanía")', type: 'string', required: false })
  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser una cadena de texto' })
  @IsValidDocumentType({ message: 'El tipo de documento proporcionado no es válido.' })
  tipo_documento?: string;

  @ApiProperty({ description: 'Número de documento del cliente', type: 'string', required: false })
  @IsOptional()
  @IsString({ message: 'El número de documento debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El número de documento no debe exceder los 20 caracteres' })
  numero_documento?: string;

  @ApiProperty({ description: 'Nombre completo del cliente', type: 'string', required: false })
  @IsOptional()
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre completo no debe exceder los 100 caracteres' })
  nombre_completo?: string;

  @ApiProperty({ description: 'Correo electrónico del cliente', type: 'string', format: 'email', required: false })
  @IsOptional()
  @IsString({ message: 'El correo electrónico debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El correo electrónico no debe exceder los 100 caracteres' })
  correo_electronico?: string;

  @ApiProperty({ description: 'Dirección del cliente', type: 'string', required: false })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La dirección no debe exceder los 255 caracteres' })
  direccion?: string;

  @ApiProperty({ description: 'Número de teléfono del cliente', type: 'string', required: false })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono no debe exceder los 20 caracteres' })
  telefono?: string;

  @ApiProperty({ description: 'Dígito de verificación (para NIT), si aplica', type: 'string', required: false })
  @IsOptional()
  @IsString({ message: 'El DV debe ser una cadena de texto' })
  @MaxLength(5, { message: 'El DV no debe exceder los 5 caracteres' })
  DV?: string;
}