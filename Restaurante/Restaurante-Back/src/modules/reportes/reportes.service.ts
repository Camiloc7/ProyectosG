import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FacturaEntity } from '../facturas/entities/factura.entity';
import { CierreCajaEntity } from '../cierre-caja/entities/cierre-caja.entity';
import { PedidoEntity, EstadoPedido } from '../pedidos/entities/pedido.entity';
import { IngredienteEntity } from '../ingredientes/entities/ingrediente.entity';
import { GetSalesReportDto } from './dto/get-sales-report.dto';
import { ReporteVentasDto } from './dto/reporte-ventas.dto';
import { GastosService } from '../gastos/gastos.service';
import { IngresosExtraService } from '../ingresos-extra/ingresos-extra.service';
import { PagoEntity } from '../pagos/entities/pago.entity';
import { Readable } from 'stream';
import { format, toDate } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
const PDFDocument = require('pdfkit');
const ZONA_HORARIA_COLOMBIA = 'America/Bogota';
const convertToColombiaTime = (dateUTC: Date | string): string => {
    if (!dateUTC) return 'N/A';
    const date = toDate(dateUTC);
    const zonedDate = toZonedTime(date, ZONA_HORARIA_COLOMBIA);
    return format(zonedDate, 'yyyy-MM-dd HH:mm:ss');
};
function formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
    }).format(amount);
}
@Injectable()
export class ReportesService {
    private readonly PAGE_WIDTH = 227;
    private readonly MARGIN = 10;
    private readonly TOTAL_CONTENT_WIDTH = this.PAGE_WIDTH - 2 * this.MARGIN;
    private readonly LABEL_COL_WIDTH = this.TOTAL_CONTENT_WIDTH * 0.6;
    private readonly MONEY_COL_START = this.MARGIN + this.LABEL_COL_WIDTH;
    private readonly MONEY_COL_WIDTH = this.TOTAL_CONTENT_WIDTH * 0.4;
    private formatDenominations(denominaciones: any): { label: string, value: string }[] {
        if (!denominaciones || typeof denominaciones !== 'object') {
            return [];
        }
        const sortedDenominations = Object.entries(denominaciones)
            .map(([value, count]) => ({ value: parseInt(value, 10), count: count as number }))
            .filter(item => item.count > 0 && !isNaN(item.value))
            .sort((a, b) => b.value - a.value);
        const formattedList: { label: string, value: string }[] = [];
        for (const { value, count } of sortedDenominations) {
            const label = formatMoney(value);
            const totalAmount = value * count;

            formattedList.push({
                label: `${label} x ${count} unidades`,
                value: formatMoney(totalAmount),
            });
        }
        return formattedList;
    }
    constructor(
        @InjectRepository(FacturaEntity)
        private readonly facturaRepository: Repository<FacturaEntity>,
        @InjectRepository(CierreCajaEntity)
        private readonly cierreCajaRepository: Repository<CierreCajaEntity>,
        @InjectRepository(PedidoEntity)
        private readonly pedidoRepository: Repository<PedidoEntity>,
        @InjectRepository(IngredienteEntity)
        private readonly ingredienteRepository: Repository<IngredienteEntity>,
        @InjectRepository(PagoEntity)
        private readonly pagoRepository: Repository<PagoEntity>,
        private readonly gastosService: GastosService,
        private readonly ingresosExtraService: IngresosExtraService,
    ) { }

    private getColombiaDateForBetween(dateString: string, isEndOfDay: boolean): Date {
        const baseDate = new Date(dateString);
        const zonedDate = toZonedTime(baseDate, ZONA_HORARIA_COLOMBIA);

        if (isEndOfDay) {
            zonedDate.setDate(zonedDate.getDate() + 1);
        }

        return zonedDate;
    }

    private writeRow(doc: any, label: string, value: number | string, yPos: number, isTotal = false, indent = 0): number {
        doc.save();
        let lineHeight = 12;
        if (isTotal) {
            doc.font('Helvetica-Bold').fontSize(10);
            lineHeight = 14;
        } else {
            doc.font('Helvetica').fontSize(9);
        }

        const effectiveMargin = this.MARGIN + indent;
        const effectiveLabelWidth = this.LABEL_COL_WIDTH - indent;
        const textHeight = doc.heightOfString(label, { width: effectiveLabelWidth });

        doc.text(label, effectiveMargin, yPos, { width: effectiveLabelWidth });
        doc.text(
            typeof value === 'number' ? formatMoney(value) : value,
            this.MONEY_COL_START,
            yPos,
            {
                width: this.MONEY_COL_WIDTH,
                align: 'right',
            },
        );
        doc.restore();
        return yPos + Math.max(textHeight, lineHeight) + 2;
    }

