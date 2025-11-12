import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceDto } from './create-invoice.dto';
import { IsString, IsOptional, IsNumber, Min, IsIn } from 'class-validator';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @IsNumber()
  @Min(0)
  @IsOptional()
  total_amount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sub_total?: number;

  @IsString()
  @IsOptional()
  @IsIn(['pending', 'paid', 'canceled', 'refunded'])
  status?: string;
}        