import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateCausationRuleDto {
  @IsString()
  @IsNotEmpty()
  pucCode: string;

  @IsString()
  @IsNotEmpty()
  pucDescription: string;

  @IsString()
  @IsNotEmpty()
  electronicDocumentType: string;

  @IsString()
  @IsNotEmpty()
  targetTable: string;

  @IsString()
  @IsNotEmpty()
  processType: string;

  @IsString()
  @IsNotEmpty()
  accountingType: string;

  @IsString()
  @IsNotEmpty()
  firstOperandFrontendName: string;

  @IsString()
  @IsOptional()
  firstOperandDbColumn?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['+', '-', '*', '/', '%', '='])
  operation: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['invoice_field', 'fixed_value'])
  secondOperandSource: 'invoice_field' | 'fixed_value';

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