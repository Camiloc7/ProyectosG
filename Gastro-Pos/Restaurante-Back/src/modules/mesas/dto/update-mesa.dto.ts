import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMesaDto } from './create-mesa.dto';

export class UpdateMesaDto extends PartialType(OmitType(CreateMesaDto, ['establecimiento_id'] as const)) {}