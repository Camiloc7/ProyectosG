import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'; 
import { Supplier } from './entities/supplier.entity';
import { SupplierCategory } from './entities/supplier-category.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { UpdateSupplierCategoryDto } from './dto/update-supplier-category.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,

    @InjectRepository(SupplierCategory)
    private readonly categoryRepository: Repository<SupplierCategory>,
  ) {}
  async create(createSupplierDto: CreateSupplierDto, tenantId: string): Promise<Supplier> {
    let category: SupplierCategory | null = null;
  
    if (createSupplierDto.category_id) {
      category = await this.categoryRepository.findOne({
        where: { id: createSupplierDto.category_id, tenant_id: tenantId }, 
      });
  
      if (!category) {
        console.warn(`Category with ID "${createSupplierDto.category_id}" not found for tenant "${tenantId}". Falling back to default.`);
      }
    }
  
    if (!category) {
      category = await this.categoryRepository.findOne({
        where: { name: 'Por Revisar', tenant_id: tenantId }, 
      });
      if (!category) {
        category = this.categoryRepository.create({
          name: 'Por Revisar',
          description: 'Categoría asignada a proveedores que necesitan revisión o categorización futura.',
          tenant_id: tenantId, 
        });
        category = await this.categoryRepository.save(category); 
      }
    }
    const newSupplier = this.supplierRepository.create({
      ...createSupplierDto,
      category,
      category_id: category.id,
      tenant_id: tenantId, 
    });
  
    try {
      return await this.supplierRepository.save(newSupplier);
    } catch (error: any) { 
      if (error.code === 'ER_DUP_ENTRY') {
        let errorMessage = 'Supplier with this information already exists.';
        if (error.sqlMessage?.includes('nit')) {
          errorMessage = 'Supplier with this NIT already exists.';
        } else if (error.sqlMessage?.includes('name')) {
          errorMessage = 'Supplier with this name already exists.';
        } else if (error.sqlMessage?.includes('email')) {
          errorMessage = 'Supplier with this email already exists.';
        }
        throw new BadRequestException(errorMessage);
      }
      throw error;
    }
  }

  async findAll(tenantId: string): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: { tenant_id: tenantId }, 
      relations: ['category'], 
    });
  }
  
  async findOne(id: string, tenantId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['category'],
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found or does not belong to your tenant.`);
    }
    return supplier;
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
    tenantId: string, 
  ): Promise<Supplier> {
    const supplier = await this.findOne(id, tenantId);

    if (updateSupplierDto.category_id !== undefined) {
      if (updateSupplierDto.category_id === null) {
        supplier.category = null;
        supplier.category_id = null;
      } else {
        const foundCategory = await this.categoryRepository.findOne({
          where: { id: updateSupplierDto.category_id, tenant_id: tenantId }, 
        });
        if (!foundCategory) {
          throw new NotFoundException(
            `Category with ID "${updateSupplierDto.category_id}" not found or does not belong to your tenant.`,
          );
        }
        supplier.category = foundCategory;
        supplier.category_id = foundCategory.id;
      }
    }

    this.supplierRepository.merge(supplier, updateSupplierDto);

    try {
      return await this.supplierRepository.save(supplier);
    } catch (error: any) { 
      if (error.code === 'ER_DUP_ENTRY') {
        let errorMessage = 'Supplier with this information already exists.';
        if (error.sqlMessage && error.sqlMessage.includes('nit')) {
          errorMessage = 'Supplier with this NIT already exists.';
        } else if (error.sqlMessage && error.sqlMessage.includes('name')) {
          errorMessage = 'Supplier with this name already exists.';
        } else if (error.sqlMessage && error.sqlMessage.includes('email')) {
          errorMessage = 'Supplier with this email already exists.';
        }
        throw new BadRequestException(errorMessage);
      }
      throw error;
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.supplierRepository.delete({ id, tenant_id: tenantId }); 
    if (result.affected === 0) {
      throw new NotFoundException(`Supplier with ID "${id}" not found or does not belong to your tenant.`);
    }
  }

  async findByNit(nit: string, tenantId: string): Promise<Supplier | null> {
    return this.supplierRepository.findOne({
      where: { nit, tenant_id: tenantId }, 
      relations: ['category'],
    });
  }


  async createCategory(dto: CreateSupplierCategoryDto, tenantId: string): Promise<SupplierCategory> {
    const existing = await this.categoryRepository.findOne({ where: { name: dto.name, tenant_id: tenantId } }); 
    if (existing) {
      throw new BadRequestException(`Ya existe una categoría con el nombre "${dto.name}" para este inquilino.`);
    }
    const category = this.categoryRepository.create({ ...dto, tenant_id: tenantId }); 
    return this.categoryRepository.save(category);
  }
  async findAllCategories(tenantId: string): Promise<SupplierCategory[]> {
    return this.categoryRepository.find({
      where: { tenant_id: tenantId }, 
      relations: ['suppliers'],
    });
  }

  async findCategoryById(id: string, tenantId: string): Promise<SupplierCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id, tenant_id: tenantId }, 
      relations: ['suppliers'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found or does not belong to your tenant.`);
    }
    return category;
  }

  async updateCategory(
    id: string,
    dto: UpdateSupplierCategoryDto,
    tenantId: string, 
  ): Promise<SupplierCategory> {
    const category = await this.findCategoryById(id, tenantId);
    this.categoryRepository.merge(category, dto);
    return this.categoryRepository.save(category);
  }

  async removeCategory(id: string, tenantId: string): Promise<void> {
    const result = await this.categoryRepository.delete({ id, tenant_id: tenantId }); 
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID "${id}" not found or does not belong to your tenant.`);
    }
  }
}