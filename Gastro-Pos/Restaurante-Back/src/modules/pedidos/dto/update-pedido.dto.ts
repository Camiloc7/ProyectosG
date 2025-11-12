import { PartialType } from '@nestjs/swagger'; 
import { IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EstadoPedido, TipoPedido } from '../entities/pedido.entity';
import { CreatePedidoDto } from './create-pedido.dto';
import { UpdatePedidoItemDto } from './update-pedido-item.dto';

export class UpdatePedidoDto extends PartialType(CreatePedidoDto) {
  @ApiProperty({
    description: 'ID de la mesa a la que se transfiere el pedido (solo para tipo MESA)',
    required: false,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la mesa debe ser un UUID válido' }) 
  mesa_id?: string;

  @ApiProperty({
    description: 'Tipo de pedido (se puede modificar después de la creación para cambiar la modalidad del pedido).', 
    enum: TipoPedido,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoPedido, { message: 'El tipo de pedido no es válido' })
  tipo_pedido?: TipoPedido;


  @ApiProperty({ description: 'Nuevo estado del pedido', enum: EstadoPedido, required: false })
  @IsOptional()
  @IsEnum(EstadoPedido, { message: 'El estado del pedido no es válido' })
  estado?: EstadoPedido;

  @ApiProperty({ description: 'ID del usuario domiciliario (UUID), solo para tipo DOMICILIO', format: 'uuid', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del domiciliario debe ser un UUID válido' })
  usuario_domiciliario_id?: string;

  @ApiProperty({ description: 'Nombre del cliente', maxLength: 255, required: false })
  @IsOptional()
  @IsString({ message: 'El nombre del cliente debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El nombre del cliente no debe exceder los 255 caracteres' })
  cliente_nombre?: string;

  @ApiProperty({ description: 'Número de teléfono del cliente', maxLength: 50, required: false })
  @IsOptional()
  @IsString({ message: 'El teléfono del cliente debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El teléfono del cliente no debe exceder los 50 caracteres' })
  @Matches(/^\+?\d{7,15}$/, { message: 'El teléfono del cliente no tiene un formato válido' })
  cliente_telefono?: string;

  @ApiProperty({ description: 'Dirección de entrega', required: false })
  @IsOptional()
  @IsString({ message: 'La dirección del cliente debe ser una cadena de texto' })
  cliente_direccion?: string;

  @ApiProperty({ description: 'Lista de ítems del pedido a actualizar (incluye adiciones, modificaciones)', type: [UpdatePedidoItemDto], required: false })
  @IsOptional()
  @IsArray({ message: 'Los ítems del pedido deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => UpdatePedidoItemDto)
  pedidoItems?: UpdatePedidoItemDto[];
}
