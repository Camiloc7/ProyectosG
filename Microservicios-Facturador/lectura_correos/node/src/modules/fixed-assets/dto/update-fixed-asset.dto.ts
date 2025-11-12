import { PartialType } from '@nestjs/mapped-types'; 
import { CreateFixedAssetDto } from './create-fixed-assets.dto';
import { ApiProperty } from '@nestjs/swagger';


export class UpdateFixedAssetDto extends PartialType(CreateFixedAssetDto) {
}