    private checkPageBreak(doc: any, currentY: number, requiredSpace = 50): number {
        if (currentY > doc.page.height - requiredSpace) {
            doc.addPage({
                size: [this.PAGE_WIDTH, 800],
                margins: { top: 10, bottom: 10, left: 10, right: 10 },
            });
            doc.font('Helvetica').fontSize(9);
            return 30;
        }
        return currentY;
    }

    private async getProductsCount(
        establecimientoId: string,
        usuarioCajeroId: string,
        fechaApertura: Date,
        fechaCierre: Date,
        isCierre: boolean,
        cierreCajaId?: string,
    ): Promise<any[]> {
        let qb = this.facturaRepository.createQueryBuilder('factura')
            .innerJoin('factura.facturaPedidos', 'facturaPedido')
            .innerJoin('facturaPedido.pedido', 'pedido')
            .innerJoin('pedido.pedidoItems', 'pedidoItem')
            .innerJoin('pedidoItem.producto', 'producto')
            .select('producto.nombre', 'nombre')
            .addSelect('SUM(pedidoItem.cantidad)', 'cantidad')
            .groupBy('producto.nombre')
            .orderBy('cantidad', 'DESC');

        if (isCierre) {
            qb = qb.where('factura.cierre_caja_id = :cierreCajaId', { cierreCajaId });
        } else {
            qb = qb.where('factura.establecimiento_id = :establecimientoId', { establecimientoId })
                .andWhere('factura.usuario_cajero_id = :usuarioCajeroId', { usuarioCajeroId })
                .andWhere('factura.cierre_caja_id IS NULL')
                .andWhere('factura.fecha_hora_factura BETWEEN :fechaApertura AND :fechaCierre', {
                    fechaApertura,
                    fechaCierre,
                });
        }
        return qb.getRawMany();
    }

