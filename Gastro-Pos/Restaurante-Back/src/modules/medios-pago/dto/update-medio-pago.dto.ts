import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMedioPagoDto } from './create-medio-pago.dto';
export class UpdateMedioPagoDto extends PartialType(OmitType(CreateMedioPagoDto, ['establecimiento_id'] as const)) {}