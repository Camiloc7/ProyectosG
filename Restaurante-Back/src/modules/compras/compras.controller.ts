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
  Query,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ComprasService } from './compras.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { CompraIngredienteEntity } from './entities/compra-ingrediente.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RolesService } from '../roles/roles.service';


@ApiTags('Compras de Ingredientes')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('compras')
export class ComprasController {
  constructor(
    private readonly comprasService: ComprasService,
    private readonly rolesService: RolesService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Registrar una nueva compra de ingrediente' })
  @ApiResponse({ status: 201, description: 'Compra registrada exitosamente', type: CompraIngredienteEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Ingrediente o proveedor no encontrado' })
  @ApiBody({ type: CreateCompraDto })
  async create(@Body() createCompraDto: CreateCompraDto, @Req() req: AuthenticatedRequest): Promise<CompraIngredienteEntity> {


    const adminRole = await this.rolesService.findOneByName(RoleName.ADMIN);

    createCompraDto.establecimiento_id = req.user.establecimiento_id;

    if (req.user.rol_id !== adminRole.id && createCompraDto.establecimiento_id !== req.user.establecimiento_id) {
      throw new ForbiddenException('No tiene permiso para crear ingredientes en otro establecimiento.');
    }




    return this.comprasService.create(createCompraDto);
  }



  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.COCINERO)
  @ApiOperation({ summary: 'Obtener todas las compras de ingredientes' })
  @ApiResponse({ status: 200, description: 'Lista de compras de ingredientes', type: [CompraIngredienteEntity] })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiQuery({ name: 'ingredienteId', required: false, description: 'Filtrar por ID de ingrediente' })
  @ApiQuery({ name: 'proveedorId', required: false, description: 'Filtrar por ID de proveedor' })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('ingredienteId') ingredienteId?: string,
    @Query('proveedorId') proveedorId?: string,
  ): Promise<CompraIngredienteEntity[]> {
    return this.comprasService.findAll(req.user.establecimiento_id, ingredienteId, proveedorId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.COCINERO)
  @ApiOperation({ summary: 'Obtener una compra de ingrediente por ID' })
  @ApiResponse({ status: 200, description: 'Compra de ingrediente encontrada', type: CompraIngredienteEntity })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Compra de ingrediente no encontrada' })
  @ApiParam({ name: 'id', description: 'ID de la compra (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<CompraIngredienteEntity> {
    const compra = await this.comprasService.findOne(id, req.user.establecimiento_id);
    if (!compra) {
      throw new NotFoundException(`Compra de ingrediente con ID "${id}" no encontrada.`);
    }
    return compra;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Actualizar una compra de ingrediente por ID' })
  @ApiResponse({ status: 200, description: 'Compra de ingrediente actualizada exitosamente', type: CompraIngredienteEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Compra de ingrediente no encontrada' })
  @ApiParam({ name: 'id', description: 'ID de la compra (UUID)', type: 'string' })
  @ApiBody({ type: UpdateCompraDto })
  async update(@Param('id') id: string, @Body() updateCompraDto: UpdateCompraDto, @Req() req: AuthenticatedRequest): Promise<CompraIngredienteEntity> {
    return this.comprasService.update(id, updateCompraDto, req.user.establecimiento_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Eliminar una compra de ingrediente por ID' })
  @ApiResponse({ status: 204, description: 'Compra de ingrediente eliminada exitosamente' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Compra de ingrediente no encontrada' })
  @ApiParam({ name: 'id', description: 'ID de la compra (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    await this.comprasService.remove(id, req.user.establecimiento_id);
  }
}
