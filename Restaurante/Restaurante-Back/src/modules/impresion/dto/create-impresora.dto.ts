import { IsString, IsNotEmpty, IsIP, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateImpresoraDto {
  @IsString()
  @IsNotEmpty()
  nombre: string; 

  @IsString()
  @IsOptional() 
  descripcion?: string; 

  @IsString()
  @IsNotEmpty()
  tipo_impresion: string; 


  @IsString()
  @IsNotEmpty()
    tipo_conexion_tecnico: 'WINDOWS' | 'FILE' | 'USB' | 'NETWORK' | string; 


  @IsOptional() 
  establecimiento_id?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}

