import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FacturaPedidoItemDto {
  @ApiProperty({ description: 'ID del pedido al que se aplica la factura (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'El ID del pedido debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del pedido es obligatorio' })
  pedido_id: string;

  @ApiProperty({ description: 'Monto de este pedido que se aplica a la factura', type: Number, format: 'float' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'El monto aplicado debe ser un número' })
  @IsPositive({ message: 'El monto aplicado debe ser un número positivo' })
  @Min(0.01, { message: 'El monto aplicado debe ser mayor a cero' })
  monto_aplicado: number;
}