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
  NotFoundException, 
  ForbiddenException, 
  BadRequestException, 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { ProveedorEntity } from './entities/proveedor.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface'; 
@ApiTags('Proveedores')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR) 
  @ApiOperation({ summary: 'Crear un nuevo proveedor' })
  @ApiResponse({ status: 201, description: 'Proveedor creado exitosamente', type: ProveedorEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 409, description: 'El proveedor ya existe en el establecimiento (por nombre o NIT)' })
  @ApiBody({ type: CreateProveedorDto })
  async create(@Body() createProveedorDto: CreateProveedorDto, @Req() req: AuthenticatedRequest): Promise<ProveedorEntity> {
    createProveedorDto.establecimiento_id = req.user.establecimiento_id; 
    return this.proveedoresService.create(createProveedorDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO) 
  @ApiOperation({ summary: 'Obtener todos los proveedores de un establecimiento' })
  @ApiResponse({ status: 200, description: 'Lista de proveedores', type: [ProveedorEntity] })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  async findAll(@Req() req: AuthenticatedRequest): Promise<ProveedorEntity[]> {
    return this.proveedoresService.findAll(req.user.establecimiento_id); 
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener un proveedor por ID' })
  @ApiResponse({ status: 200, description: 'Proveedor encontrado', type: ProveedorEntity })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del proveedor (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<ProveedorEntity> {
    const proveedor = await this.proveedoresService.findOne(id, req.user.establecimiento_id); 
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID "${id}" no encontrado.`);
    }
    return proveedor;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR) 
  @ApiOperation({ summary: 'Actualizar un proveedor por ID' })
  @ApiResponse({ status: 200, description: 'Proveedor actualizado exitosamente', type: ProveedorEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  @ApiResponse({ status: 409, description: 'El nuevo nombre o NIT del proveedor ya existe en el establecimiento' })
  @ApiParam({ name: 'id', description: 'ID del proveedor (UUID)', type: 'string' })
  @ApiBody({ type: UpdateProveedorDto })
  async update(@Param('id') id: string, @Body() updateProveedorDto: UpdateProveedorDto, @Req() req: AuthenticatedRequest): Promise<ProveedorEntity> {
    return this.proveedoresService.update(id, updateProveedorDto, req.user.establecimiento_id); 
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR) 
  @ApiOperation({ summary: 'Eliminar un proveedor por ID' })
  @ApiResponse({ status: 200, description: 'Proveedor eliminado exitosamente' }) 
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del proveedor (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) { 
    await this.proveedoresService.remove(id, req.user.establecimiento_id); 
      return { message: 'Proveedor eliminado exitosamente', data: null };
  }
}
