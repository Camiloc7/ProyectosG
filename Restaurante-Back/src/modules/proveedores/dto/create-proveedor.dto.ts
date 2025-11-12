import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CreateProveedorDto {
  @ApiHideProperty() 
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
  @IsOptional()
  establecimiento_id?: string;

  @ApiProperty({ description: 'Número de Identificación Tributaria del proveedor (único por establecimiento)', example: '900123456-7' })
  @IsString({ message: 'El NIT debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El NIT es obligatorio' })
  @MaxLength(20, { message: 'El NIT no debe exceder los 20 caracteres' })
  nit: string;

  @ApiProperty({ description: 'Nombre del proveedor (único por establecimiento)', example: 'Distribuidora La Esquina' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no debe exceder los 100 caracteres' })
  nombre: string;

  @ApiProperty({ description: 'Nombre de la persona de contacto', example: 'Juan Pérez', required: false })
  @IsOptional()
  @IsString({ message: 'El contacto debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El contacto no debe exceder los 255 caracteres' })
  contacto?: string;

  @ApiProperty({ description: 'Número de teléfono del proveedor', example: '555-1234567', required: false })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono no debe exceder los 20 caracteres' })
  telefono?: string;

  @ApiProperty({ description: 'Correo electrónico del proveedor', example: 'contacto@distribuidora.com', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser una dirección de correo válida' })
  @MaxLength(100, { message: 'El email no debe exceder los 100 caracteres' })
  email?: string;
}
