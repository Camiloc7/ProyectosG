import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedAssetsService } from './fixed-assets.service';
import { FixedAssetsController } from './fixed-assets.controller';
import { FixedAsset } from './entities/fixed-asset.entity';
import { CreateFixedAssetDto } from './dto/create-fixed-assets.dto';

@Module({
  imports: [TypeOrmModule.forFeature([FixedAsset])],
  controllers: [FixedAssetsController],
  providers: [FixedAssetsService, CreateFixedAssetDto],
})
export class FixedAssetsModule {}
