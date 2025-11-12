import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, IsIP, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { CreateImpresoraDto } from './create-impresora.dto';
export class UpdateImpresoraDto extends PartialType(CreateImpresoraDto) {

  @IsString()
  @IsOptional()
  nombre?: string; 

  @IsString()
  @IsOptional()
  descripcion?: string; 

  @IsString()
  @IsOptional()
  tipo_impresion?: string;


  @IsString()
  @IsOptional()
      tipo_conexion_tecnico?: 'FILE' | 'USB' | 'NETWORK' | string; 


  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}