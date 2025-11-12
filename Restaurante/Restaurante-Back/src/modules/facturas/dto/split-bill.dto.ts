import { IsNotEmpty, IsUUID, IsNumber, Min, IsArray, ArrayNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PagoDto } from './pago.dto';

export class SplitBillDto {
  @ApiProperty({ description: 'ID del pedido a dividir (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'El ID del pedido debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del pedido es obligatorio' })
  pedido_id: string;

  @ApiProperty({ type: [PagoDto], description: 'Lista de pagos a dividir. La suma de los montos debe ser igual al total del pedido.' })
  @IsArray({ message: 'Las divisiones de cuenta deben ser un array' })
  @ArrayNotEmpty({ message: 'Debe especificar al menos una división de cuenta' })
  @ValidateNested({ each: true })
  @Type(() => PagoDto)
  pagos: PagoDto[];

  @ApiProperty({ description: 'Monto de propina total para el pedido (opcional, por defecto 0.00)', type: Number, format: 'float', required: false })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'La propina debe ser un número' })
  @Min(0, { message: 'La propina no puede ser negativa' })
  propina_total?: number;
}
