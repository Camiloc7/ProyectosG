import { ApiProperty } from '@nestjs/swagger';

export class PaginacionDto<T> {
  @ApiProperty({ description: 'Total de registros disponibles' })
  total: number;

  @ApiProperty({ description: 'Límite de registros solicitados' })
  limit: number;

  @ApiProperty({ description: 'Desplazamiento aplicado' })
  offset: number;

  @ApiProperty({ description: 'Arreglo de datos del reporte para la página actual', isArray: true })
  data: T[];
}