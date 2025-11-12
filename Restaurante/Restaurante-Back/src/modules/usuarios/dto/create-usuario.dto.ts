import { IsNotEmpty, IsString, MaxLength, IsBoolean, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ description: 'Nombre del establecimiento al que pertenece el usuario. Obligatorio si el rol a crear no es ADMIN para SUPER_ADMIN. Se ignorará para ADMIN.', example: 'Restaurante POS', required: false })
  @IsOptional()
  @IsString({ message: 'El nombre del establecimiento debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El nombre del establecimiento no debe exceder los 255 caracteres' })
  establecimientoName?: string;

  @ApiProperty({ description: 'Nombre del rol del usuario', example: 'CAJERO' })
  @IsString({ message: 'El nombre del rol debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  rolName: string;

  @ApiProperty({ description: 'Nombre del usuario', maxLength: 100 })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no debe exceder los 100 caracteres' })
  nombre: string;

  @ApiProperty({ description: 'Apellido del usuario', maxLength: 100 })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(100, { message: 'El apellido no debe exceder los 100 caracteres' })
  apellido: string;

  @ApiProperty({ description: 'Nombre de usuario único para el login', maxLength: 50 })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @MaxLength(50, { message: 'El nombre de usuario no debe exceder los 50 caracteres' })
  username: string;

  @ApiProperty({ description: 'Número de teléfono del usuario (opcional)', maxLength: 50, required: false })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El teléfono no debe exceder los 50 caracteres' })
  @Matches(/^[0-9\s()+-]+$/, {
    message: 'El teléfono solo puede contener números, espacios, guiones, paréntesis o el signo (+).',
  })
  telefono: string;

  @ApiProperty({ description: 'Contraseña del usuario (mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número)', minLength: 8 })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.',
  })
  password: string;

  @ApiProperty({ description: 'Indica si el usuario está activo (opcional, por defecto true)', required: false })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo?: boolean;
}