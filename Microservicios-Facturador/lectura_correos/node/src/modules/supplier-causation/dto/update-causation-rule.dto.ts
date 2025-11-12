import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class UpdateCausationRuleDto {
  @IsString()
  @IsOptional()
  pucCode?: string;

  @IsString()
  @IsOptional()
  pucDescription?: string;

  @IsString()
  @IsOptional()
  electronicDocumentType?: string;

  @IsString()
  @IsOptional()
  targetTable?: string;

  @IsString()
  @IsOptional()
  processType?: string;

  @IsString()
  @IsOptional()
  accountingType?: string;

  @IsString()
  @IsOptional()
  firstOperandFrontendName?: string;

  @IsString()
  @IsOptional()
  firstOperandDbColumn?: string;

  @IsString()
  @IsOptional()
  @IsIn(['+', '-', '*', '/', '%', '='])
  operation?: string;

  @IsString()
  @IsOptional()
  @IsIn(['invoice_field', 'fixed_value'])
  secondOperandSource?: 'invoice_field' | 'fixed_value';

  @IsString()
  @IsOptional()
  secondOperandFrontendName?: string;

  @IsString()
  @IsOptional()
  secondOperandDbColumn?: string;

  @IsNumber()
  @IsOptional()
  secondOperandValue?: number;
}