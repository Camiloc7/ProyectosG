import { IsNotEmpty, IsString, MaxLength, IsUUID, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoMesa } from '../entities/mesa.entity';

export class CreateMesaDto {
  @ApiProperty({ description: 'ID del establecimiento al que pertenece la mesa (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del establecimiento es obligatorio' })
  establecimiento_id: string;

  @ApiProperty({ description: 'Número o identificador único de la mesa', maxLength: 50 })
  @IsString({ message: 'El número de mesa debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El número de mesa es obligatorio' })
  @MaxLength(50, { message: 'El número de mesa no debe exceder los 50 caracteres' })
  numero: string;

  @ApiProperty({ description: 'Capacidad de personas de la mesa (opcional)', type: Number, required: false })
  @IsOptional()
  @IsInt({ message: 'La capacidad debe ser un número entero' })
  @Min(1, { message: 'La capacidad mínima de una mesa es 1' })
  capacidad?: number;

  @ApiProperty({ description: 'Estado inicial de la mesa (opcional, por defecto LIBRE)', enum: EstadoMesa, required: false })
  @IsOptional()
  @IsEnum(EstadoMesa, { message: 'El estado de la mesa debe ser LIBRE u OCUPADA' })
  estado?: EstadoMesa; 
  
  @ApiProperty({ description: 'Descripción de la ubicación de la mesa (opcional)', maxLength: 255, required: false })
  @IsOptional()
  @IsString({ message: 'La descripción de la ubicación debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La descripción de la ubicación no debe exceder los 255 caracteres' })
  ubicacion_descripcion?: string;
}