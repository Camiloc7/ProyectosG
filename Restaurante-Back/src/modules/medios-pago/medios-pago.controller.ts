import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Req, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MediosPagoService } from './medios-pago.service';
import { CreateMedioPagoDto } from './dto/create-medio-pago.dto';
import { UpdateMedioPagoDto } from './dto/update-medio-pago.dto';
import { MedioPagoEntity } from './entities/medio-pago.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RolesService } from '../roles/roles.service'; 

@ApiTags('Medios de Pago')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard) 
@Controller('medios-pago') 
export class MediosPagoController {
  constructor(
    private readonly mediosPagoService: MediosPagoService,
    private readonly rolesService: RolesService, 
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR) 
  @ApiOperation({ summary: 'Crear un nuevo medio de pago' })
  @ApiResponse({ status: 201, description: 'Medio de pago creado exitosamente', type: MedioPagoEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Establecimiento no encontrado' })
  @ApiResponse({ status: 409, description: 'El medio de pago ya existe en el establecimiento' })
  @ApiBody({ type: CreateMedioPagoDto })
  async create(@Body() createMedioPagoDto: CreateMedioPagoDto, @Req() req: AuthenticatedRequest): Promise<MedioPagoEntity> {
    createMedioPagoDto.establecimiento_id = req.user.establecimiento_id;
    return this.mediosPagoService.create(createMedioPagoDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO) 
  @ApiOperation({ summary: 'Obtener todos los medios de pago de un establecimiento' })
  @ApiQuery({ name: 'activo', type: 'boolean', required: false, description: 'Filtrar por estado activo del medio de pago' })
  @ApiResponse({ status: 200, description: 'Lista de medios de pago', type: [MedioPagoEntity] })
  async findAll(@Req() req: AuthenticatedRequest, @Query('activo') activo?: string): Promise<MedioPagoEntity[]> {
    const filterActivo = activo ? (activo.toLowerCase() === 'true') : undefined;
    return this.mediosPagoService.findAll(req.user.establecimiento_id, filterActivo);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener un medio de pago por ID' })
  @ApiResponse({ status: 200, description: 'Medio de pago encontrado', type: MedioPagoEntity })
  @ApiResponse({ status: 404, description: 'Medio de pago no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del medio de pago (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<MedioPagoEntity> {
    return this.mediosPagoService.findOne(id, req.user.establecimiento_id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR) 
  @ApiOperation({ summary: 'Actualizar un medio de pago por ID' })
  @ApiResponse({ status: 200, description: 'Medio de pago actualizado exitosamente', type: MedioPagoEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Medio de pago no encontrado' })
  @ApiResponse({ status: 409, description: 'El nuevo nombre del medio de pago ya existe en el establecimiento' })
  @ApiParam({ name: 'id', description: 'ID del medio de pago (UUID)', type: 'string' })
  @ApiBody({ type: UpdateMedioPagoDto })
  async update(@Param('id') id: string, @Body() updateMedioPagoDto: UpdateMedioPagoDto, @Req() req: AuthenticatedRequest): Promise<MedioPagoEntity> {
    return this.mediosPagoService.update(id, updateMedioPagoDto, req.user.establecimiento_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR) 
  @ApiOperation({ summary: 'Eliminar un medio de pago por ID' })
  @ApiResponse({ status: 204, description: 'Medio de pago eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'Medio de pago tiene pagos asociados' })
  @ApiResponse({ status: 404, description: 'Medio de pago no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del medio de pago (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    await this.mediosPagoService.remove(id, req.user.establecimiento_id);
  }
}