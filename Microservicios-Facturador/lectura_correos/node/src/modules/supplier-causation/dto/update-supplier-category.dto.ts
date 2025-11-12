import { IsString, IsOptional, IsUrl, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCausationRuleDto } from './create-causation-rule.dto'; // Usamos CreateCausationRuleDto para las reglas en la actualización

export class UpdateSupplierCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCausationRuleDto)
  @IsOptional()
  rules?: CreateCausationRuleDto[]; 
}