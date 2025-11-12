import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { ProductoEntity } from './entities/producto.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RolesService } from '../roles/roles.service';
import { ProductListItemDto } from './dto/product-list-item.dto';
import { CreateProductoConfigurableDto } from './dto/create-producto-configurable.dto';
import { ProductoConfigurableEntity } from './entities/producto-configurable.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProductoConfigurableDto } from './dto/update-producto-configurable.dto';

@ApiTags('Productos')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('productos')
export class ProductosController {
  constructor(
    private readonly productosService: ProductosService,
    private readonly rolesService: RolesService,
  ) {}

   @Post('subir-excel')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir un archivo de Excel para crear/actualizar productos' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de Excel con las hojas "Productos", "Recetas", "Configurables" y "Opciones".',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Productos procesados exitosamente' })
  @ApiResponse({ status: 400, description: 'Archivo inválido, formato incorrecto o errores de validación en los datos.' })
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string; data?: any }> {
    if (!file) {
      throw new BadRequestException('Debe subir un archivo de Excel.');
    }

    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten archivos de Excel (.xlsx o .xls).');
    }

    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('No tiene un establecimiento asignado.');
    }
    
    try {
      return await this.productosService.processExcel(file.buffer, establecimientoId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.getResponse());
      }
      throw error;
    }
  }



  @Get('listaProductos')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO, RoleName.DOMICILIARIO)
  @ApiOperation({ summary: 'Obtener una lista simplificada de productos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos simplificada por establecimiento del usuario',
    type: [ProductListItemDto],
  })
  async getProductsList(@Req() req: AuthenticatedRequest): Promise<ProductListItemDto[]> {
    if (!req.user.establecimiento_id) {
      throw new BadRequestException('Tu token no tiene un establecimiento asignado.');
    }
    return this.productosService.getProductsList(req.user.establecimiento_id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Crear un nuevo producto simple' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente', type: ProductoEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Establecimiento o categoría no encontrado' })
  @ApiResponse({ status: 409, description: 'El producto ya existe en el establecimiento' })
  @ApiBody({ type: CreateProductoDto })
  async create(@Body() createProductoDto: CreateProductoDto, @Req() req: AuthenticatedRequest): Promise<ProductoEntity> {
    const adminRole = await this.rolesService.findOneByName(RoleName.ADMIN);
    if (req.user.rol_id !== adminRole.id) {
      if (createProductoDto.establecimiento_id && createProductoDto.establecimiento_id !== req.user.establecimiento_id) {
        throw new ForbiddenException('No tiene permiso para crear productos en otro establecimiento.');
      }
      createProductoDto.establecimiento_id = req.user.establecimiento_id;
    } else {
      if (!createProductoDto.establecimiento_id) {
        createProductoDto.establecimiento_id = req.user.establecimiento_id;
      }
    }
    if (!createProductoDto.establecimiento_id) {
      throw new BadRequestException('El ID del establecimiento no pudo ser determinado.');
    }
    return this.productosService.create(createProductoDto);
  }





@Post('configurable')
@HttpCode(HttpStatus.CREATED)
@Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
@ApiOperation({ summary: 'Crear un nuevo producto configurable' })
@ApiBody({ type: CreateProductoConfigurableDto })
@ApiResponse({
  status: 201,
  description: 'Producto configurable creado exitosamente',
  type: ProductoConfigurableEntity,
})
async createConfigurable(
  @Body() createDto: CreateProductoConfigurableDto,
  @Req() req: AuthenticatedRequest,
): Promise<ProductoConfigurableEntity> {
  return this.productosService.createConfigurable(createDto, req.user.establecimiento_id);
}


  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener todos los productos de un establecimiento' })
  @ApiResponse({ status: 200, description: 'Lista de productos', type: [ProductListItemDto] })
  async findAll(@Req() req: AuthenticatedRequest): Promise<ProductListItemDto[]> {
    return this.productosService.findAll(req.user.establecimiento_id);
  }


  @Get('configurable/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener un producto configurable por ID' })
  @ApiResponse({ status: 200, description: 'Producto configurable encontrado', type: ProductoConfigurableEntity })
  @ApiResponse({ status: 404, description: 'Producto configurable no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del producto configurable (UUID)', type: 'string' })
  async findOneConfigurable(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<ProductoConfigurableEntity> {
    const producto = await this.productosService.findOneConfigurableWithRelations(id, req.user.establecimiento_id);
    if (!producto) {
      throw new NotFoundException(`Producto configurable con ID "${id}" no encontrado.`);
    }
    return producto;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener un producto simple por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado', type: ProductoEntity })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<ProductoEntity> {
    const producto = await this.productosService.findOne(id, req.user.establecimiento_id);
    if (!producto) {
      throw new NotFoundException(`Producto con ID "${id}" no encontrado.`);
    }
    return producto;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar un producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto actualizado exitosamente', type: ProductoEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 409, description: 'El nuevo nombre del producto ya existe en el establecimiento' })
  @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
  @ApiBody({ type: UpdateProductoDto })
  async update(@Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto, @Req() req: AuthenticatedRequest): Promise<ProductoEntity> {
    return this.productosService.update(id, updateProductoDto, req.user.establecimiento_id);
  }

  @Patch('configurable/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar un producto configurable por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto configurable (UUID)', type: 'string' })
  @ApiBody({ type: UpdateProductoConfigurableDto })
  @ApiResponse({
    status: 200,
    description: 'Producto configurable actualizado exitosamente',
    type: ProductoConfigurableEntity,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Producto configurable no encontrado' })
  async updateConfigurable(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductoConfigurableDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ProductoConfigurableEntity> {
    const productoActualizado = await this.productosService.updateConfigurable(
      id,
      updateDto,
      req.user.establecimiento_id,
    );
    if (!productoActualizado) {
      throw new NotFoundException(`Producto configurable con ID "${id}" no encontrado.`);
    }
    return productoActualizado;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Eliminar un producto por ID' })
  @ApiResponse({ status: 204, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    await this.productosService.remove(id, req.user.establecimiento_id);
  }

  // @Post(':id/consumir-ingredientes')
  // @HttpCode(HttpStatus.OK)
  // @Roles(RoleName.CAJERO, RoleName.MESERO, RoleName.ADMIN)
  // @ApiOperation({ summary: 'Consumir ingredientes de un producto (simula una venta)' })
  // @ApiResponse({ status: 200, description: 'Ingredientes consumidos exitosamente' })
  // @ApiResponse({ status: 400, description: 'Stock insuficiente para uno o más ingredientes' })
  // @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  // @ApiParam({ name: 'id', description: 'ID del producto (UUID)', type: 'string' })
  // async consumeIngredients(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
  //   await this.productosService.consumeProductIngredients(id, req.user.establecimiento_id);
  // }
}
