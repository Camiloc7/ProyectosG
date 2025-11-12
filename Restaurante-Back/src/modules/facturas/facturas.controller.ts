import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Req, Query, ForbiddenException, NotFoundException, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FacturasService } from './facturas.service';
import { UpdateFacturaDto } from './dto/update-factura.dto';
import { FacturaEntity, TipoFactura } from './entities/factura.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RolesService } from '../roles/roles.service';
import { CreateFacturaAndPaymentDto } from './dto/create-factura-and-payment.dto';
import { Response } from 'express';


@ApiTags('Facturas')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('facturas')
export class FacturasController {
  constructor(
    private readonly facturasService: FacturasService,
    private readonly rolesService: RolesService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.CAJERO)
  @ApiOperation({ summary: 'Crear una nueva factura y registrar un pago directo para un pedido' })
  @ApiResponse({ status: 201, description: 'Factura y pago creados exitosamente', type: FacturaEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos, pedido no válido, o inconsistencia en montos' })
  @ApiResponse({ status: 404, description: 'Establecimiento, cajero, pedido o medio de pago no encontrados' })
  @ApiResponse({ status: 409, description: 'Conflicto (ej. pedido ya completamente pagado, o problema de concurrencia)' })
  @ApiBody({ type: CreateFacturaAndPaymentDto })
  async create(@Body() createFacturaAndPaymentDto: CreateFacturaAndPaymentDto, @Req() req: AuthenticatedRequest): Promise<FacturaEntity> {
    const adminRole = await this.rolesService.findOneByName(RoleName.ADMIN);
    let targetEstablecimientoId: string;
    if (req.user.rol_id === adminRole.id) {
      if (createFacturaAndPaymentDto.establecimiento_id) {
        targetEstablecimientoId = createFacturaAndPaymentDto.establecimiento_id;
      } else {
        targetEstablecimientoId = req.user.establecimiento_id;
      }
    } else {
      if (createFacturaAndPaymentDto.establecimiento_id && createFacturaAndPaymentDto.establecimiento_id !== req.user.establecimiento_id) {
        throw new ForbiddenException('No tiene permiso para crear facturas en otro establecimiento.');
      }
      targetEstablecimientoId = req.user.establecimiento_id;
    }

    return this.facturasService.createFacturaAndPaymentForOrder(createFacturaAndPaymentDto, req.user.id, targetEstablecimientoId);
  }


  @Get('by-pedido/:pedidoId')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener una factura por ID de pedido' })
  @ApiResponse({ status: 200, description: 'Factura encontrada', type: FacturaEntity })
  @ApiResponse({ status: 404, description: 'Factura no encontrada para este pedido' })
  @ApiParam({ name: 'pedidoId', description: 'ID del pedido (UUID)', type: 'string' })
  async findByPedidoId(@Param('pedidoId') pedidoId: string, @Req() req: AuthenticatedRequest): Promise<FacturaEntity> {
    const factura = await this.facturasService.findOneByPedidoId(pedidoId, req.user.establecimiento_id);
    if (!factura) {
      throw new NotFoundException(`No se encontró una factura para el pedido con ID ${pedidoId}.`);
    }
    return factura;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener todas las facturas de un establecimiento con filtros opcionales' })
  @ApiQuery({ name: 'tipoFactura', enum: TipoFactura, required: false, description: 'Filtrar por tipo de factura' })
  @ApiQuery({ name: 'usuarioCajeroId', type: 'string', required: false, description: 'Filtrar por ID de cajero (UUID)' })
  @ApiQuery({ name: 'fechaInicio', type: 'string', format: 'date-time', required: false, description: 'Filtrar facturas desde esta fecha y hora de emisión (ISO 8601)' })
  @ApiQuery({ name: 'fechaFin', type: 'string', format: 'date-time', required: false, description: 'Filtrar facturas hasta esta fecha y hora de emisión (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Lista de facturas', type: [FacturaEntity] })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('tipoFactura') tipoFactura?: TipoFactura,
    @Query('usuarioCajeroId') usuarioCajeroId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ): Promise<FacturaEntity[]> {
    return this.facturasService.findAll(
      req.user.establecimiento_id,
      tipoFactura,
      usuarioCajeroId,
      fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin ? new Date(fechaFin) : undefined,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener una factura por ID' })
  @ApiResponse({ status: 200, description: 'Factura encontrada', type: FacturaEntity })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  @ApiParam({ name: 'id', description: 'ID de la factura (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<FacturaEntity> {
    return this.facturasService.findOne(id, req.user.establecimiento_id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.CAJERO)
  @ApiOperation({ summary: 'Actualizar una factura por ID (campos limitados)' })
  @ApiResponse({ status: 200, description: 'Factura actualizada exitosamente', type: FacturaEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos o inconsistencia en totales' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  @ApiParam({ name: 'id', description: 'ID de la factura (UUID)', type: 'string' })
  @ApiBody({ type: UpdateFacturaDto })
  async update(@Param('id') id: string, @Body() updateFacturaDto: UpdateFacturaDto, @Req() req: AuthenticatedRequest): Promise<FacturaEntity> {
    return this.facturasService.update(id, updateFacturaDto, req.user.establecimiento_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Eliminar una factura por ID (solo para ADMIN, con precaución)' })
  @ApiResponse({ status: 204, description: 'Factura eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'Factura tiene pagos asociados' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  @ApiParam({ name: 'id', description: 'ID de la factura (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<void> {
    await this.facturasService.remove(id, req.user.establecimiento_id);
  }

  @Get(':id/pdf')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener PDF de la factura por ID' })
  @ApiResponse({ status: 200, description: 'PDF de la factura' })
  @ApiResponse({ status: 404, description: 'PDF de la factura no encontrado' })
  @ApiParam({ name: 'id', description: 'ID de la factura (UUID)', type: 'string' })
  async getInvoicePdf(@Param('id') facturaId: string, @Res() res: Response, @Req() req: AuthenticatedRequest) {
    const establecimientoId = req.user.establecimiento_id;

    const pdfBuffer = await this.facturasService.getInvoicePdf(facturaId, establecimientoId);

    if (!pdfBuffer) {
      throw new NotFoundException('PDF de la factura no encontrado o no pertenece a tu establecimiento.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=factura_${facturaId}.pdf`);
    res.send(pdfBuffer);
  }
}