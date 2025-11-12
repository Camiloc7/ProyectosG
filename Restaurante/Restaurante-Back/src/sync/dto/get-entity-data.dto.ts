import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetEntityDataDto {
  @ApiProperty({
    description: 'Nombre de la entidad a sincronizar (ej: UsuarioEntity, ProductoEntity)',
    example: 'UsuarioEntity',
  })
  @IsString()
  @IsNotEmpty()
  entityName: string;

  @ApiProperty({
    description: 'UUID del registro de la entidad a sincronizar',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  entityUuid: string;

  @ApiProperty({
    description: 'ID del establecimiento al que pertenece la entidad',
    example: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
  })
  @IsUUID()
  @IsNotEmpty()
  establishmentId: string;
}