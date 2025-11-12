import { PartialType } from '@nestjs/swagger';
import { CreateCuentaBancariaDto } from './create-cuenta-bancaria.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCuentaBancariaDto extends PartialType(CreateCuentaBancariaDto) {
  @ApiProperty({
    description: 'ID del medio de pago asociado a la cuenta bancaria (UUID)',
    format: 'uuid',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del medio de pago debe ser un UUID válido' })
  medio_pago_asociado_id?: string;
}

