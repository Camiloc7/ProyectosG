import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';
import { CuentaBancariaEntity } from './entities/cuenta-bancaria.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('Cuentas Bancarias')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('cuentas-bancarias')
export class CuentasBancariasController {
  constructor(private readonly cuentasBancariasService: CuentasBancariasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN) 
  @ApiOperation({ summary: 'Crear una nueva cuenta bancaria para el establecimiento del administrador' })
  @ApiResponse({ status: 201, description: 'Cuenta bancaria creada exitosamente', type: CuentaBancariaEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'La cuenta bancaria ya existe para el establecimiento (por número de cuenta o PUC)' })
  @ApiBody({ type: CreateCuentaBancariaDto })
  async create(@Body() createCuentaBancariaDto: CreateCuentaBancariaDto, @Req() req: AuthenticatedRequest): Promise<CuentaBancariaEntity> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('No se pudo determinar el establecimiento del usuario.');
    }
    return this.cuentasBancariasService.create(createCuentaBancariaDto, establecimientoId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO) 
  @ApiOperation({ summary: 'Obtener todas las cuentas bancarias del establecimiento del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de cuentas bancarias', type: [CuentaBancariaEntity] })
  async findAll(@Req() req: AuthenticatedRequest): Promise<CuentaBancariaEntity[]> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('No se pudo determinar el establecimiento del usuario.');
    }
    return this.cuentasBancariasService.findAll(establecimientoId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener una cuenta bancaria por ID' })
  @ApiResponse({ status: 200, description: 'Cuenta bancaria encontrada', type: CuentaBancariaEntity })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada o no pertenece al establecimiento del usuario' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta bancaria (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<CuentaBancariaEntity> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('No se pudo determinar el establecimiento del usuario.');
    }
    return this.cuentasBancariasService.findOne(id, establecimientoId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN) 
  @ApiOperation({ summary: 'Actualizar una cuenta bancaria por ID' })
  @ApiResponse({ status: 200, description: 'Cuenta bancaria actualizada exitosamente', type: CuentaBancariaEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada o no pertenece al establecimiento del usuario' })
  @ApiResponse({ status: 409, description: 'El número de cuenta ya existe para otra cuenta en el establecimiento' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta bancaria (UUID)', type: 'string' })
  @ApiBody({ type: UpdateCuentaBancariaDto })
  async update(@Param('id') id: string, @Body() updateCuentaBancariaDto: UpdateCuentaBancariaDto, @Req() req: AuthenticatedRequest): Promise<CuentaBancariaEntity> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('No se pudo determinar el establecimiento del usuario.');
    }
    return this.cuentasBancariasService.update(id, updateCuentaBancariaDto, establecimientoId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN) 
  @ApiOperation({ summary: 'Eliminar una cuenta bancaria por ID' })
  @ApiResponse({ status: 204, description: 'Cuenta bancaria eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada o no pertenece al establecimiento del usuario' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta bancaria (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException('No se pudo determinar el establecimiento del usuario.');
    }
    await this.cuentasBancariasService.remove(id, establecimientoId);
  }
}