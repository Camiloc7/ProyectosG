import { PartialType, OmitType, ApiHideProperty } from '@nestjs/swagger';
import { CreateEstablecimientoConfiguracionPedidoDto } from './create-configuracion-pedidos.dto';
import { IsUUID, IsOptional } from 'class-validator';

export class UpdateEstablecimientoConfiguracionPedidoDto extends PartialType(
  OmitType(CreateEstablecimientoConfiguracionPedidoDto, ['establecimiento_id'] as const),
) {
  @ApiHideProperty()
  @IsOptional()
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
  establecimiento_id?: string;
}