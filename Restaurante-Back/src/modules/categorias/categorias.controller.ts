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
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
  import { CategoriasService } from './categorias.service';
  import { CreateCategoriaDto } from './dto/create-categoria.dto';
  import { UpdateCategoriaDto } from './dto/update-categoria.dto';
  import { CategoriaEntity } from './entities/categoria.entity';
  import { AuthGuard } from '../../common/guards/auth.guard';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { RoleName } from '../../common/constants/app.constants';
  import { RolesService } from '../roles/roles.service';
  import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

  @ApiTags('Categorias')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Controller('categorias')
  export class CategoriasController {
    constructor(
      private readonly categoriasService: CategoriasService,
      private readonly rolesService: RolesService,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
    @ApiOperation({ summary: 'Crear una nueva categoría' })
    @ApiResponse({ status: 201, description: 'Categoría creada exitosamente', type: CategoriaEntity })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @ApiResponse({ status: 403, description: 'Acceso prohibido' })
    @ApiResponse({ status: 404, description: 'Establecimiento no encontrado' })
    @ApiResponse({ status: 409, description: 'La categoría ya existe en el establecimiento' })
    @ApiBody({ type: CreateCategoriaDto })
    async create(@Body() createCategoriaDto: CreateCategoriaDto, @Req() req: AuthenticatedRequest): Promise<CategoriaEntity> {
      createCategoriaDto.establecimiento_id = req.user.establecimiento_id;
      return this.categoriasService.create(createCategoriaDto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
    @ApiOperation({ summary: 'Obtener todas las categorías de un establecimiento' })
    @ApiResponse({ status: 200, description: 'Lista de categorías', type: [CategoriaEntity] })
    async findAll(@Req() req: AuthenticatedRequest): Promise<CategoriaEntity[]> {
      return this.categoriasService.findAll(req.user.establecimiento_id);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
    @ApiOperation({ summary: 'Obtener una categoría por ID' })
    @ApiResponse({ status: 200, description: 'Categoría encontrada', type: CategoriaEntity })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    @ApiParam({ name: 'id', description: 'ID de la categoría (UUID)', type: 'string' })
    async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<CategoriaEntity> {
      return this.categoriasService.findOne(id, req.user.establecimiento_id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
    @ApiOperation({ summary: 'Actualizar una categoría por ID' })
    @ApiResponse({ status: 200, description: 'Categoría actualizada exitosamente', type: CategoriaEntity })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    @ApiResponse({ status: 409, description: 'El nuevo nombre de la categoría ya existe en el establecimiento' })
    @ApiParam({ name: 'id', description: 'ID de la categoría (UUID)', type: 'string' })
    @ApiBody({ type: UpdateCategoriaDto })
    async update(@Param('id') id: string, @Body() updateCategoriaDto: UpdateCategoriaDto, @Req() req: AuthenticatedRequest): Promise<CategoriaEntity> {
      return this.categoriasService.update(id, updateCategoriaDto, req.user.establecimiento_id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
    @ApiOperation({ summary: 'Eliminar una categoría por ID' })
    @ApiResponse({ status: 204, description: 'Categoría eliminada exitosamente' })
    @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
    @ApiParam({ name: 'id', description: 'ID de la categoría (UUID)', type: 'string' })
    async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
      await this.categoriasService.remove(id, req.user.establecimiento_id);
    }
  }