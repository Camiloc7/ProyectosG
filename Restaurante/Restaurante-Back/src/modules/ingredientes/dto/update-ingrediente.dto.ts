import { ApiHideProperty, ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateIngredienteDto } from './create-ingrediente.dto';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateIngredienteDto extends PartialType(CreateIngredienteDto) {
  @ApiHideProperty()
  @IsOptional()
  establecimiento_id?: string;

  @ApiProperty({
    description: 'Volumen de una unidad (en mililitros), obligatorio si la unidad de medida es "unidades" y no estaba definido previamente.',
    example: 250.00,
    required: false,
  })
  @IsNumber({}, { message: 'El volumen por unidad debe ser un número' })
  @IsOptional()
  @Min(0, { message: 'El volumen por unidad no puede ser negativo' })
  volumen_por_unidad?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo_barras?: string; 
}