// src/modules/supplier-causation/supplier-causation.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierCategory } from './entities/supplier-category.entity';
import { CausationRule } from './entities/causation-rule.entity';
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { UpdateSupplierCategoryDto } from './dto/update-supplier-category.dto';
import { CreateCausationRuleDto } from './dto/create-causation-rule.dto';
import { UpdateCausationRuleDto } from './dto/update-causation-rule.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SupplierCausationService {
  constructor(
    @InjectRepository(SupplierCategory)
    private supplierCategoriesRepository: Repository<SupplierCategory>,
    @InjectRepository(CausationRule)
    private causationRulesRepository: Repository<CausationRule>,
  ) {}

  async createSupplierCategory(createCategoryDto: CreateSupplierCategoryDto, tenantId: string): Promise<SupplierCategory> { // <-- Recibir tenantId
    const { name, description, imageUrl, rules } = createCategoryDto;

    // Asegurar unicidad por inquilino si es necesario, o solo por nombre si es global
    const existingCategory = await this.supplierCategoriesRepository.findOne({ where: { name, tenant_id: tenantId } }); // <-- Filtrar por tenantId
    if (existingCategory) {
      throw new ConflictException('A category with this name already exists for this tenant.');
    }

    const newCategoryId = uuidv4();

    const newCategory = this.supplierCategoriesRepository.create({
      id: newCategoryId,
      name,
      description,
      imageUrl,
      tenant_id: tenantId, // <-- Asignar tenantId
    });

    await this.supplierCategoriesRepository.save(newCategory);

    const causationRules = rules.map(ruleDto => {
      const rule = this.causationRulesRepository.create({
        ...ruleDto,
        supplierCategoryId: newCategory.id,
        tenant_id: tenantId, // <-- Asignar tenantId a la regla
      });
      return rule;
    });

    await this.causationRulesRepository.save(causationRules);

    const createdCategory = await this.supplierCategoriesRepository.findOne({
      where: { id: newCategory.id, tenant_id: tenantId }, // <-- Filtrar por tenantId
      relations: ['causationRules'],
    });

    if (!createdCategory) {
      throw new NotFoundException('Failed to retrieve the newly created supplier category.');
    }

    return createdCategory;
  }

  async findAllSupplierCategories(tenantId: string): Promise<SupplierCategory[]> { // <-- Recibir tenantId
    return this.supplierCategoriesRepository.find({ 
      where: { tenant_id: tenantId }, // <-- Filtrar por tenantId
      relations: ['causationRules'] 
    });
  }

  async findOneSupplierCategoryById(id: string, tenantId: string): Promise<SupplierCategory> { // <-- Recibir tenantId
    const category = await this.supplierCategoriesRepository.findOne({
      where: { id, tenant_id: tenantId }, // <-- Filtrar por tenantId
      relations: ['causationRules'],
    });

    if (!category) {
      throw new NotFoundException(`Supplier category with ID "${id}" not found or does not belong to your tenant.`);
    }
    return category;
  }

  async updateSupplierCategory(id: string, updateCategoryDto: UpdateSupplierCategoryDto, tenantId: string): Promise<SupplierCategory> { // <-- Recibir tenantId
    const existingCategory = await this.supplierCategoriesRepository.findOne({ where: { id, tenant_id: tenantId } }); // <-- Filtrar por tenantId
    if (!existingCategory) {
      throw new NotFoundException(`Supplier category with ID "${id}" not found or does not belong to your tenant.`);
    }

    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      const categoryWithSameName = await this.supplierCategoriesRepository.findOne({ 
        where: { name: updateCategoryDto.name, tenant_id: tenantId } // <-- Filtrar por tenantId
      });
      if (categoryWithSameName && categoryWithSameName.id !== id) { // Asegurar que no sea la misma categoría
        throw new ConflictException('A category with this name already exists for this tenant.');
      }
    }

    this.supplierCategoriesRepository.merge(existingCategory, {
      name: updateCategoryDto.name,
      description: updateCategoryDto.description,
      imageUrl: updateCategoryDto.imageUrl,
    });

    const updatedCategory = await this.supplierCategoriesRepository.save(existingCategory);

    if (updateCategoryDto.rules) {
      // Eliminar reglas existentes para este inquilino y esta categoría
      await this.causationRulesRepository.delete({ supplierCategoryId: id, tenant_id: tenantId }); // <-- Filtrar por tenantId
      const newCausationRules = updateCategoryDto.rules.map(ruleDto => {
        return this.causationRulesRepository.create({
          ...ruleDto,
          supplierCategoryId: updatedCategory.id,
          tenant_id: tenantId, // <-- Asignar tenantId a la nueva regla
        });
      });
      await this.causationRulesRepository.save(newCausationRules);
    }

    const finalCategory = await this.supplierCategoriesRepository.findOne({
      where: { id: updatedCategory.id, tenant_id: tenantId }, // <-- Filtrar por tenantId
      relations: ['causationRules'],
    });

    if (!finalCategory) {
      throw new NotFoundException('Failed to retrieve the updated supplier category.');
    }

    return finalCategory;
  }

  async deleteSupplierCategory(id: string, tenantId: string): Promise<void> { // <-- Recibir tenantId
    const result = await this.supplierCategoriesRepository.delete({ id, tenant_id: tenantId }); // <-- Filtrar por tenantId
    if (result.affected === 0) {
      throw new NotFoundException(`Supplier category with ID "${id}" not found or does not belong to your tenant.`);
    }
  }

  async createCausationRule(supplierCategoryId: string, createRuleDto: CreateCausationRuleDto, tenantId: string): Promise<CausationRule> { // <-- Recibir tenantId
    // Asegurar que la categoría existe y pertenece al inquilino
    const category = await this.supplierCategoriesRepository.findOne({ where: { id: supplierCategoryId, tenant_id: tenantId } }); // <-- Filtrar por tenantId
    if (!category) {
      throw new NotFoundException(`Supplier category with ID "${supplierCategoryId}" not found or does not belong to your tenant.`);
    }
    const newRule = this.causationRulesRepository.create({
      ...createRuleDto,
      supplierCategoryId: supplierCategoryId,
      tenant_id: tenantId, // <-- Asignar tenantId a la regla
    });
    return this.causationRulesRepository.save(newRule);
  }

  async findRuleById(id: string, tenantId: string): Promise<CausationRule> { // <-- Recibir tenantId
    const rule = await this.causationRulesRepository.findOne({ where: { id, tenant_id: tenantId } }); // <-- Filtrar por tenantId
    if (!rule) {
      throw new NotFoundException(`Causation rule with ID "${id}" not found or does not belong to your tenant.`);
    }
    return rule;
  }

  async updateCausationRule(id: string, updateRuleDto: UpdateCausationRuleDto, tenantId: string): Promise<CausationRule> { // <-- Recibir tenantId
    const existingRule = await this.causationRulesRepository.findOne({ where: { id, tenant_id: tenantId } }); // <-- Filtrar por tenantId
    if (!existingRule) {
      throw new NotFoundException(`Causation rule with ID "${id}" not found or does not belong to your tenant.`);
    }
    this.causationRulesRepository.merge(existingRule, updateRuleDto);
    return this.causationRulesRepository.save(existingRule);
  }

  async deleteCausationRule(id: string, tenantId: string): Promise<void> { // <-- Recibir tenantId
    const result = await this.causationRulesRepository.delete({ id, tenant_id: tenantId }); // <-- Filtrar por tenantId
    if (result.affected === 0) {
      throw new NotFoundException(`Causation rule with ID "${id}" not found or does not belong to your tenant.`);
    }
  }
}