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
  UploadedFile,
  UseInterceptors, 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { IngredientesService } from './ingredientes.service';
import { CreateIngredienteDto } from './dto/create-ingrediente.dto';
import { UpdateIngredienteDto } from './dto/update-ingrediente.dto';
import { IngredienteEntity } from './entities/ingrediente.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RolesService } from '../roles/roles.service';
import { FileInterceptor } from '@nestjs/platform-express';


@ApiTags('Ingredientes')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('ingredientes')
export class IngredientesController {
  constructor(
    private readonly ingredientesService: IngredientesService,
    private readonly rolesService: RolesService,
  ) {}


  
@Post('subir-excel')
@HttpCode(HttpStatus.CREATED)
@Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
@UseInterceptors(FileInterceptor('file')) 
@ApiOperation({ summary: 'Subir un archivo de Excel para crear/actualizar ingredientes' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@ApiResponse({ status: 201, description: 'Ingredientes procesados exitosamente' })
@ApiResponse({ status: 400, description: 'Archivo inválido o formato incorrecto' })
async uploadExcel(
  @UploadedFile() file: Express.Multer.File,
  @Req() req: AuthenticatedRequest,
): Promise<{ message: string; data: any }> {
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
  try {
    return await this.ingredientesService.processExcelFile(file.buffer, establecimientoId);
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw new BadRequestException(error.getResponse());
    }
    throw error;
  }
}

  @Get('unidades-de-medida')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.COCINERO)
  @ApiOperation({ summary: 'Obtener la lista de unidades de medida disponibles, agrupadas por categoría' })
  @ApiResponse({ status: 200, description: 'Lista de unidades de medida', schema: { type: 'object', additionalProperties: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, display: { type: 'string' } } } } } })
  getUnits(): { [key: string]: Array<{ key: string; display: string }> } {
    return this.ingredientesService.getAvailableUnits();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Crear un nuevo ingrediente' })
  @ApiResponse({ status: 201, description: 'Ingrediente creado exitosamente', type: IngredienteEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Establecimiento no encontrado' })
  @ApiResponse({ status: 409, description: 'El ingrediente ya existe en el establecimiento' })
  @ApiBody({ type: CreateIngredienteDto })
  async create(@Body() createIngredienteDto: CreateIngredienteDto, @Req() req: AuthenticatedRequest): Promise<IngredienteEntity> {
    const adminRole = await this.rolesService.findOneByName(RoleName.ADMIN);

    createIngredienteDto.establecimiento_id = req.user.establecimiento_id;

    if (req.user.rol_id !== adminRole.id && createIngredienteDto.establecimiento_id !== req.user.establecimiento_id) {
        throw new ForbiddenException('No tiene permiso para crear ingredientes en otro establecimiento.');
    }
    return this.ingredientesService.create(createIngredienteDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.COCINERO)
  @ApiOperation({ summary: 'Obtener todos los ingredientes de un establecimiento' })
  @ApiResponse({ status: 200, description: 'Lista de ingredientes', type: [IngredienteEntity] })
  async findAll(@Req() req: AuthenticatedRequest): Promise<IngredienteEntity[]> {
    return this.ingredientesService.findAll(req.user.establecimiento_id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.COCINERO)
  @ApiOperation({ summary: 'Obtener un ingrediente por ID' })
  @ApiResponse({ status: 200, description: 'Ingrediente encontrado', type: IngredienteEntity })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del ingrediente (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<IngredienteEntity> {
    const ingrediente = await this.ingredientesService.findOne(id, req.user.establecimiento_id);
    if (!ingrediente) {
      throw new NotFoundException(`Ingrediente con ID "${id}" no encontrado.`);
    }
    return ingrediente;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar un ingrediente por ID' })
  @ApiResponse({ status: 200, description: 'Ingrediente actualizado exitosamente', type: IngredienteEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @ApiResponse({ status: 409, description: 'El nuevo nombre del ingrediente ya existe en el establecimiento' })
  @ApiParam({ name: 'id', description: 'ID del ingrediente (UUID)', type: 'string' })
  @ApiBody({ type: UpdateIngredienteDto })
  async update(@Param('id') id: string, @Body() updateIngredienteDto: UpdateIngredienteDto, @Req() req: AuthenticatedRequest): Promise<IngredienteEntity> {
    return this.ingredientesService.update(id, updateIngredienteDto, req.user.establecimiento_id);
  }

  @Patch(':id/stock')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Actualizar el stock actual de un ingrediente (sumar/restar)' })
  @ApiResponse({ status: 200, description: 'Stock de ingrediente actualizado exitosamente', type: IngredienteEntity })
  @ApiResponse({ status: 400, description: 'Cantidad inválida o stock insuficiente' })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del ingrediente (UUID)', type: 'string' })
  @ApiBody({ schema: { type: 'object', properties: { cantidad: { type: 'number', description: 'Cantidad a añadir o restar (puede ser negativa)' } } } })
  async updateStock(@Param('id') id: string, @Body('cantidad') cantidad: number, @Req() req: AuthenticatedRequest): Promise<IngredienteEntity> {
    if (typeof cantidad !== 'number' || isNaN(cantidad)) {
      throw new BadRequestException('La cantidad debe ser un número.');
    }
    return this.ingredientesService.updateStock(id, cantidad, req.user.establecimiento_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Eliminar un ingrediente por ID' })
  @ApiResponse({ status: 204, description: 'Ingrediente eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del ingrediente (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    await this.ingredientesService.remove(id, req.user.establecimiento_id);
  }

}
