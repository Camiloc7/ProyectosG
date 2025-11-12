import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, IsEnum, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoFactura } from '../entities/factura.entity';
import { PagoDto } from './pago.dto';

export class FacturaPedidoDto {
  @ApiProperty({ description: 'ID del pedido asociado a esta factura', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID()
  pedido_id: string;

  @ApiProperty({ description: 'Monto del pedido aplicado a esta factura', example: 14500.00 })
  @IsNumber()
  @Min(0.01, { message: 'El monto aplicado debe ser un valor positivo.' })
  monto_aplicado: number;
}

export class CreateFacturaDto {
  @ApiHideProperty()
  @IsOptional() 
  @IsUUID()
  establecimiento_id?: string;



  @ApiProperty({ description: 'Subtotal de la factura antes de impuestos, descuentos y propina', example: 14500.00 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ description: 'Monto total de impuestos aplicados', example: 2755.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  impuestos?: number;

  @ApiPropertyOptional({ description: 'Monto total de descuentos aplicados', example: 0.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentos?: number;

  @ApiPropertyOptional({ description: 'Monto de propina', example: 1450.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  propina?: number;

  @ApiProperty({ description: 'Total final de la factura (subtotal + impuestos - descuentos + propina)', example: 18705.00 })
  @IsNumber()
  @Min(0.01)
  total_factura: number;

  @ApiProperty({ description: 'Tipo de factura', enum: TipoFactura, example: TipoFactura.TOTAL })
  @IsEnum(TipoFactura)
  tipo_factura: TipoFactura;

  @ApiPropertyOptional({ description: 'Notas adicionales sobre la factura', example: 'Cliente solicitó factura simplificada' })
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiProperty({ type: [FacturaPedidoDto], description: 'Lista de pedidos asociados a esta factura' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacturaPedidoDto)
  facturaPedidos: FacturaPedidoDto[];

  @ApiProperty({ type: [PagoDto], description: 'Lista de pagos recibidos para esta factura' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PagoDto)
  pagos: PagoDto[];
}