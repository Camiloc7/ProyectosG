import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferTableDto {
  @ApiProperty({ description: 'ID de la nueva mesa a la que se transferirá el pedido (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'El ID de la nueva mesa debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la nueva mesa es obligatorio' })
  new_mesa_id: string;
}