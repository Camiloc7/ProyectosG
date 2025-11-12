import { IsNotEmpty, IsString, MaxLength, IsNumber, IsDateString, IsOptional, IsUUID, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MovimientoTipo } from 'src/common/enums/movimiento-tipo.enum';

export class CreateMovimientoCuentaBancariaDto {
  @ApiProperty({ description: 'ID de la cuenta bancaria a la que pertenece el movimiento (UUID)', format: 'uuid' })
  @IsUUID('4', { message: 'El ID de la cuenta bancaria debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la cuenta bancaria es obligatorio' })
  cuenta_bancaria_id: string;


  @ApiProperty({ description: 'Tipo de movimiento (ej. CONSIGNACION, RETIRO, GASTO_OPERATIVO)', enum: MovimientoTipo })
  @IsEnum(MovimientoTipo, { message: 'El tipo de movimiento no es válido' })
  @IsNotEmpty({ message: 'El tipo de movimiento es obligatorio' })
  tipo_movimiento: MovimientoTipo;

  @ApiProperty({ description: 'Monto del movimiento (positivo para entradas, negativo para salidas si se maneja así)', type: Number, format: 'float' })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @Min(0, { message: 'El monto no puede ser negativo' })
  monto: number;

  @ApiProperty({ description: 'Fecha y hora del movimiento (opcional, por defecto es la actual)', format: 'date-time', required: false })
  @IsOptional()
  @IsDateString(undefined, { message: 'La fecha del movimiento debe ser una cadena de fecha válida (ISO 8601)' })
  fecha_movimiento?: string;

  @ApiProperty({ description: 'Descripción detallada del movimiento (opcional)', maxLength: 255, required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La descripción no debe exceder los 255 caracteres' })
  descripcion?: string;

  @ApiProperty({ description: 'Referencia externa del movimiento (ej. ID de transacción, opcional)', maxLength: 100, required: false })
  @IsOptional()
  @IsString({ message: 'La referencia externa debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La referencia externa no debe exceder los 100 caracteres' })
  referencia_externa?: string;
}