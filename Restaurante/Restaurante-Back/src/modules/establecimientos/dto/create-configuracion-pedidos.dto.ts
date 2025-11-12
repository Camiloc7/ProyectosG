import { IsUUID, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class CreateEstablecimientoConfiguracionPedidoDto {
  @ApiHideProperty() 
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido.' })
  @IsOptional() 
  establecimiento_id?: string; 

  @ApiProperty({
    description: 'Minutos límite para cancelar un pedido en estado EN_PREPARACION',
    default: 10,
    minimum: 0,
    type: Number,
  })
  @IsNumber({}, { message: 'El límite de cancelación en preparación debe ser un número.' })
  @Min(0, { message: 'El límite de cancelación en preparación no puede ser negativo.' })
  @IsOptional() 
  limite_cancelacion_preparacion_minutos?: number;

  @ApiProperty({
    description: 'Minutos límite para cancelar un pedido en estado ENVIADO_A_COCINA',
    default: 5,
    minimum: 0,
    type: Number,
  })
  @IsNumber({}, { message: 'El límite de cancelación enviado a cocina debe ser un número.' })
  @Min(0, { message: 'El límite de cancelación enviado a cocina no puede ser negativo.' })
  @IsOptional()
  limite_cancelacion_enviado_cocina_minutos?: number;

  @ApiProperty({
    description: 'Minutos límite para editar cualquier aspecto de un pedido (fuera de estado ABIERTO)',
    default: 15,
    minimum: 0,
    type: Number,
  })
  @IsNumber({}, { message: 'El límite de edición de pedido debe ser un número.' })
  @Min(0, { message: 'El límite de edición de pedido no puede ser negativo.' })
  @IsOptional()
  limite_edicion_pedido_minutos?: number;
}