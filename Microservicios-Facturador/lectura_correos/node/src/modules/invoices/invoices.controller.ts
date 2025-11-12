import { 
  Controller, 
  Get, 
  Param, 
  ParseIntPipe, 
  Query, 
  Res, 
  NotFoundException,
  UseGuards, 
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { FacturaDto } from './dto/invoice.dto'; 
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express'; 
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserNit } from 'src/common/decorators/user-nit.decorator';


@ApiTags('Facturas')
@ApiBearerAuth('JWT-Auth')
@UseGuards(JwtAuthGuard)
@Controller('facturas')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}


 @Get('clasificadas')
  @ApiOperation({ summary: 'Obtener facturas clasificadas con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de facturas por página', example: 100 })
  @ApiResponse({ status: 200, description: 'Lista de facturas clasificadas.', type: [FacturaDto] })
  async findClassified(
    @TenantId() tenantId: string,
    @UserNit() userNit: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number, 
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number, 
  ): Promise<any> {
    const currentPage = page || 1;
    const currentLimit = limit || 100;    
    const invoices = await this.invoicesService.findClassifiedInvoices(tenantId, userNit, currentPage, currentLimit);
    return invoices;
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las facturas con la categoría del proveedor asociada (sin XML/PDF pesado por defecto)' })
  @ApiResponse({ status: 200, description: 'Lista de facturas.', type: [FacturaDto] })
  async findAll(@TenantId() tenantId: string): Promise<FacturaDto[]> { 
    const invoices = await this.invoicesService.findAllInvoices(tenantId); 
    return invoices as FacturaDto[]; 
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una factura por ID con la categoría del proveedor asociada' })
  @ApiResponse({ status: 200, description: 'Detalles de la factura.', type: FacturaDto })
  @ApiResponse({ status: 404, description: 'Factura no encontrada.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @TenantId() tenantId: string, 
  ): Promise<FacturaDto> {
    const invoice = await this.invoicesService.findInvoiceById(id, tenantId); 
    return invoice as FacturaDto; 
  }

  @Get('by-supplier/:proveedorId')
  @ApiOperation({ summary: 'Obtener facturas por ID de proveedor (sin XML/PDF pesado por defecto)' })
  @ApiResponse({ status: 200, description: 'Lista de facturas para un proveedor específico.', type: [FacturaDto] })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado o sin facturas.' })
  async findBySupplierId(
    @Param('proveedorId') proveedorId: string,
    @TenantId() tenantId: string,
  ): Promise<FacturaDto[]> {
    const invoices = await this.invoicesService.findInvoicesBySupplierId(proveedorId, false, false, tenantId);
    if (!invoices || invoices.length === 0) {
      throw new NotFoundException(`No se encontraron facturas para el proveedor con ID "${proveedorId}".`);
    }
    return invoices as FacturaDto[];
  }

  @Get(':id/xml')
  @ApiOperation({ summary: 'Obtener el contenido XML de una factura por ID' })
  @ApiResponse({ status: 200, description: 'Contenido XML de la factura.' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada.' })
  @ApiResponse({ status: 204, description: 'XML no disponible para esta factura.' })
  async getXml(
    @Param('id', ParseIntPipe) id: number, 
    @Res() res: Response,
    @TenantId() tenantId: string,
  ): Promise<void> {
    const xml = await this.invoicesService.getInvoiceXml(id, tenantId);
    if (!xml) {
      res.status(204).send();
      return;
    }
    res.set({ 'Content-Type': 'application/xml' });
    res.send(xml);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Obtener el contenido PDF de una factura por ID' })
  @ApiResponse({ status: 200, description: 'Contenido PDF de la factura.' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada.' })
  @ApiResponse({ status: 204, description: 'PDF no disponible para esta factura.' })
  async getPdf(
    @Param('id', ParseIntPipe) id: number, 
    @Res() res: Response,
    @TenantId() tenantId: string,
  ): Promise<void> {
    const pdf = await this.invoicesService.getInvoicePdf(id, tenantId);
    if (!pdf) {
      res.status(204).send();
      return;
    }
    res.set({ 'Content-Type': 'application/pdf' });
    res.send(pdf);
  }
}