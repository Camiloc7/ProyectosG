import { IsOptional, IsString, IsDateString, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetSalesReportDto {
  @ApiHideProperty()
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
  @IsOptional()
  establecimientoId?: string;

  @ApiProperty({
    description: 'Fecha de inicio del reporte (formato YYYY-MM-DD o ISO 8601)',
    example: '2023-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD o ISO 8601)' })
  fechaInicio?: string;

  @ApiProperty({
    description: 'Fecha de fin del reporte (formato YYYY-MM-DD o ISO 8601)',
    example: '2023-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD o ISO 8601)' })
  fechaFin?: string;

  @ApiProperty({
    description: 'ID de usuario cajero para filtrar ventas por cajero (UUID)',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El ID de usuario cajero debe ser una cadena' })
  usuarioCajeroId?: string;

  @ApiProperty({
    description: 'Límite de registros a retornar para el detalle (paginación)',
    example: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'El límite debe ser un número positivo' })
  limit?: number = 50;

  @ApiProperty({
    description: 'Número de registros a saltar para la paginación',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0, { message: 'El offset no puede ser un número negativo' })
  offset?: number = 0;
}