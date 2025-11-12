import { IsNotEmpty, IsNumber, IsString, IsOptional, IsPositive, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGastoDto {
  @ApiProperty({ description: 'Monto del gasto.', example: 50.75 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  monto: number;

  @ApiProperty({ description: 'Descripción detallada del gasto.', example: 'Compra de insumos de limpieza' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  descripcion: string;

  @ApiProperty({ description: 'ID del turno de caja activo al que se asocia el gasto (opcional).', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851', required: false })
  @IsOptional()
  @IsString()
  cierre_caja_id?: string;
}