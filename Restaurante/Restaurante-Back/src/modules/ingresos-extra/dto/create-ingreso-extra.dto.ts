import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIngresoExtraDto {
  @ApiProperty({ description: 'Monto del ingreso extra.' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ description: 'Descripción del ingreso extra.' })
  @IsNotEmpty()
  @IsString()
  descripcion: string;

  @IsOptional()
  usuario_registro_id?: string;

  @IsOptional()
  establecimiento_id?: string;

  @IsOptional()
  cierre_caja_id?: string;
}