import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateProductSerialDto {
  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @IsUUID()
  @IsNotEmpty()
  product_id: string;
}