import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
  ) {}
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const { category_id, ...productData } = createProductDto;

    if (category_id) {
      const category = await this.categoryRepository.findOne({ where: { id: category_id } });
      if (!category) {
        throw new NotFoundException(`Category with ID "${category_id}" not found`);
      }
      productData['category'] = category;
    }
    const newProduct = this.productRepository.create(productData);
    try {
      return await this.productRepository.save(newProduct);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') { 
        throw new BadRequestException('Product SKU or Barcode already exists.');
      }
      throw error;
    }
  }
  async findAllProducts(): Promise<Product[]> {
    return this.productRepository.find({ relations: ['category', 'variants'] });
  }
  async findProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id }, relations: ['category', 'variants'] });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }
  // async findProductBySku(sku: string): Promise<Product> {
  //   const product = await this.productRepository.findOne({ where: { sku }, relations: ['category', 'variants'] });
  //   if (!product) {
  //     throw new NotFoundException(`Product with SKU "${sku}" not found`);
  //   }
  //   return product;
  // }

  async findProductBySku(sku?: string): Promise<Product | null> {
    if (!sku) {
      return null;
    }
    const product = await this.productRepository.findOne({ where: { sku }, relations: ['category', 'variants'] });
    if (!product) {
      throw new NotFoundException(`Product with SKU "${sku}" not found`);
    }
    return product;
  }

  async findProductByBarcode(barcode: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { barcode }, relations: ['category', 'variants'] });
    if (!product) {
      throw new NotFoundException(`Product with Barcode "${barcode}" not found`);
    }
    return product;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findProductById(id); 
    const { category_id, ...productData } = updateProductDto;

    if (category_id !== undefined) { 
      const category = await this.categoryRepository.findOne({ where: { id: category_id } });
      if (!category) {
        throw new NotFoundException(`Category with ID "${category_id}" not found`);
      }
      product.category = category;
    }
    this.productRepository.merge(product, productData);
    try {
      return await this.productRepository.save(product);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Product SKU or Barcode already exists.');
      }
      throw error;
    }
  }
  async deleteProduct(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
  }
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const newCategory = this.categoryRepository.create(createCategoryDto);
    try {
      return await this.categoryRepository.save(newCategory);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Category name already exists.');
      }
      throw error;
    }
  }
  async findAllCategories(): Promise<Category[]> {
    return this.categoryRepository.find();
  }
  async findCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }
  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findCategoryById(id);
    this.categoryRepository.merge(category, updateCategoryDto);
    try {
      return await this.categoryRepository.save(category);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Category name already exists.');
      }
      throw error;
    }
  }
  async deleteCategory(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
  }
  async createProductVariant(createProductVariantDto: CreateProductVariantDto): Promise<ProductVariant> {
    const product = await this.productRepository.findOne({ where: { id: createProductVariantDto.product_id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${createProductVariantDto.product_id}" not found for this variant.`);
    }
    const newVariant = this.productVariantRepository.create({
      ...createProductVariantDto,
      product: product,
    });
    try {
      return await this.productVariantRepository.save(newVariant);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Product Variant SKU or Barcode already exists for this product.');
      }
      throw error;
    }
  }
  async findAllProductVariants(): Promise<ProductVariant[]> {
    return this.productVariantRepository.find({ relations: ['product'] });
  }
  async findProductVariantById(id: string): Promise<ProductVariant> {
    const variant = await this.productVariantRepository.findOne({ where: { id }, relations: ['product'] });
    if (!variant) {
      throw new NotFoundException(`Product Variant with ID "${id}" not found.`);
    }
    return variant;
  }
  async updateProductVariant(id: string, updateProductVariantDto: UpdateProductVariantDto): Promise<ProductVariant> {
    const variant = await this.findProductVariantById(id);
    const { product_id, ...variantData } = updateProductVariantDto;
    if (product_id && product_id !== variant.product.id) {
      const product = await this.productRepository.findOne({ where: { id: product_id } });
      if (!product) {
        throw new NotFoundException(`Product with ID "${product_id}" not found.`);
      }
      variant.product = product;
    }
    this.productVariantRepository.merge(variant, variantData);
    try {
      return await this.productVariantRepository.save(variant);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Product Variant SKU or Barcode already exists for this product.');
      }
      throw error;
    }
  }
  async deleteProductVariant(id: string): Promise<void> {
    const result = await this.productVariantRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product Variant with ID "${id}" not found.`);
    }
  }
}