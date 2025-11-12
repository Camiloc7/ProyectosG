import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RecetaItemDto {
  @ApiProperty({ description: 'ID del ingrediente (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'El ID del ingrediente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del ingrediente es obligatorio para la receta' })
  ingrediente_id: string;

  @ApiProperty({ description: 'Cantidad necesaria de este ingrediente para el producto', type: Number, format: 'float' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'La cantidad necesaria debe ser un número' })
  @Min(0.01, { message: 'La cantidad necesaria debe ser mayor a 0' })
  cantidad_necesaria: number;
}