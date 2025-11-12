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
import { MesasService } from './mesas.service';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { MesaEntity } from './entities/mesa.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RolesService } from '../roles/roles.service'; 

@ApiTags('Mesas')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('mesas')
export class MesasController {
  constructor(
    private readonly mesasService: MesasService,
    private readonly rolesService: RolesService, 
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Crear una nueva mesa' })
  @ApiResponse({ status: 201, description: 'Mesa creada exitosamente', type: MesaEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Establecimiento no encontrado' })
  @ApiResponse({ status: 409, description: 'El número de mesa ya existe en el establecimiento' })
  @ApiBody({ type: CreateMesaDto })
  async create(@Body() createMesaDto: CreateMesaDto, @Req() req: AuthenticatedRequest): Promise<MesaEntity> {
    const adminRole = await this.rolesService.findOneByName(RoleName.ADMIN);
    if (req.user.rol_id !== adminRole.id && createMesaDto.establecimiento_id !== req.user.establecimiento_id) {
        throw new ForbiddenException('No tiene permiso para crear mesas en otro establecimiento.'); 
    }
    return this.mesasService.create(createMesaDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener todas las mesas de un establecimiento' })
  @ApiResponse({ status: 200, description: 'Lista de mesas', type: [MesaEntity] })
  async findAll(@Req() req: AuthenticatedRequest): Promise<MesaEntity[]> {
    return this.mesasService.findAll(req.user.establecimiento_id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener una mesa por ID' })
  @ApiResponse({ status: 200, description: 'Mesa encontrada', type: MesaEntity })
  @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
  @ApiParam({ name: 'id', description: 'ID de la mesa (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<MesaEntity> {
    return this.mesasService.findOne(id, req.user.establecimiento_id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar una mesa por ID' })
  @ApiResponse({ status: 200, description: 'Mesa actualizada exitosamente', type: MesaEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
  @ApiResponse({ status: 409, description: 'El nuevo número de mesa ya existe en el establecimiento' })
  @ApiParam({ name: 'id', description: 'ID de la mesa (UUID)', type: 'string' })
  @ApiBody({ type: UpdateMesaDto })
  async update(@Param('id') id: string, @Body() updateMesaDto: UpdateMesaDto, @Req() req: AuthenticatedRequest): Promise<MesaEntity> {
    return this.mesasService.update(id, updateMesaDto, req.user.establecimiento_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Eliminar una mesa por ID' })
  @ApiResponse({ status: 204, description: 'Mesa eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'La mesa tiene pedidos activos' })
  @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
  @ApiParam({ name: 'id', description: 'ID de la mesa (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    await this.mesasService.remove(id, req.user.establecimiento_id);
  }
}