import { PartialType, OmitType, ApiHideProperty } from '@nestjs/swagger';
import { CreateCategoriaDto } from './create-categoria.dto';
import { IsOptional, IsUUID } from 'class-validator';
export class UpdateCategoriaDto extends PartialType(OmitType(CreateCategoriaDto, ['establecimiento_id'] as const)) {
    @ApiHideProperty()
    @IsOptional()
    @IsUUID('4', { message: 'El ID del establecimiento debe ser un UUID válido' })
    establecimiento_id?: string;
}