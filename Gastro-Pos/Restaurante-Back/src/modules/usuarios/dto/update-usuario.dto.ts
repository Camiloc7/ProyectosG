import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUsuarioDto } from './create-usuario.dto';
import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUsuarioDto extends PartialType(OmitType(CreateUsuarioDto, ['password'] as const)) {
  @ApiProperty({ description: 'Nueva contraseña del usuario (opcional)', minLength: 8, required: false })
  @IsOptional()
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La nueva contraseña no puede estar vacía si se proporciona' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.',
  })
  password_nueva?: string;
}