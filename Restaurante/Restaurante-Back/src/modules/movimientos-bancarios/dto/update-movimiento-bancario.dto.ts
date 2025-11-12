import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMovimientoCuentaBancariaDto } from './create-movimiento-bancario.dto';
export class UpdateMovimientoCuentaBancariaDto extends PartialType(OmitType(CreateMovimientoCuentaBancariaDto, ['cuenta_bancaria_id'] as const)) {}