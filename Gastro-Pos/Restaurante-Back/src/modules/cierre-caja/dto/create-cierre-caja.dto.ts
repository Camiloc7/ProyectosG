import { IsNotEmpty, IsNumber, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DenominacionDto } from './denominacion.dto';

export class CreateCierreCajaDto {
  @ApiProperty({
    description: 'Detalle de las denominaciones de billetes y monedas en la apertura.',
    type: DenominacionDto,
    required: false,
  })
  @IsOptional()
  @Type(() => DenominacionDto)
  @ValidateNested()
  denominaciones_apertura?: DenominacionDto;

  @IsUUID('4')
  @IsOptional()
  usuarioCajeroId?: string; 

  @IsUUID('4')
  @IsOptional()
  establecimientoId?: string; 
}