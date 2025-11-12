import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetCierreCajaReportDto {
  @ApiProperty({
    description: 'ID del establecimiento para filtrar cierres',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  establecimientoId?: string;

  @ApiProperty({
    description: 'ID de usuario cajero para filtrar cierres',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  usuarioCajeroId?: string;

  @ApiProperty({
    description: 'Fecha de inicio del periodo para el reporte (YYYY-MM-DD o ISO 8601)',
    example: '2023-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiProperty({
    description: 'Fecha de fin del periodo para el reporte (YYYY-MM-DD o ISO 8601)',
    example: '2023-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}