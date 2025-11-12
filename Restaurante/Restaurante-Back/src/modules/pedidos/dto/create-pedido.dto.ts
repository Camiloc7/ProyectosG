import { IsNotEmpty, IsUUID, IsOptional, IsString, IsEnum, ValidateNested, ArrayNotEmpty, ArrayMinSize, MaxLength, Matches, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreatePedidoItemDto } from './create-pedido-item.dto';
import { TipoPedido } from '../entities/pedido.entity';

export class CreatePedidoDto {
  @ApiProperty({ description: 'ID de la mesa (UUID), requerido si tipo_pedido es MESA', format: 'uuid', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la mesa debe ser un UUID válido' })
  @ValidateIf(o => o.tipo_pedido === TipoPedido.MESA)
  @IsNotEmpty({ message: 'Para pedidos de mesa, el ID de la mesa es obligatorio.' })
  mesa_id?: string;

  @ApiProperty({ description: 'Tipo de pedido', enum: TipoPedido, default: TipoPedido.MESA })
  @IsEnum(TipoPedido, { message: 'El tipo de pedido no es válido' })
  @IsNotEmpty({ message: 'El tipo de pedido es obligatorio' })
  tipo_pedido: TipoPedido;

  @ApiProperty({ description: 'Nombre del cliente (obligatorio solo para DOMICILIO)', maxLength: 255, required: false })
  @IsOptional()
  @IsString({ message: 'El nombre del cliente debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El nombre del cliente no debe exceder los 255 caracteres' })
  @ValidateIf(o => o.tipo_pedido === TipoPedido.DOMICILIO) 
  @IsNotEmpty({ message: 'Para pedidos a domicilio, el nombre del cliente es obligatorio.' })
  cliente_nombre?: string;

  @ApiProperty({ description: 'Número de teléfono del cliente (obligatorio solo para DOMICILIO)', maxLength: 50, required: false })
  @IsOptional()
  @IsString({ message: 'El teléfono del cliente debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El teléfono del cliente no debe exceder los 50 caracteres' })
  @Matches(/^\+?\d{7,15}$/, { message: 'El teléfono del cliente no tiene un formato válido' })
  @ValidateIf(o => o.tipo_pedido === TipoPedido.DOMICILIO) 
  @IsNotEmpty({ message: 'Para pedidos a domicilio, el teléfono del cliente es obligatorio.' })
  cliente_telefono?: string;

  @ApiProperty({ description: 'Dirección de entrega (solo para DOMICILIO)', required: false })
  @IsOptional()
  @IsString({ message: 'La dirección del cliente debe ser una cadena de texto' })
  @ValidateIf(o => o.tipo_pedido === TipoPedido.DOMICILIO)
  @IsNotEmpty({ message: 'Para pedidos a domicilio, la dirección del cliente es obligatoria.' })
  cliente_direccion?: string;

  @ApiProperty({ description: 'Notas generales del pedido (opcional)', required: false })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notas?: string;

  @ApiProperty({ type: [CreatePedidoItemDto], description: 'Lista de ítems del pedido' })
  @ArrayNotEmpty({ message: 'El pedido debe contener al menos un ítem' })
  @ArrayMinSize(1, { message: 'El pedido debe contener al menos un ítem' })
  @ValidateNested({ each: true })
  @Type(() => CreatePedidoItemDto)
  pedidoItems: CreatePedidoItemDto[];
}