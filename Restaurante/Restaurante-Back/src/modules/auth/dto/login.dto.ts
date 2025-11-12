import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty({ description: 'Nombre de usuario', maxLength: 50,  example: 'superadmin'  })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @MaxLength(50, { message: 'El nombre de usuario no debe exceder los 50 caracteres' })
  username: string;
  @ApiProperty({ description: 'Contraseña del usuario', minLength: 8, example: 'S3cureP@ssw0rd!' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}

