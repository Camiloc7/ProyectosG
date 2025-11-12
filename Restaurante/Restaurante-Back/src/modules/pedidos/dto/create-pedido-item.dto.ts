  import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { EstadoCocina, TipoProductoPedido } from '../entities/pedido-item.entity';


export class OpcionSeleccionadaDto {
  @IsUUID('4', { message: 'El ID de la opción debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la opción es obligatorio' })
  opcion_id: string;

  @IsUUID('4', { message: 'El ID del valor de la opción debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del valor de la opción es obligatorio' })
  valor_id: string;
}

export class ConfiguracionProductoDto {
  [opcion_id: string]: string[];
}

export class CreatePedidoItemDto {
  @ApiProperty({
    description: 'Tipo de producto a añadir',
    enum: TipoProductoPedido,
    required: true,
  })
  @IsEnum(TipoProductoPedido, { message: 'El tipo de producto no es válido' })
  @IsNotEmpty({ message: 'El tipo de producto es obligatorio' })
  tipo_producto: TipoProductoPedido;

  @ApiProperty({
    description: 'ID del producto simple (UUID). Requerido si el tipo_producto es SIMPLE.',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del producto simple debe ser un UUID válido' })
  @ValidateIf((o) => o.tipo_producto === TipoProductoPedido.SIMPLE)
  @IsNotEmpty({ message: 'El ID del producto simple es obligatorio si el tipo es SIMPLE.' })
  producto_id?: string | null;

  @ApiProperty({
    description: 'ID del producto configurable (UUID). Requerido si el tipo_producto es CONFIGURABLE.',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del producto configurable debe ser un UUID válido' })
  @ValidateIf((o) => o.tipo_producto === TipoProductoPedido.CONFIGURABLE)
  @IsNotEmpty({ message: 'El ID del producto configurable es obligatorio si el tipo es CONFIGURABLE.' })
  producto_configurable_id?: string | null;

  @ApiProperty({
    type: ConfiguracionProductoDto, 
    description: 'Configuración de opciones para productos configurables. Requerido si el tipo_producto es CONFIGURABLE.',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.tipo_producto === TipoProductoPedido.CONFIGURABLE)
  @IsNotEmpty({ message: 'La configuración del producto es obligatoria si el tipo es CONFIGURABLE.' })
  configuracion_json?: ConfiguracionProductoDto; 

  @ApiProperty({ description: 'Cantidad del producto en el pedido', type: Number })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  cantidad: number;

  @ApiProperty({ description: 'Notas específicas para este ítem', required: false })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  notas_item?: string;

  @ApiProperty({
    description: 'Estado inicial del ítem en cocina',
    enum: EstadoCocina,
    default: EstadoCocina.PENDIENTE,
    required: false,
  })
  @IsOptional()
  @IsEnum(EstadoCocina, { message: 'El estado de cocina no es válido' })
  estado_cocina?: EstadoCocina;
}

