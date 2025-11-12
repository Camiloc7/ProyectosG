import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Controller('products')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}


  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.productsService.createCategory(createCategoryDto);
  }

  @Get('categories') 
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Get('categories/:id') 
  findCategoryById(@Param('id') id: string) {
    return this.productsService.findCategoryById(id);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.productsService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategory(@Param('id') id: string) {
    return this.productsService.deleteCategory(id);
  }

  @Post('variants')
  @HttpCode(HttpStatus.CREATED)
  createProductVariant(@Body() createProductVariantDto: CreateProductVariantDto) {
    return this.productsService.createProductVariant(createProductVariantDto);
  }

  @Get('variants') 
  findAllProductVariants() {
    return this.productsService.findAllProductVariants();
  }

  @Get('variants/:id') 
  findProductVariantById(@Param('id') id: string) {
    return this.productsService.findProductVariantById(id);
  }

  @Patch('variants/:id')
  updateProductVariant(@Param('id') id: string, @Body() updateProductVariantDto: UpdateProductVariantDto) {
    return this.productsService.updateProductVariant(id, updateProductVariantDto);
  }

  @Delete('variants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProductVariant(@Param('id') id: string) {
    return this.productsService.deleteProductVariant(id);
  }


  @Post()
  @HttpCode(HttpStatus.CREATED)
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Get()
  findAllProducts() {
    return this.productsService.findAllProducts();
  }

  @Get('sku/:sku') 
  findProductBySku(@Param('sku') sku: string) {
    return this.productsService.findProductBySku(sku);
  }

  @Get('barcode/:barcode') 
  findProductByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findProductByBarcode(barcode);
  }

  @Get(':id') 
  findProductById(@Param('id') id: string) {
    return this.productsService.findProductById(id);
  }

  @Patch(':id')
  updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}