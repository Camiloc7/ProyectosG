import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MovimientosCuentasBancariasService } from './movimientos-bancarios.service';
import { CreateMovimientoCuentaBancariaDto } from './dto/create-movimiento-bancario.dto';
import { UpdateMovimientoCuentaBancariaDto } from './dto/update-movimiento-bancario.dto';
import {  MovimientoBancarioEntity } from './entities/movimiento-bancario.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('Movimientos Cuentas Bancarias')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('movimientos-bancarios')
export class MovimientosCuentasBancariasController {
  constructor(private readonly movimientosCuentasBancariasService: MovimientosCuentasBancariasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO) 
  @ApiOperation({ summary: 'Crear un nuevo movimiento de cuenta bancaria' })
  @ApiResponse({ status: 201, description: 'Movimiento creado exitosamente', type:  MovimientoBancarioEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'La cuenta bancaria asociada no existe o no pertenece al establecimiento del usuario' })
  @ApiBody({ type: CreateMovimientoCuentaBancariaDto })
  async create(@Body() createMovimientoCuentaBancariaDto: CreateMovimientoCuentaBancariaDto, @Req() req: AuthenticatedRequest): Promise< MovimientoBancarioEntity> {
    return this.movimientosCuentasBancariasService.create(createMovimientoCuentaBancariaDto, req.user.establecimiento_id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener todos los movimientos de cuentas bancarias del establecimiento del usuario' })
  @ApiQuery({ name: 'cuentaBancariaId', type: 'string', required: false, description: 'Filtrar movimientos por ID de cuenta bancaria específica' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos de cuentas bancarias', type: [ MovimientoBancarioEntity] })
  async findAll(@Req() req: AuthenticatedRequest, @Query('cuentaBancariaId') cuentaBancariaId?: string): Promise< MovimientoBancarioEntity[]> {
    return this.movimientosCuentasBancariasService.findAll(req.user.establecimiento_id, cuentaBancariaId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener un movimiento de cuenta bancaria por ID' })
  @ApiResponse({ status: 200, description: 'Movimiento encontrado', type:  MovimientoBancarioEntity })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado o no pertenece al establecimiento del usuario' })
  @ApiParam({ name: 'id', description: 'ID del movimiento (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise< MovimientoBancarioEntity> {
    return this.movimientosCuentasBancariasService.findOne(id, req.user.establecimiento_id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR) 
  @ApiOperation({ summary: 'Actualizar un movimiento de cuenta bancaria por ID' })
  @ApiResponse({ status: 200, description: 'Movimiento actualizado exitosamente', type:  MovimientoBancarioEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado o no pertenece al establecimiento del usuario' })
  @ApiParam({ name: 'id', description: 'ID del movimiento (UUID)', type: 'string' })
  @ApiBody({ type: UpdateMovimientoCuentaBancariaDto })
  async update(@Param('id') id: string, @Body() updateMovimientoCuentaBancariaDto: UpdateMovimientoCuentaBancariaDto, @Req() req: AuthenticatedRequest): Promise< MovimientoBancarioEntity> {
    return this.movimientosCuentasBancariasService.update(id, updateMovimientoCuentaBancariaDto, req.user.establecimiento_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR) 
  @ApiOperation({ summary: 'Eliminar un movimiento de cuenta bancaria por ID' })
  @ApiResponse({ status: 204, description: 'Movimiento eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado o no pertenece al establecimiento del usuario' })
  @ApiParam({ name: 'id', description: 'ID del movimiento (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    await this.movimientosCuentasBancariasService.remove(id, req.user.establecimiento_id);
  }

  @Get('resumen/consignado')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO) 
  @ApiOperation({ summary: 'Obtener el total consignado para una cuenta bancaria en un rango de fechas' })
  @ApiQuery({ name: 'cuentaBancariaId', type: 'string', description: 'ID de la cuenta bancaria (UUID)' })
  @ApiQuery({ name: 'fechaInicio', type: 'string', format: 'date', description: 'Fecha de inicio del período (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaFin', type: 'string', format: 'date', description: 'Fecha de fin del período (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Total consignado en el período', type: Number })
  @ApiResponse({ status: 400, description: 'Fechas inválidas o parámetros faltantes' })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada o no pertenece al establecimiento del usuario' })
  async getTotalConsignado(
    @Query('cuentaBancariaId') cuentaBancariaId: string,
    @Query('fechaInicio') fechaInicioStr: string,
    @Query('fechaFin') fechaFinStr: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<number> {
    if (!fechaInicioStr || !fechaFinStr || !cuentaBancariaId) {
      throw new BadRequestException('Los parámetros cuentaBancariaId, fechaInicio y fechaFin son obligatorios.');
    }

    const fechaInicio = new Date(fechaInicioStr);
    const fechaFin = new Date(fechaFinStr);

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      throw new BadRequestException('Las fechas proporcionadas no son válidas.');
    }
    fechaFin.setHours(23, 59, 59, 999);
    return this.movimientosCuentasBancariasService.getTotalConsignadoPorPeriodo(
      cuentaBancariaId,
      fechaInicio,
      fechaFin,
      req.user.establecimiento_id,
    );
  }
}