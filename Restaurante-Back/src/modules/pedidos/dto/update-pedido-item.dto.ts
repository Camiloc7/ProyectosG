import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsString,
  IsOptional,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { EstadoCocina, TipoProductoPedido } from '../entities/pedido-item.entity';

export class UpdatePedidoItemDto {
  @ApiProperty({
    description: 'ID del ítem de pedido existente (omitir para añadir un nuevo ítem)',
    required: false,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del ítem de pedido debe ser un UUID válido si se proporciona' })
  id?: string;
  
  
  @ApiProperty({
    description: 'Tipo de producto (simple o configurable)',
    enum: TipoProductoPedido,
    required: true,
  })
  @IsEnum(TipoProductoPedido, { message: 'El tipo de producto no es válido' })
  @IsNotEmpty({ message: 'El tipo de producto es obligatorio' })
  tipo_producto: TipoProductoPedido;

  @ApiProperty({
    description: 'ID del producto simple (solo para tipo_producto=SIMPLE)',
    required: false,
    format: 'uuid',
  })
  @ValidateIf(o => o.tipo_producto === TipoProductoPedido.SIMPLE)
  @IsNotEmpty({ message: 'El ID del producto simple es obligatorio para este tipo' })
  @IsUUID('4', { message: 'El ID del producto debe ser un UUID válido' })
  producto_id?: string | null;

  @ApiProperty({
    description: 'ID del producto configurable (solo para tipo_producto=CONFIGURABLE)',
    required: false,
    format: 'uuid',
  })
  @ValidateIf(o => o.tipo_producto === TipoProductoPedido.CONFIGURABLE)
  @IsNotEmpty({ message: 'El ID del producto configurable es obligatorio para este tipo' })
  @IsUUID('4', { message: 'El ID del producto configurable debe ser un UUID válido' })
  producto_configurable_id?: string | null;

  @ApiProperty({
    description: 'Configuración del producto configurable en formato JSON (solo para tipo_producto=CONFIGURABLE)',
    required: false,
  })
  @ValidateIf(o => o.tipo_producto === TipoProductoPedido.CONFIGURABLE)
  @IsNotEmpty({ message: 'La configuración es obligatoria para un producto configurable' })
  configuracion_json?: any;
  

  @ApiProperty({ description: 'Cantidad del producto en el pedido', type: Number })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  cantidad: number;

  @ApiProperty({ description: 'Notas específicas para este ítem (opcional)', required: false })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notas_item?: string;

  @ApiProperty({ description: 'Nuevo estado de preparación en cocina (opcional)', enum: EstadoCocina, required: false })
  @IsOptional()
  @IsEnum(EstadoCocina, { message: 'El estado de cocina no es válido' })
  estado_cocina?: EstadoCocina;
}

