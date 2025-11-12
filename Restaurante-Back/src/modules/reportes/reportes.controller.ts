import { Controller, Get, Query, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { Response } from 'express'; 
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { GetSalesReportDto } from './dto/get-sales-report.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { EstadoPedido } from '../pedidos/entities/pedido.entity';
import { EstadoCocina } from '../pedidos/entities/pedido-item.entity';
import { ReporteVentasDto } from './dto/reporte-ventas.dto'; 

@ApiTags('Reportes')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('ventas')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtener reporte de ventas detallado' })
  @ApiQuery({ name: 'fechaInicio', type: 'string', format: 'date', required: false, description: 'Fecha de inicio del reporte (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fechaFin', type: 'string', format: 'date', required: false, description: 'Fecha de fin del reporte (YYYY-MM-DD)' })
  @ApiQuery({ name: 'usuarioCajeroId', type: 'string', format: 'uuid', required: false, description: 'Filtrar por ID de usuario cajero' })
  @ApiQuery({ name: 'limit', type: 'number', required: false, description: 'Límite de registros para el detalle de facturas' })
  @ApiQuery({ name: 'offset', type: 'number', required: false, description: 'Número de registros a saltar para el detalle de facturas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Reporte de ventas generado exitosamente', 
    type: ReporteVentasDto, 
    schema: { 
      example: {
        fechaReporte: '2023-10-27 10:00:00',
        filtrosAplicados: {
          fechaInicio: '2023-10-01',
          fechaFin: '2023-10-31',
          limit: 50,
          offset: 0
        },
        resumenFinanciero: { totalVentas: 1234.56, totalImpuestos: 123.45, totalDescuentos: 10.00, totalPropina: 50.00, totalNeto: 1091.11 },
        ventasPorMedioPago: [{ medio: 'Efectivo', total: 500.00 }, { medio: 'Tarjeta Crédito', total: 734.56 }],
        ventasPorCategoria: [{ categoria: 'Hamburguesas', total: 800.00 }],
        topProductosVendidos: [{ nombre: 'Hamburguesa Clásica', cantidad: 5, total: 250.00 }],
        ventasPorDiaHora: [ 
          { diaSemana: 2, horaDia: 12, totalVentas: 300.50 }, 
          { diaSemana: 2, horaDia: 13, totalVentas: 500.00 },
        ],
        ventasPorDia: [ 
          { fecha: '2023-10-26', total: 950.00 },
          { fecha: '2023-10-27', total: 1234.56 },
        ],
        detalleFacturas: {
          total: 150,
          limit: 50,
          offset: 0,
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              fecha_hora_factura: '2023-10-27 09:30:00',
              total_factura: 150.00,
              usuarioCajero: 'Juan Pérez',
              tipo_factura: 'TOTAL',
              pedidosAsociados: [ { pedidoId: 'abcd-1234', montoAplicado: 150.00 } ]
            }
          ]
        }
      }
    }
  })
  async getSalesReport(@Req() req: AuthenticatedRequest, @Query() filters: GetSalesReportDto): Promise<any> {
    filters.establecimientoId = req.user.establecimiento_id;
    return this.reportesService.getSalesReport(filters);
  }

  @Get('inventario')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Obtener reporte de inventario (stock actual)' })
  @ApiResponse({ status: 200, description: 'Reporte de inventario generado exitosamente', schema: { example: {
    fechaReporte: '2023-10-27 10:00:00',
    establecimientoId: 'uuid-del-establecimiento',
    resumenInventario: { totalIngredientes: 10, itemsBajoStock: 2, valorTotalInventario: 500.00 },
    detalleInventario: [{ id: 'uuid-ingrediente', nombre: 'Tomate', stockActual: 10.00, unidadMedida: 'kg', estado: 'Suficiente' }]
  }}})
  async getInventoryReport(@Req() req: AuthenticatedRequest): Promise<any> {
    return this.reportesService.getInventoryReport(req.user.establecimiento_id);
  }

  @Get('pedidos-estado')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.COCINERO, RoleName.CAJERO, RoleName.MESERO, RoleName.DOMICILIARIO)
  @ApiOperation({ summary: 'Obtener reporte de pedidos por estado (para monitoreo de cocina/mesas)' })
  @ApiQuery({ name: 'estadoPedido', enum: EstadoPedido, required: false, description: 'Filtrar pedidos por su estado general' })
  @ApiQuery({ name: 'estadoCocinaItem', enum: EstadoCocina, required: false, description: 'Filtrar pedidos que contienen ítems en un estado de cocina específico' })
  @ApiResponse({ status: 200, description: 'Reporte de pedidos por estado generado exitosamente', schema: { example: {
    fechaReporte: '2023-10-27 10:00:00',
    establecimientoId: 'uuid-del-establecimiento',
    resumenPedidos: { totalPedidos: 5, pedidosAbiertos: 3, pedidosEnPreparacion: 1, pedidosListos: 1 },
    detallePedidos: [{
      id: 'uuid-pedido', tipoPedido: 'MESA', estadoPedido: 'ABIERTO', mesa: 'Mesa 1',
      items: [{ productoNombre: 'Hamburguesa', estadoCocina: 'EN_PREPARACION', tiempoEnEstadoCocina: 15 }]
    }]
  }}})
  async getOrdersStatusReport(
    @Req() req: AuthenticatedRequest,
    @Query('estadoPedido') estadoPedido?: EstadoPedido,
    @Query('estadoCocinaItem') estadoCocinaItem?: EstadoCocina,
  ): Promise<any> {
    return this.reportesService.getOrdersStatusReport(req.user.establecimiento_id, estadoPedido, estadoCocinaItem);
  }

   @Get('pdf/ticket-z')
    @HttpCode(HttpStatus.OK)
    @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
    @ApiOperation({ summary: 'Generar reporte PDF de cierre de caja (Ticket Z)' })
    @ApiQuery({ name: 'cierreCajaId', type: 'string', format: 'uuid', required: true, description: 'ID del cierre de caja a reportar' })
    @ApiResponse({ status: 200, description: 'Reporte Ticket Z generado exitosamente', content: { 'application/pdf': {} }})
    async generarTicketZPdf(
        @Query('cierreCajaId') cierreCajaId: string,
        @Res() res: Response,
    ): Promise<void> {
        const pdfStream = await this.reportesService.generarTicketZPdf(cierreCajaId);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket_z_${cierreCajaId}.pdf`);

        pdfStream.pipe(res);
    }


    @Get('pdf/ticket-x')
    @HttpCode(HttpStatus.OK)
    @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
    @ApiOperation({ summary: 'Generar reporte PDF de corte de caja parcial (Ticket X)' })
    @ApiResponse({ status: 200, description: 'Reporte Ticket X generado exitosamente', content: { 'application/pdf': {} }})
    async generarTicketXPdf(
        @Req() req: AuthenticatedRequest,
        @Res() res: Response,
    ): Promise<void> {
        const { establecimiento_id, id } = req.user;
        const pdfStream = await this.reportesService.generarTicketXPdf(establecimiento_id, id);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket_x_${new Date().getTime()}.pdf`);

        pdfStream.pipe(res);
    }
}
