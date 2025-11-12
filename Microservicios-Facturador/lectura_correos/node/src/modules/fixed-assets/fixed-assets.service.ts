import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { FixedAsset } from './entities/fixed-asset.entity';
import { CreateFixedAssetDto } from './dto/create-fixed-assets.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';

@Injectable()
export class FixedAssetsService {
  constructor(
    @InjectRepository(FixedAsset)
    private fixedAssetRepository: Repository<FixedAsset>,
  ) {}

  /**
   * Crea múltiples activos fijos en un solo lote.
   * @param createFixedAssetDto DTO con la lista de activos a crear.
   * @param tenant_id ID del inquilino/empresa.
   * @returns La lista de activos creados.
   */
  async create(createFixedAssetDto: CreateFixedAssetDto, tenant_id: string): Promise<FixedAsset[]> {
    const assetsToCreate = createFixedAssetDto.assets.map(assetDto => ({
      ...assetDto,
      tenant_id,
    }));
    
    // Aquí puedes añadir validación de unicidad de código de barras a nivel de base de datos
    try {
      const createdAssets = this.fixedAssetRepository.create(assetsToCreate);
      return await this.fixedAssetRepository.save(createdAssets);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
        throw new BadRequestException('Uno o más códigos de barras ya existen.');
      }
      throw error;
    }
  }

  /**
   * Obtiene todos los activos fijos de un inquilino/empresa.
   * @param tenant_id ID del inquilino/empresa.
   * @returns Una promesa que resuelve con un array de activos.
   */
  async findAll(tenant_id: string): Promise<FixedAsset[]> {
    return this.fixedAssetRepository.find({ where: { tenant_id } });
  }

  /**
   * Obtiene un solo activo fijo por su ID.
   * @param id ID del activo.
   * @param tenant_id ID del inquilino/empresa.
   * @returns Una promesa que resuelve con el activo encontrado.
   */
  async findOne(id: string, tenant_id: string): Promise<FixedAsset> {
    const asset = await this.fixedAssetRepository.findOne({ where: { id, tenant_id } });
    if (!asset) {
      throw new NotFoundException(`Activo con ID ${id} no encontrado.`);
    }
    return asset;
  }

  /**
   * Actualiza un activo fijo por su ID.
   * @param id ID del activo a actualizar.
   * @param updateFixedAssetDto DTO con los datos a actualizar.
   * @param tenant_id ID del inquilino/empresa.
   * @returns El activo actualizado.
   */
  async update(id: string, updateFixedAssetDto: UpdateFixedAssetDto, tenant_id: string): Promise<FixedAsset> {
    const asset = await this.findOne(id, tenant_id);
this.fixedAssetRepository.merge(asset, updateFixedAssetDto as DeepPartial<FixedAsset>);
    return this.fixedAssetRepository.save(asset);
  }

  /**
   * Elimina un activo fijo por su ID.
   * @param id ID del activo a eliminar.
   * @param tenant_id ID del inquilino/empresa.
   */
  async remove(id: string, tenant_id: string): Promise<void> {
    const result = await this.fixedAssetRepository.delete({ id, tenant_id });
    if (result.affected === 0) {
      throw new NotFoundException(`Activo con ID ${id} no encontrado.`);
    }
  }

  /**
   * Obtiene todas las ubicaciones únicas para un inquilino.
   * @param tenant_id ID del inquilino/empresa.
   * @returns Una promesa que resuelve con un array de strings de ubicaciones únicas.
   */
  async findUniqueLocations(tenant_id: string): Promise<string[]> {
    const locations = await this.fixedAssetRepository
      .createQueryBuilder('fixed_asset')
      .select('fixed_asset.location', 'location')
      .where('fixed_asset.tenant_id = :tenantId', { tenantId: tenant_id })
      .andWhere('fixed_asset.location IS NOT NULL') // Filtra valores nulos
      .distinct(true)
      .getRawMany();
    return locations.map(loc => loc.location);
  }

  /**
   * Obtiene todos los responsables únicos para un inquilino.
   * @param tenant_id ID del inquilino/empresa.
   * @returns Una promesa que resuelve con un array de strings de responsables únicos.
   */
  async findUniqueResponsibles(tenant_id: string): Promise<string[]> {
    const responsibles = await this.fixedAssetRepository
      .createQueryBuilder('fixed_asset')
      .select('fixed_asset.responsible', 'responsible')
      .where('fixed_asset.tenant_id = :tenantId', { tenantId: tenant_id })
      .andWhere('fixed_asset.responsible IS NOT NULL') // Filtra valores nulos
      .distinct(true)
      .getRawMany();
    return responsibles.map(resp => resp.responsible);
  }
}
