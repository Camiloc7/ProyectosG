import { IsNotEmpty, IsString, MaxLength, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCuentaBancariaDto {
  @ApiProperty({ description: 'ID del medio de pago genérico asociado (ej. UUID de "Transferencia Bancaria")', format: 'uuid', required: false, nullable: true })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del medio de pago asociado debe ser un UUID válido si se proporciona' })
  medio_pago_asociado_id?: string;

  @ApiProperty({ description: 'Nombre del banco (ej. Banco Nacional)', maxLength: 100 })
  @IsString({ message: 'El nombre del banco debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del banco es obligatorio' })
  @MaxLength(100, { message: 'El nombre del banco no debe exceder los 100 caracteres' })
  nombre_banco: string;

  @ApiProperty({ description: 'Tipo de cuenta (ej. Ahorros, Corriente)', maxLength: 50 })
  @IsString({ message: 'El tipo de cuenta debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tipo de cuenta es obligatorio' })
  @MaxLength(50, { message: 'El tipo de cuenta no debe exceder los 50 caracteres' })
  tipo_cuenta: string;

  @ApiProperty({ description: 'Número de cuenta bancaria', maxLength: 50 })
  @IsString({ message: 'El número de cuenta debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El número de cuenta es obligatorio' })
  @MaxLength(50, { message: 'El número de cuenta no debe exceder los 50 caracteres' })
  numero_cuenta: string;

  @ApiProperty({ description: 'Indica si la cuenta bancaria está activa (opcional, por defecto true)', required: false })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activa?: boolean;
}