    async getSalesReport(query: GetSalesReportDto): Promise<ReporteVentasDto> {
        const { establecimientoId, fechaInicio, fechaFin, usuarioCajeroId, limit = 50, offset = 0 } = query;
        const parsedFechaInicio = fechaInicio ? this.getColombiaDateForBetween(fechaInicio, false) : undefined;
        const parsedFechaFin = fechaFin ? this.getColombiaDateForBetween(fechaFin, true) : undefined;

        const qbFacturas = this.facturaRepository.createQueryBuilder('factura')
            .leftJoinAndSelect('factura.pagos', 'pago')
            .leftJoinAndSelect('pago.cuentaBancaria', 'cuentaBancaria')
            .leftJoinAndSelect('cuentaBancaria.medio_pago_asociado', 'medioPago')
            .leftJoinAndSelect('factura.facturaPedidos', 'facturaPedido')
            .leftJoinAndSelect('facturaPedido.pedido', 'pedido')
            .leftJoinAndSelect('pedido.pedidoItems', 'pedidoItem')
            .leftJoinAndSelect('pedidoItem.producto', 'producto')
            .leftJoinAndSelect('producto.categoria', 'categoria')
            .leftJoinAndSelect('factura.usuarioCajero', 'cajero')
            .where('factura.establecimiento_id = :establecimientoId', { establecimientoId })
            .andWhere('pedido.estado IN (:...estadosValidos)', {
                estadosValidos: [
                    EstadoPedido.CERRADO,
                    EstadoPedido.PAGADO,
                    EstadoPedido.ENTREGADO,
                ],
            });

        if (parsedFechaInicio && parsedFechaFin) {
            qbFacturas.andWhere('factura.fecha_hora_factura BETWEEN :start AND :end', { start: parsedFechaInicio, end: parsedFechaFin });
        }
        if (usuarioCajeroId) {
            qbFacturas.andWhere('cajero.id = :cajeroId', { cajeroId: usuarioCajeroId });
        }
        const adjustedTimeColumn = `CONVERT_TZ(factura.fecha_hora_factura, 'UTC', '${ZONA_HORARIA_COLOMBIA}')`;
        const [
            facturas,
            ventasPorCategoria,
            topProductosVendidos,
            ventasPorDiaHoraResult,
            ventasPorDiaResult
        ] = await Promise.all([
            qbFacturas.getMany(),
            qbFacturas.clone()
                .select('categoria.nombre', 'categoria')
                .addSelect('SUM(pedidoItem.cantidad * pedidoItem.precio_unitario_al_momento_venta)', 'total')
                .groupBy('categoria')
                .orderBy('total', 'DESC')
                .getRawMany(),
            qbFacturas.clone()
                .select('producto.nombre', 'nombre')
                .addSelect('SUM(pedidoItem.cantidad)', 'cantidad')
                .addSelect('SUM(pedidoItem.cantidad * pedidoItem.precio_unitario_al_momento_venta)', 'total')
                .groupBy('nombre')
                .orderBy('total', 'DESC')
                .take(10)
                .getRawMany(),
            qbFacturas.clone()
                .select(`DAYOFWEEK(${adjustedTimeColumn})`, 'diaSemana')
                .addSelect(`HOUR(${adjustedTimeColumn})`, 'horaDia')
                .addSelect('SUM(factura.total_factura)', 'totalVentas')
                .groupBy('diaSemana')
                .addGroupBy('horaDia')
                .orderBy('diaSemana', 'ASC')
                .addOrderBy('horaDia', 'ASC')
                .getRawMany(),
            qbFacturas.clone()
                .select(`DATE(${adjustedTimeColumn})`, 'fecha')
                .addSelect('SUM(factura.total_factura)', 'total')
                .groupBy('fecha')
                .orderBy('fecha', 'ASC')
                .getRawMany(),
        ]);
        let totalVentas = 0;
        let totalImpuestos = 0;
        let totalDescuentos = 0;
        let totalPropina = 0;
        const ventasPorMedioPago: { [key: string]: number } = {};
        facturas.forEach(factura => {
            totalVentas += Number(factura.total_factura) || 0;
            totalImpuestos += Number(factura.impuestos) || 0;
            totalDescuentos += Number(factura.descuentos) || 0;
            totalPropina += Number(factura.propina) || 0;
            factura.pagos.forEach(pago => {
                const medioPago = pago.cuentaBancaria?.medio_pago_asociado?.nombre || 'Desconocido';
                ventasPorMedioPago[medioPago] = (ventasPorMedioPago[medioPago] || 0) + (Number(pago.monto_pagado) || 0);
            });
        });
        const detalleFacturasPaginado = facturas.slice(offset, offset + limit).map(f => ({
            id: f.id,
            fecha_hora_factura: convertToColombiaTime(f.fecha_hora_factura),
            total_factura: Number(f.total_factura) || 0,
            usuarioCajero: f.usuarioCajero ? `${f.usuarioCajero.nombre} ${f.usuarioCajero.apellido}` : 'Desconocido',
            tipo_factura: f.tipo_factura,
            pedidosAsociados: f.facturaPedidos.map(fp => ({
                pedidoId: fp.pedido_id,
                montoAplicado: Number(fp.monto_aplicado) || 0,
            })),
        }));
        return {
            fechaReporte: convertToColombiaTime(new Date()),
            filtrosAplicados: query,
            resumenFinanciero: {
                totalVentas: totalVentas,
                totalImpuestos: totalImpuestos,
                totalDescuentos: totalDescuentos,
                totalPropina: totalPropina,
                totalNeto: totalVentas - totalImpuestos + totalDescuentos + totalPropina,
            },
            ventasPorMedioPago: Object.entries(ventasPorMedioPago).map(([medio, total]) => ({ medio, total })),
            ventasPorCategoria: ventasPorCategoria.map(r => ({ categoria: r.categoria, total: parseFloat(r.total || 0) })),
            topProductosVendidos: topProductosVendidos.map(r => ({ nombre: r.nombre, cantidad: parseInt(r.cantidad || 0), total: parseFloat(r.total || 0) })),
            ventasPorDiaHora: ventasPorDiaHoraResult.map(r => ({
                diaSemana: parseInt(r.diaSemana),
                horaDia: parseInt(r.horaDia),
                totalVentas: parseFloat(r.totalVentas || 0),
            })),
            ventasPorDia: ventasPorDiaResult.map(r => ({
                fecha: r.fecha,
                total: parseFloat(r.total || 0),
            })),
            detalleFacturas: {
                total: facturas.length,
                limit,
                offset,
                data: detalleFacturasPaginado,
            },
        };
    }

    async getInventoryReport(establecimientoId: string): Promise<any> {
        const ingredientes = await this.ingredienteRepository.find({
            where: { establecimiento_id: establecimientoId },
            order: { nombre: 'ASC' }
        });
        const inventarioDetalle = ingredientes.map(ing => {
            const stockActual = Number(ing.stock_actual) || 0;
            const stockMinimo = Number(ing.stock_minimo) || 0;
            const costoUnitario = Number(ing.costo_unitario) || 0;
            return {
                id: ing.id,
                nombre: ing.nombre,
                unidadMedida: ing.unidad_medida,
                stockActual: parseFloat(stockActual.toFixed(2)),
                stockMinimo: parseFloat(stockMinimo.toFixed(2)),
                costoUnitario: parseFloat(costoUnitario.toFixed(2)),
                estado: stockActual <= stockMinimo ? 'Bajo Stock' : 'Suficiente',
            };
        });
        const totalValorInventario = inventarioDetalle.reduce((sum, ing) => sum + (ing.stockActual * ing.costoUnitario), 0);
        return {
            fechaReporte: convertToColombiaTime(new Date()),
            establecimientoId,
            resumenInventario: {
                totalIngredientes: inventarioDetalle.length,
                itemsBajoStock: inventarioDetalle.filter(ing => ing.stockActual <= ing.stockMinimo).length,
                valorTotalInventario: parseFloat(totalValorInventario.toFixed(2)),
            },
            detalleInventario: inventarioDetalle,
        };
    }

