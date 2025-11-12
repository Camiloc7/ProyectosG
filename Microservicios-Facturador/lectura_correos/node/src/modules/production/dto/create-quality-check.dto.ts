import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateQualityCheckDto {
  @IsUUID()
  @IsOptional()
  production_order_id?: string;

  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity_inspected: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity_accepted: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantity_rejected: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['passed', 'failed', 'partial_pass'])
  result: string;

  @IsString()
  @IsOptional()
  failure_reason?: string;

  @IsUUID()
  @IsOptional()
  checked_by_user_id?: string;

  @IsDateString()
  @IsOptional()
  check_date?: Date;
}