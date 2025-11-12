import { IsArray, ValidateNested, IsString, IsUUID, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SyncableEntity } from '../../common/interfaces/syncable-entity.interface'; 

export class SyncChangeDto {
  @ApiProperty({ description: 'UUID del registro de la entidad afectada', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID()
  entity_uuid: string;

  @ApiProperty({ description: 'Nombre de la entidad (ej: UsuarioEntity)', example: 'UsuarioEntity' })
  @IsString()
  entity_name: string;

  @ApiProperty({ description: 'Tipo de operación (INSERT, UPDATE, DELETE)', example: 'UPDATE', enum: ['INSERT', 'UPDATE', 'DELETE'] })
  @IsEnum(['INSERT', 'UPDATE', 'DELETE'])
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE';

  @ApiProperty({ description: 'Timestamp del último cambio en la entidad (updated_at)', example: '2023-10-27T10:00:00.000Z' })
  @IsDateString()
  changed_at: Date;

  @ApiProperty({ type: Object, description: 'Datos completos de la entidad para operaciones INSERT/UPDATE', required: false })
  @IsOptional() 
  @Type(() => Object) 
  data: SyncableEntity | null; 
}

export class ReceiveChangesDto {
  @ApiProperty({ type: [SyncChangeDto], description: 'Arreglo de cambios a sincronizar desde el cliente Electron' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncChangeDto) 
  changes: SyncChangeDto[];
}