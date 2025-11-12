import { PartialType, OmitType, ApiHideProperty } from '@nestjs/swagger';
import { CreateProveedorDto } from './create-proveedor.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateProveedorDto extends PartialType(OmitType(CreateProveedorDto, ['establecimiento_id'] as const)) {
  @ApiHideProperty()
  @IsOptional()
  @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
  establecimiento_id?: string;
}
