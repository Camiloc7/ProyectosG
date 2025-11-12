// src/cierre-caja/dto/update-cierre-caja.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsUUID, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DenominacionDto } from './denominacion.dto'; 

export class UpdateCierreCajaDto {
  @ApiProperty({
    description: 'Detalle de las denominaciones de billetes y monedas al cerrar.',
    type: DenominacionDto,
    required: false,
  })
  @IsOptional()
  @Type(() => DenominacionDto)
  @ValidateNested()
  denominaciones_cierre?: DenominacionDto;

    @ApiProperty({
    description: 'Monto total de gastos del turno.', 
    example: 10.00,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  gastosOperacionales?: number;
  
  @ApiProperty({ description: 'Observaciones del cierre de caja.', example: 'Sin novedad.', required: false })
  @IsOptional()
  @IsString()
  observaciones?: string | null;

  @IsUUID('4')
  @IsOptional()
  usuarioCajeroId?: string;

  @IsUUID('4')
  @IsOptional()
  establecimientoId?: string;
}