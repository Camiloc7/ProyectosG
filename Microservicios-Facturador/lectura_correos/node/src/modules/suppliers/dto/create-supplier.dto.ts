import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MinLength,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  nit?: string;

  @IsString()
  @IsOptional()
  verification_digit?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsBoolean()
  @IsOptional()
  notifications_enabled?: boolean;

  @IsString()
  @IsOptional()
  document_type?: string;

  @IsString()
  @IsOptional()
  contact_first_name?: string;

  @IsString()
  @IsOptional()
  contact_middle_name?: string;

  @IsString()
  @IsOptional()
  contact_last_name?: string;

  @IsString()
  @IsOptional()
  contact_second_last_name?: string;

  @IsString()
  @IsOptional()
  commercial_name?: string;

  @IsString()
  @IsOptional()
  bank_account_type?: string;

  @IsString()
  @IsOptional()
  bank_account_number?: string;

  @IsString()
  @IsOptional()
  bank_name?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string | null; 

  @IsString()
  @IsOptional()
  contact_person?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}