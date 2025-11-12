import { IsNotEmpty, IsString, MaxLength, IsIn } from 'class-validator'; 
import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../../../common/constants/app.constants'; 

export class CreateRolDto {
  @ApiProperty({
    description: 'Nombre único del rol (ej. ADMIN, MESERO)',
    maxLength: 50,
    enum: RoleName, 
  })
  @IsString({ message: 'El nombre del rol debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio.' })
  @MaxLength(50, { message: 'El nombre del rol no debe exceder los 50 caracteres.' })
  @IsIn(Object.values(RoleName), { message: 'El nombre del rol proporcionado no es válido.' }) 
  nombre: RoleName; 
}