import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DenominacionDto {
  @ApiProperty({ description: 'Cantidad de billetes de 100.000.', example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '100000'?: number;

  @ApiProperty({ description: 'Cantidad de billetes de 50.000.', example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '50000'?: number;

  @ApiProperty({ description: 'Cantidad de billetes de 20.000.', example: 15, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '20000'?: number;

  @ApiProperty({ description: 'Cantidad de billetes de 10.000.', example: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '10000'?: number;

  @ApiProperty({ description: 'Cantidad de billetes de 5.000.', example: 30, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '5000'?: number;

  @ApiProperty({ description: 'Cantidad de billetes de 2.000.', example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '2000'?: number;

  @ApiProperty({ description: 'Cantidad de monedas de 1.000.', example: 60, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '1000'?: number;

  @ApiProperty({ description: 'Cantidad de monedas de 500.', example: 70, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '500'?: number;

  @ApiProperty({ description: 'Cantidad de monedas de 200.', example: 80, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '200'?: number;

  @ApiProperty({ description: 'Cantidad de monedas de 100.', example: 90, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '100'?: number;

  @ApiProperty({ description: 'Cantidad de monedas de 50.', example: 120, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  '50'?: number;
}