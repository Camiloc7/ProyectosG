import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Req, 
  ForbiddenException,
  Query,
  BadRequestException,
  NotFoundException, 
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'; 
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto'; 
import { ClienteEntity } from './entities/cliente.entity'; 
import { AuthGuard } from '../../common/guards/auth.guard'; 
import { RolesGuard } from '../../common/guards/roles.guard'; 
import { Roles } from '../../common/decorators/roles.decorator'; 
import { RoleName } from '../../common/constants/app.constants'; 
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface'; 
import { DOCUMENTO_TYPES } from './tipos-documento';
import { EstablecimientosService } from '../establecimientos/establecimientos.service'; 

@ApiTags('Clientes') 
@ApiBearerAuth('JWT-auth') 
@UseGuards(AuthGuard, RolesGuard) 
@Controller('clientes')
export class ClientesController {
 constructor(
    private readonly clientesService: ClientesService,
    private readonly establecimientosService: EstablecimientosService,
  ) {}

  @Get('external-info')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO, RoleName.MESERO)
  @ApiOperation({ summary: 'Obtener información de un cliente desde una API externa' })
  @ApiResponse({ status: 200, description: 'Información del cliente obtenida exitosamente.', type: ClienteEntity })
  @ApiResponse({ status: 400, description: 'Faltan parámetros de consulta.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  @ApiResponse({ status: 404, description: 'Cliente o establecimiento no encontrado.' })
  @ApiQuery({ name: 'tipoDocumento', description: 'Tipo de documento (ej. CC, NIT, CE)', required: true })
  @ApiQuery({ name: 'numeroDocumento', description: 'Número de documento', required: true })
  async getExternalClientInfo(
    @Req() req: AuthenticatedRequest,
    @Query('tipoDocumento') tipoDocumento: string,
    @Query('numeroDocumento') numeroDocumento: string,
  ) {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('El ID del establecimiento no está disponible en el token de autenticación.');
    }
    
    if (!tipoDocumento || !numeroDocumento) {
      throw new BadRequestException('Se requieren el tipo y número de documento.');
    }
    const establecimiento = await this.establecimientosService.findOne(establecimientoId);
    if (!establecimiento) {
      throw new NotFoundException('Establecimiento no encontrado.');
    }
    return this.clientesService.fetchClientFromExternalApi(
      tipoDocumento,
      numeroDocumento,
      establecimiento,
    );
  }


  @Get('tipos-documento')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener la lista de todos los tipos de documento' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos de documento',
    schema: {
      example: [
        { id: '13', nombre: 'Cédula de ciudadanía', codigo: '13' },
        { id: '31', nombre: 'NIT', codigo: '31' },
        { id: '11', nombre: 'Registro civil', codigo: '11' },
      ],
    },
  })
  getTiposDocumento(@Req() req: AuthenticatedRequest) {
    const tiposDocumento = DOCUMENTO_TYPES.map(doc => ({
      id: doc.id,
      nombre: doc.nombre,
      codigo: doc.codigo,
    }));
    return tiposDocumento;
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO, RoleName.MESERO)
  @ApiOperation({ summary: 'Buscar clientes por nombre, teléfono o dirección' })
  @ApiQuery({ name: 'q', description: 'Término de búsqueda (nombre, teléfono o dirección)', required: true })
  @ApiResponse({ status: 200, description: 'Lista de clientes que coinciden con la búsqueda.', type: [ClienteEntity] })
  @ApiResponse({ status: 400, description: 'Falta el parámetro de búsqueda.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  async searchClients(@Req() req: AuthenticatedRequest, @Query('q') query: string): Promise<ClienteEntity[]> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('El ID del establecimiento no está disponible en el token de autenticación.');
    }

    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Se requiere un término de búsqueda.');
    }

    return this.clientesService.findByQuery(query, establecimientoId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED) 
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO, RoleName.MESERO) 
  @ApiOperation({ summary: 'Crear un nuevo cliente o recuperar uno existente' })
  @ApiResponse({ status: 201, description: 'El cliente ha sido creado o recuperado exitosamente.', type: ClienteEntity })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  @ApiResponse({ status: 409, description: 'Conflicto: el cliente ya existe con los datos proporcionados.' })
  @ApiBody({ type: CreateClienteDto })
  async create(@Body() createClienteDto: CreateClienteDto, @Req() req: AuthenticatedRequest): Promise<ClienteEntity> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('El ID del establecimiento no está disponible en el token de autenticación.');
    }
    return this.clientesService.getOrCreateCliente(createClienteDto, establecimientoId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO, RoleName.MESERO)
  @ApiOperation({ summary: 'Obtener todos los clientes de un establecimiento' })
  @ApiResponse({ status: 200, description: 'Lista de clientes', type: [ClienteEntity] })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  async findAll(@Req() req: AuthenticatedRequest): Promise<ClienteEntity[]> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('El ID del establecimiento no está disponible en el token de autenticación.');
    }
    return this.clientesService.findAll(establecimientoId);
  }
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO, RoleName.MESERO)
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado.', type: ClienteEntity })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<ClienteEntity> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('El ID del establecimiento no está disponible en el token de autenticación.');
    }
    return this.clientesService.findOne(id, establecimientoId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Actualizar un cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado exitosamente.', type: ClienteEntity })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  @ApiResponse({ status: 409, description: 'Conflicto: el cliente ya existe con los datos actualizados.' })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)', type: 'string' })
  @ApiBody({ type: UpdateClienteDto })
  async update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto, @Req() req: AuthenticatedRequest): Promise<ClienteEntity> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('El ID del establecimiento no está disponible en el token de autenticación.');
    }
    return this.clientesService.update(id, updateClienteDto, establecimientoId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) 
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Eliminar un cliente por ID' })
  @ApiResponse({ status: 204, description: 'Cliente eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado.' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido.' })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('El ID del establecimiento no está disponible en el token de autenticación.');
    }
    await this.clientesService.remove(id, establecimientoId);
  }
}