    async getOrdersStatusReport(establecimientoId: string, estadoPedido?: EstadoPedido, estadoCocinaItem?: string): Promise<any> {
        const pedidos = await this.pedidoRepository.find({
            where: {
                establecimiento_id: establecimientoId,
                ...(estadoPedido && { estado: estadoPedido }),
            },
            relations: ['mesa', 'usuarioCreador', 'pedidoItems', 'pedidoItems.producto', 'pedidoItems.productoConfigurable'],
            order: { fecha_hora_pedido: 'DESC' }
        });
        const pedidosReport = pedidos.map(p => ({
            id: p.id,
            tipoPedido: p.tipo_pedido,
            estadoPedido: p.estado,
            mesa: p.mesa ? p.mesa.numero : 'N/A',
            clienteNombre: p.cliente_nombre || 'N/A',
            usuarioCreador: p.usuarioCreador ? `${p.usuarioCreador.nombre} ${p.usuarioCreador.apellido}` : 'Desconocido',
            fechaHoraPedido: convertToColombiaTime(p.fecha_hora_pedido),
            totalEstimado: parseFloat((Number(p.total_estimado) || 0).toFixed(2)),
            items: p.pedidoItems.map(item => ({
                id: item.id,
                productoNombre: item.producto?.nombre || item.productoConfigurable?.nombre || 'Producto Desconocido',
                cantidad: item.cantidad,
                estadoCocina: item.estado_cocina,
                tiempoEnEstadoCocina: Math.floor((new Date().getTime() - new Date(item.fecha_hora_estado_cocina_cambio).getTime()) / 60000),
                notas: item.notas_item,
            })),
        }));
        let filteredPedidos = pedidosReport;
        if (estadoCocinaItem) {
            filteredPedidos = pedidosReport.filter(p =>
                p.items.some(item => item.estadoCocina === estadoCocinaItem)
            );
        }
        const resumenPedidos = {
            totalPedidos: pedidosReport.length,
            pedidosAbiertos: pedidosReport.filter(p => p.estadoPedido === 'ABIERTO').length,
            pedidosEnPreparacion: pedidosReport.filter(p => p.estadoPedido === 'EN_PREPARACION').length,
            pedidosListos: pedidosReport.filter(p => p.estadoPedido === 'LISTO').length,
        };
        return {
            fechaReporte: convertToColombiaTime(new Date()),
            establecimientoId,
            resumenPedidos,
            detallePedidos: filteredPedidos,
        };
     }
async generarTicketZPdf(cierreCajaId: string): Promise<Readable> {
    const cierre = await this.cierreCajaRepository.findOne({
        where: { id: cierreCajaId },
        relations: ['usuarioCajero', 'establecimiento'],
    });
    if (!cierre) {
        throw new Error('Cierre de caja no encontrado.');
    }
    if (!cierre.fecha_hora_cierre) {
        throw new Error('El cierre de caja no tiene una fecha de cierre registrada (Cierre incompleto).');
    }
    const pagosDelTurno = await this.pagoRepository
        .createQueryBuilder('pago')
        .leftJoinAndSelect('pago.factura', 'factura')
        .leftJoinAndSelect('pago.cuentaBancaria', 'cuentaBancaria')
        .leftJoinAndSelect('cuentaBancaria.medio_pago_asociado', 'medioPago')
        .where('pago.cierre_caja_id = :cierreCajaId', { cierreCajaId: cierre.id })
        .getMany();

    const productosVendidos = await this.getProductsCount(
        cierre.establecimiento_id,
        cierre.usuario_cajero_id,
        cierre.fecha_hora_apertura,
        cierre.fecha_hora_cierre,
        true,
        cierre.id,
    );
    const pagosPorMedioCuenta: { [key: string]: { [key: string]: number } } = {};
    const pagosPorFactura: { [key: string]: typeof pagosDelTurno } = {};
    let totalPagosEfectivo = 0;
    let totalPropinaRecaudada = 0; // <--- Usaremos esta variable en el resumen
    let totalRecaudadoFinal = 0;

    pagosDelTurno.forEach((pago) => {
        if (pago.factura?.id) {
            if (!pagosPorFactura[pago.factura.id]) pagosPorFactura[pago.factura.id] = [];
            pagosPorFactura[pago.factura.id].push(pago);
        }
    });

    for (const facturaId in pagosPorFactura) {
        const pagos = pagosPorFactura[facturaId];
        const factura = pagos[0].factura;
        const propinaDeFactura = Number(factura.propina) || 0;
        totalPropinaRecaudada += propinaDeFactura;
        const totalMontoPagadoBase = pagos.reduce((s, p) => s + Number(p.monto_recibido || 0), 0);
        pagos.forEach((pago) => {
            const montoRecibidoBase = Number(pago.monto_recibido) || 0;
            let montoPropinaProporcional = 0;
            if (totalMontoPagadoBase > 0) {
                const proporcion = montoRecibidoBase / totalMontoPagadoBase;
                montoPropinaProporcional = propinaDeFactura * proporcion;
            }
            const montoTotalRecaudado = montoRecibidoBase + montoPropinaProporcional;
            totalRecaudadoFinal += montoTotalRecaudado;

            const esEfectivo = pago.cuentaBancaria?.medio_pago_asociado?.es_efectivo || false;
            const medioPagoNombre = esEfectivo
                ? 'Efectivo'
                : pago.cuentaBancaria?.medio_pago_asociado?.nombre || 'Medio Desconocido';
            const cuentaNombre = esEfectivo
                ? 'Caja Principal'
                : pago.cuentaBancaria
                    ? `${pago.cuentaBancaria.nombre_banco} - ${pago.cuentaBancaria.tipo_cuenta}`
                    : 'Cuenta Desconocida';

            if (esEfectivo) totalPagosEfectivo += montoTotalRecaudado;

            if (!pagosPorMedioCuenta[medioPagoNombre]) pagosPorMedioCuenta[medioPagoNombre] = {};
            pagosPorMedioCuenta[medioPagoNombre][cuentaNombre] =
                (pagosPorMedioCuenta[medioPagoNombre][cuentaNombre] || 0) + montoTotalRecaudado;
        });
    }
    const totalPagos = totalRecaudadoFinal;
    const totalGastos = await this.gastosService.sumByCierreCajaId(cierre.id);
    const totalIngresosExtra = await this.ingresosExtraService.sumByCierreCajaId(cierre.id);

    const doc = new PDFDocument({
        size: [this.PAGE_WIDTH, 800],
        margins: { top: 10, bottom: 10, left: 10, right: 10 },
    });
    doc.font('Helvetica').fontSize(9);
    let y = 30;

    doc.font('Helvetica-Bold')
        .fontSize(10)
        .text(`${cierre.establecimiento.nombre.toLocaleUpperCase()}`, this.MARGIN, y, { align: 'center' });
    y += 15;
    doc.text('TICKET Z - CIERRE DE CAJA', this.MARGIN, y, { align: 'center' });
    y += 15;
    doc.font('Helvetica').fontSize(9);
    doc.text('----------------------------------', this.MARGIN, y, { align: 'center' });
    y += 15;
    doc.text(`Fecha de Cierre: ${convertToColombiaTime(cierre.fecha_hora_cierre) || 'N/A'}`, this.MARGIN, y);
    y += 12;
    doc.text(`ID de Cierre:`, this.MARGIN, y);
    y += 12;
    doc.text(`${cierre.id}`, this.MARGIN, y);
    y += 12;
    doc.text(`Cajero: ${cierre.usuarioCajero.nombre} ${cierre.usuarioCajero.apellido}`, this.MARGIN, y);
    y += 15;
    y = this.checkPageBreak(doc, y);
    doc.font('Helvetica-Bold').text('DENOMINACIONES DE APERTURA:', this.MARGIN, y);
    y += 12;
    doc.font('Helvetica');
    const denominacionesApertura = this.formatDenominations(cierre.denominaciones_apertura);
    if (denominacionesApertura.length === 0) {
        y = this.writeRow(doc, 'No se registraron denominaciones.', '', y, false, 5);
    } else {
        denominacionesApertura.forEach(item => {
            y = this.writeRow(doc, item.label, item.value, y, false, 5);
        });
    }
    y = this.writeRow(doc, 'SALDO INICIAL TOTAL:', Number(cierre.saldo_inicial_caja), y, true);
    y += 10;
    doc.text('---', this.MARGIN, y, { align: 'center' });
    y += 10;
    doc.font('Helvetica-Bold').text('RESUMEN FINANCIERO:', this.MARGIN, y);
    y += 12;
    doc.font('Helvetica');
    const resumen = [
        { label: 'Ventas Totales (sin propinas):', value: Number(cierre.total_ventas_brutas) },
        { label: 'Descuentos:', value: Number(cierre.total_descuentos) },
        { label: 'Total Neto de Ventas:', value: Number(cierre.total_neto_ventas) },
        { label: 'Total Recaudado (Pagos):', value: totalPagos },
        { label: 'Total Propina:', value: totalPropinaRecaudada }, 
    ];
    resumen.forEach((item) => {
        y = this.writeRow(doc, item.label, item.value, y);
    });
    doc.text('---', this.MARGIN, y, { align: 'center' });
    y += 10;
    doc.font('Helvetica-Bold').text('DETALLE DE RECAUDO POR PAGO (INCL. PROPINA):', this.MARGIN, y);
    y += 30;
    doc.font('Helvetica');
    for (const medioPago in pagosPorMedioCuenta) {
        const totalMedioPago = Object.values(pagosPorMedioCuenta[medioPago]).reduce((a, b) => a + b, 0);
        doc.font('Helvetica-Bold');
        y = this.writeRow(doc, `> ${medioPago}:`, totalMedioPago, y);
        doc.font('Helvetica');
        for (const cuenta in pagosPorMedioCuenta[medioPago]) {
            y = this.writeRow(doc, `- ${cuenta}:`, pagosPorMedioCuenta[medioPago][cuenta], y, false, 10);
        }
    }
    doc.text('---', this.MARGIN, y, { align: 'center' });
    y += 10;
    y = this.checkPageBreak(doc, y);
    doc.font('Helvetica-Bold').text('DENOMINACIONES DE CIERRE CONTADAS:', this.MARGIN, y);
    y += 12;
    doc.font('Helvetica');
    const denominacionesCierre = this.formatDenominations(cierre.denominaciones_cierre);
    if (denominacionesCierre.length === 0) {
        y = this.writeRow(doc, 'No se registraron denominaciones.', '', y, false, 5);
    } else {
        denominacionesCierre.forEach(item => {
            y = this.writeRow(doc, item.label, item.value, y, false, 5);
        });
    }
    y = this.writeRow(doc, 'SALDO CONTADO POR DENOMINACIONES:', Number(cierre.saldo_final_contado), y, true);
    y += 10;    
    doc.font('Helvetica-Bold').text('CUADRE DE CAJA (SOLO EFECTIVO):', this.MARGIN, y);
    y += 12;
  doc.font('Helvetica');
const cuadre = [
    { label: 'Saldo Inicial de Caja:', value: Number(cierre.saldo_inicial_caja) },
    { label: 'Recaudo en Efectivo (Venta + Propina):', value: totalPagosEfectivo }, 
    { label: 'Ingresos Extra:', value: totalIngresosExtra },
    { label: 'Gastos Operacionales:', value: totalGastos * -1 },
];
cuadre.forEach((item) => {
    y = this.writeRow(doc, item.label, item.value, y);
});
doc.text('---', this.MARGIN, y, { align: 'center' });
y += 10;
const saldoEsperadoCorregido =
    Number(cierre.saldo_inicial_caja) + totalPagosEfectivo + totalIngresosExtra - totalGastos;
const diferenciaCalculada = Number(cierre.saldo_final_contado) - saldoEsperadoCorregido;

    y = this.writeRow(doc, `SALDO ESPERADO:`, saldoEsperadoCorregido, y, true);
    y = this.writeRow(doc, `SALDO CONTADO:`, Number(cierre.saldo_final_contado), y, true);
    y = this.writeRow(doc, `DIFERENCIA:`, diferenciaCalculada, y, true);
    y += 5;
    
    doc.text('----------------------------------', this.MARGIN, y, { align: 'center' });
    y += 12;
    doc.font('Helvetica-Bold').text('PRODUCTOS VENDIDOS:', this.MARGIN, y);
    y += 15;
    doc.font('Helvetica').fontSize(9);
    productosVendidos.forEach((item) => {
        y = this.checkPageBreak(doc, y);
        const nombre = item.nombre;
        const cantidad = parseInt(item.cantidad);
        const cantidadText = `${cantidad} und.`;
        doc.text(nombre, this.MARGIN, y, {
            width: this.LABEL_COL_WIDTH,
        });
        doc.text(cantidadText, this.MONEY_COL_START, y, {
            width: this.MONEY_COL_WIDTH,
            align: 'right',
        });
        y += doc.heightOfString(nombre, { width: this.LABEL_COL_WIDTH }) + 2;
    });
    doc.text('----------------------------------', this.MARGIN, y, { align: 'center' });
    y += 12;
    doc.text('¡Cierre de Caja Finalizado!', this.MARGIN, y, { align: 'center' });
    doc.end();

    return doc as unknown as Readable;
}












