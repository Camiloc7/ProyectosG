import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { RolEntity } from './entities/rol.entity';


@ApiTags('Roles') 
@Controller('roles') 
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiResponse({ status: 201, description: 'Rol creado exitosamente', type: RolEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'El rol ya existe' })
  @ApiBody({ type: CreateRolDto })
  async create(@Body() createRolDto: CreateRolDto): Promise<RolEntity> {
    return this.rolesService.create(createRolDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los roles' })
  @ApiResponse({ status: 200, description: 'Lista de roles', type: [RolEntity] })
  async findAll(): Promise<RolEntity[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un rol por ID' })
  @ApiResponse({ status: 200, description: 'Rol encontrado', type: RolEntity })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del rol (UUID)', type: 'string' })
  async findOne(@Param('id') id: string): Promise<RolEntity> {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un rol por ID' })
  @ApiResponse({ status: 200, description: 'Rol actualizado exitosamente', type: RolEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 409, description: 'El nuevo nombre del rol ya existe' })
  @ApiParam({ name: 'id', description: 'ID del rol (UUID)', type: 'string' })
  @ApiBody({ type: UpdateRolDto })
  async update(@Param('id') id: string, @Body() updateRolDto: UpdateRolDto): Promise<RolEntity> {
    return this.rolesService.update(id, updateRolDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un rol por ID' })
  @ApiResponse({ status: 204, description: 'Rol eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del rol (UUID)', type: 'string' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.rolesService.remove(id);
  }
}