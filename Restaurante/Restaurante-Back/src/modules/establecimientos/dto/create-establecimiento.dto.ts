import { IsNotEmpty, IsString, MaxLength, IsOptional, IsBoolean, IsEmail, IsPostalCode, IsDateString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEstablecimientoDto {
  @ApiProperty({ description: 'Nombre del establecimiento', maxLength: 255, example: 'Restaurante POS' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255, { message: 'El nombre no debe exceder los 255 caracteres' })
  nombre: string;

  @ApiProperty({ description: 'Número de identificación tributaria (NIT) del establecimiento', maxLength: 255, required: false, example: '901243928' })
  @IsOptional()
  @IsString({ message: 'El NIT debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El NIT no debe exceder los 255 caracteres' })
  nit?: string;

  @ApiProperty({ description: 'URL del logo del establecimiento', maxLength: 255, required: false, example: 'https://res.cloudinary.com/mi-cloud/image/upload/v1677685652/logo.png' })
  @IsOptional()
  @IsUrl({}, { message: 'La URL del logo debe ser una URL válida' })
  @MaxLength(255, { message: 'La URL del logo no debe exceder los 255 caracteres' })
  logo_url?: string; 


  @ApiProperty({ description: 'Correo electrónico del establecimiento', maxLength: 255, required: false, example: 'contacto@restaurante-pos.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  @MaxLength(255, { message: 'El correo electrónico no debe exceder los 255 caracteres' })
  email?: string;

  @ApiProperty({ description: 'Dirección del establecimiento (opcional)', maxLength: 255, required: false, example: 'Calle Falsa 123' })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La dirección no debe exceder los 255 caracteres' })
  direccion?: string;

  @ApiProperty({ description: 'Código postal del establecimiento', maxLength: 20, required: false, example: '110111' })
  @IsOptional()
  @IsPostalCode('any', { message: 'El código postal no es válido' })
  @MaxLength(20, { message: 'El código postal no debe exceder los 20 caracteres' })
  codigo_postal?: string;

  @ApiProperty({ description: 'Teléfono del establecimiento (opcional)', maxLength: 50, required: false, example: '123 456 789' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El teléfono no debe exceder los 50 caracteres' })
  telefono?: string;

  @ApiProperty({ description: 'Clave API para la integración con el facturador electrónico', maxLength: 255, required: false, example: 'foptzUxfzBL5iEfNZnkGj5mv8VYZb6' })
  @IsOptional()
  @IsString({ message: 'La clave API debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La clave API no debe exceder los 255 caracteres' })
  api_key?: string;

  @ApiProperty({
    description: 'Clave de licencia única del establecimiento (opcional).',
    maxLength: 255,
    required: false,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef0123456789',
  })
  @IsOptional()
  @IsString({ message: 'La clave de licencia debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La clave de licencia no debe exceder los 255 caracteres' })
  licenciaKey?: string;

  @ApiProperty({
    description: 'Fecha de expiración de la licencia. Si no se especifica, se calcula automáticamente (ej. 1 año).',
    required: false,
    type: 'string',
    format: 'date-time',
    example: '2026-08-10T11:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  fecha_expiracion?: string;

  @ApiProperty({ description: 'Indica si el establecimiento está activo (opcional, por defecto true)', required: false })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo?: boolean;
}