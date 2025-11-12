import { IsString, IsNotEmpty, IsUrl, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCausationRuleDto } from './create-causation-rule.dto';

export class CreateSupplierCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCausationRuleDto)
  rules: CreateCausationRuleDto[];
}