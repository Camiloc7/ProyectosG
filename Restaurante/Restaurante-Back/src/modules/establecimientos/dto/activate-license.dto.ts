import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateLicenseDto {
  @ApiProperty({
    description: 'La clave de licencia única del establecimiento.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef0123456789',
  })
  @IsString()
  @IsNotEmpty()
  licenciaKey: string;

  @ApiProperty({
    description: 'El ID único del dispositivo que se está activando.',
    example: '98765432-10ab-cdef-5432-109876543210',
  })
  @IsUUID()
  @IsNotEmpty()
  dispositivoId: string;
}