    async generarTicketXPdf(establecimientoId: string, usuarioCajeroId: string): Promise<Readable> {
        const cierreActivo = await this.cierreCajaRepository.findOne({
            where: {
                establecimiento_id: establecimientoId,
                usuario_cajero_id: usuarioCajeroId,
                cerrado: false,
            },
            relations: ['establecimiento', 'usuarioCajero'],
        });
        if (!cierreActivo) throw new Error('No hay un turno de caja activo.');
        const fechaSimulada = new Date();
        const pagosDelTurno = await this.pagoRepository
            .createQueryBuilder('pago')
            .leftJoinAndSelect('pago.factura', 'factura')
            .leftJoinAndSelect('pago.cuentaBancaria', 'cuentaBancaria')
            .leftJoinAndSelect('cuentaBancaria.medio_pago_asociado', 'medioPago')
            .where('factura.establecimiento_id = :establecimientoId', { establecimientoId })
            .andWhere('factura.usuario_cajero_id = :usuarioCajeroId', { usuarioCajeroId })
            .andWhere('pago.cierre_caja_id IS NULL')
            .andWhere('pago.fecha_hora_pago BETWEEN :fechaApertura AND :fechaCierre', {
                fechaApertura: cierreActivo.fecha_hora_apertura,
                fechaCierre: fechaSimulada,
            })
            .getMany();
        const productosVendidosParcial = await this.getProductsCount(
            establecimientoId,
            usuarioCajeroId,
            cierreActivo.fecha_hora_apertura,
            fechaSimulada,
            false,
        );
        const pagosPorMedioCuenta: { [key: string]: { [key: string]: number } } = {};
        let totalPagosEfectivo = 0;
        let totalPropinaRecaudada = 0;
        let totalPagosRecaudadosBase = 0;
        let totalRecaudadoFinal = 0;
        const pagosPorFactura: { [key: string]: typeof pagosDelTurno } = {};

        pagosDelTurno.forEach((pago) => {
            if (pago.factura?.id) {
                if (!pagosPorFactura[pago.factura.id]) pagosPorFactura[pago.factura.id] = [];
                pagosPorFactura[pago.factura.id].push(pago);
            }
        });

        for (const facturaId in pagosPorFactura) {
            const pagos = pagosPorFactura[facturaId];
            const factura = pagos[0].factura;
            const propinaDeFactura = Number(factura.propina) || 0;
            totalPropinaRecaudada += propinaDeFactura;

            const totalMontoPagadoBase = pagos.reduce((s, p) => s + Number(p.monto_recibido || 0), 0);
            totalPagosRecaudadosBase += totalMontoPagadoBase;

            pagos.forEach((pago) => {
                const montoRecibidoBase = Number(pago.monto_recibido) || 0;
                let montoPropinaProporcional = 0;
                if (totalMontoPagadoBase > 0) {
                    const proporcion = montoRecibidoBase / totalMontoPagadoBase;
                    montoPropinaProporcional = propinaDeFactura * proporcion;
                }
                const montoTotalRecaudado = montoRecibidoBase + montoPropinaProporcional;
                totalRecaudadoFinal += montoTotalRecaudado;
                const esEfectivo = pago.cuentaBancaria?.medio_pago_asociado?.es_efectivo || false;
                const medioPagoNombre = esEfectivo ? 'Efectivo' : (pago.cuentaBancaria?.medio_pago_asociado?.nombre || 'Medio Desconocido');
                const cuentaNombre = esEfectivo
                    ? 'Caja Principal'
                    : pago.cuentaBancaria
                        ? `${pago.cuentaBancaria.nombre_banco} - ${pago.cuentaBancaria.tipo_cuenta}`
                        : 'Cuenta Desconocida';

                if (esEfectivo) totalPagosEfectivo += montoTotalRecaudado;

                if (!pagosPorMedioCuenta[medioPagoNombre]) pagosPorMedioCuenta[medioPagoNombre] = {};
                pagosPorMedioCuenta[medioPagoNombre][cuentaNombre] =
                    (pagosPorMedioCuenta[medioPagoNombre][cuentaNombre] || 0) + montoTotalRecaudado;
            });
        }
        const totalGastos = await this.gastosService.sumByCierreCajaId(cierreActivo.id);
        const totalIngresosExtra = await this.ingresosExtraService.sumByCajaActiva(cierreActivo.id);
        const saldoEsperadoActual =
            Number(cierreActivo.saldo_inicial_caja) + totalPagosEfectivo + totalIngresosExtra - totalGastos;
        const doc = new PDFDocument({
            size: [this.PAGE_WIDTH, 800],
            margins: { top: 10, bottom: 10, left: 10, right: 10 },
        });
        doc.font('Helvetica').fontSize(9);
        let y = 30;
        doc.font('Helvetica-Bold')
            .fontSize(10)
            .text(`${cierreActivo.establecimiento.nombre.toLocaleUpperCase()}`, this.MARGIN, y, { align: 'center' });
        y += 15;
        doc.text('TICKET X - CORTE PARCIAL', this.MARGIN, y, { align: 'center' });
        y += 15;
        doc.font('Helvetica').fontSize(9); doc.text('----------------------------------', this.MARGIN, y, { align: 'center' });
        y += 15;
        doc.text(`Fecha de Corte: ${convertToColombiaTime(fechaSimulada)}`, this.MARGIN, y);
        y += 12;
        doc.text(`ID de Turno:`, this.MARGIN, y);
        y += 12;
        doc.text(`${cierreActivo.id}`, this.MARGIN, y);
        y += 12;
        doc.text(`Cajero: ${cierreActivo.usuarioCajero.nombre} ${cierreActivo.usuarioCajero.apellido}`, this.MARGIN, y);
        y += 15;
        doc.text('---', this.MARGIN, y, { align: 'center' });
        y += 10;
        y = this.writeRow(doc, 'TOTAL RECAUDADO (VENTAS + PROPINA):', totalRecaudadoFinal, y, true);
        y = this.writeRow(doc, 'Ventas sin Propina:', totalPagosRecaudadosBase, y);
        y = this.writeRow(doc, 'Propina Recaudada:', totalPropinaRecaudada, y);
        doc.text('---', this.MARGIN, y, { align: 'center' });
        y += 10;
        doc.font('Helvetica-Bold').text('DETALLE DE RECAUDO POR PAGO (INCL. PROPINA):', this.MARGIN, y);
        y += 30;
        doc.font('Helvetica');
        for (const medioPago in pagosPorMedioCuenta) {
            const totalMedioPago = Object.values(pagosPorMedioCuenta[medioPago]).reduce((a, b) => a + b, 0);
            doc.font('Helvetica-Bold');
            y = this.writeRow(doc, `> ${medioPago}:`, totalMedioPago, y);
            doc.font('Helvetica');
            for (const cuenta in pagosPorMedioCuenta[medioPago]) {
                y = this.writeRow(doc, `- ${cuenta}:`, pagosPorMedioCuenta[medioPago][cuenta], y, false, 10);
            }
        }
        doc.text('---', this.MARGIN, y, { align: 'center' });
        y += 10;
        doc.font('Helvetica-Bold').text('CUADRE DE CAJA (SOLO EFECTIVO):', this.MARGIN, y);
        y += 12;
        doc.font('Helvetica');
        y = this.writeRow(doc, 'Saldo Inicial de Caja:', Number(cierreActivo.saldo_inicial_caja), y);
        y = this.writeRow(doc, 'Pagos en Efectivo:', totalPagosEfectivo, y);
        y = this.writeRow(doc, 'Ingresos Extra:', totalIngresosExtra, y);
        y = this.writeRow(doc, 'Gastos Operacionales:', totalGastos * -1, y);
        doc.text('---', this.MARGIN, y, { align: 'center' });
        y += 10;
        y = this.writeRow(doc, 'SALDO ESPERADO:', saldoEsperadoActual, y, true);
        y += 5;
        doc.text('----------------------------------', this.MARGIN, y, { align: 'center' });
        y += 12;
        doc.font('Helvetica-Bold').text('PRODUCTOS VENDIDOS:', this.MARGIN, y);
        y += 15;
        doc.font('Helvetica').fontSize(9);
        productosVendidosParcial.forEach((item) => {
            y = this.checkPageBreak(doc, y);
            const nombre = item.nombre;
            const cantidad = parseInt(item.cantidad);
            const cantidadText = `${cantidad} und.`;
            doc.text(nombre, this.MARGIN, y, {
                width: this.LABEL_COL_WIDTH,
            });
            doc.text(cantidadText, this.MONEY_COL_START, y, {
                width: this.MONEY_COL_WIDTH,
                align: 'right',
            });
            y += doc.heightOfString(nombre, { width: this.LABEL_COL_WIDTH }) + 2;
        });
        doc.text('----------------------------------', this.MARGIN, y, { align: 'center' });
        y += 12;
        doc.font('Helvetica-Bold').fontSize(10).text('¡Corte Parcial Generado!', this.MARGIN, y, { align: 'center' });
        doc.font('Helvetica').fontSize(9);
        doc.end();

        return doc as unknown as Readable;
    }
}