import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { FixedAssetsService } from './fixed-assets.service';
import { CreateFixedAssetDto } from './dto/create-fixed-assets.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { FixedAsset } from './entities/fixed-asset.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@ApiTags('fixed-assets')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('fixed-assets')
export class FixedAssetsController {
  constructor(private readonly fixedAssetsService: FixedAssetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create one or more fixed assets' })
  @ApiResponse({ status: 201, description: 'The fixed assets have been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createFixedAssetDto: CreateFixedAssetDto, @TenantId() tenant_id: string): Promise<FixedAsset[]> {
    return this.fixedAssetsService.create(createFixedAssetDto, tenant_id);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all fixed assets for the tenant' })
  @ApiResponse({ status: 200, description: 'A list of fixed assets.' })
  async findAll(@TenantId() tenant_id: string): Promise<FixedAsset[]> {
    return this.fixedAssetsService.findAll(tenant_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a fixed asset by ID' })
  @ApiResponse({ status: 200, description: 'The fixed asset has been found.' })
  @ApiResponse({ status: 404, description: 'Fixed asset not found.' })
  async findOne(@Param('id') id: string, @TenantId() tenant_id: string): Promise<FixedAsset> {
    return this.fixedAssetsService.findOne(id, tenant_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing fixed asset' })
  @ApiResponse({ status: 200, description: 'The fixed asset has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Fixed asset not found.' })
  async update(@Param('id') id: string, @Body() updateFixedAssetDto: UpdateFixedAssetDto, @TenantId() tenant_id: string): Promise<FixedAsset> {
    return this.fixedAssetsService.update(id, updateFixedAssetDto, tenant_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a fixed asset by ID' })
  @ApiResponse({ status: 204, description: 'The fixed asset has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Fixed asset not found.' })
  async remove(@Param('id') id: string, @TenantId() tenant_id: string): Promise<void> {
    await this.fixedAssetsService.remove(id, tenant_id);
  }

  @Get('locations/unique')
  @ApiOperation({ summary: 'Retrieve unique locations for the tenant' })
  @ApiResponse({ status: 200, description: 'A list of unique locations.' })
  async findUniqueLocations(@TenantId() tenant_id: string): Promise<string[]> {
    return this.fixedAssetsService.findUniqueLocations(tenant_id);
  }

  @Get('responsibles/unique')
  @ApiOperation({ summary: 'Retrieve unique responsible parties for the tenant' })
  @ApiResponse({ status: 200, description: 'A list of unique responsible parties.' })
  async findUniqueResponsibles(@TenantId() tenant_id: string): Promise<string[]> {
    return this.fixedAssetsService.findUniqueResponsibles(tenant_id);
  }
}
