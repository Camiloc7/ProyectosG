import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ConciliateStockDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  newStock: number;
}