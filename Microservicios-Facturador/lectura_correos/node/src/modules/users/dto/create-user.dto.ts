// // src/modules/users/dto/create-user.dto.ts
// import { IsString, IsNotEmpty, MinLength } from 'class-validator';

// export class CreateUserDto {
//   @IsString()
//   @IsNotEmpty()
//   username: string;

//   @IsString()
//   @IsNotEmpty()
//   @MinLength(8)
//   password: string;
// }

// src/modules/users/dto/create-user.dto.ts
import { IsString, IsNotEmpty, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; 

export class CreateUserDto {
  @ApiProperty({ description: 'Nombre de usuario único', example: 'Pepito Perez' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Contraseña del usuario (mínimo 8 caracteres)', example: 'MiContrasenaSegura123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'El ID del rol al que pertenece el usuario (debe ser un UUID válido de un rol existente)',
    example: 'a1b2c3d4-e5f6-4789-abcd-1234567890ef' 
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID() 
  role_id: string; 
}