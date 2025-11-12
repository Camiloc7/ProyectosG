import { IsNotEmpty, IsString, MaxLength, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class CreateMedioPagoDto {
  @ApiHideProperty()
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
  @IsOptional() 
  establecimiento_id?: string;

  @ApiProperty({ description: 'Nombre del medio de pago (ej. Efectivo, Tarjeta Crédito)', maxLength: 50 })
  @IsString({ message: 'El nombre del medio de pago debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del medio de pago es obligatorio' })
  @MaxLength(50, { message: 'El nombre del medio de pago no debe exceder los 50 caracteres' })
  nombre: string;

  @ApiProperty({ description: 'Indica si el medio de pago está activo (opcional, por defecto true)', required: false })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo?: boolean;

  @ApiProperty({ description: 'Indica si el medio de pago es efectivo (opcional, por defecto false)', required: false })
  @IsOptional()
  @IsBoolean({ message: 'La propiedad "es_efectivo" debe ser un valor booleano' })
  es_efectivo?: boolean;
}