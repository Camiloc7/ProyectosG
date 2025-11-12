import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FacturaEntity } from '../facturas/entities/factura.entity';
import { CierreCajaEntity } from '../cierre-caja/entities/cierre-caja.entity';
import { PedidoEntity } from '../pedidos/entities/pedido.entity';
import { IngredienteEntity } from '../ingredientes/entities/ingrediente.entity';
import { GetSalesReportDto } from './dto/get-sales-report.dto';
import { ReporteVentasDto } from './dto/reporte-ventas.dto';
import { EstadoPedido } from '../pedidos/entities/pedido.entity';
const PDFDocument = require('pdfkit');
import { Readable } from 'stream';
import { GastosService } from '../gastos/gastos.service';
import { IngresosExtraService } from '../ingresos-extra/ingresos-extra.service';
import { PagoEntity } from '../pagos/entities/pago.entity';

@Injectable()
export class ReportesService {
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
        async getSalesReport(query: GetSalesReportDto): Promise<ReporteVentasDto> {
                const { establecimientoId, fechaInicio, fechaFin, usuarioCajeroId, limit = 50, offset = 0 } = query;
                const parsedFechaInicio = fechaInicio ? new Date(fechaInicio) : undefined;
                const parsedFechaFin = fechaFin ? new Date(fechaFin) : undefined;
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
                                        EstadoPedido.LISTO,
                                ],
                        });

                if (parsedFechaInicio && parsedFechaFin) {
                        qbFacturas.andWhere('factura.fecha_hora_factura BETWEEN :start AND :end', { start: parsedFechaInicio, end: parsedFechaFin });
                }
                if (usuarioCajeroId) {
                        qbFacturas.andWhere('cajero.id = :cajeroId', { cajeroId: usuarioCajeroId });
                }
                const [facturas, ventasPorCategoria, topProductosVendidos, ventasPorDiaHora] = await Promise.all([
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
                                .select(`DAYOFWEEK(factura.fecha_hora_factura)`, 'diaSemana')
                                .addSelect(`HOUR(factura.fecha_hora_factura)`, 'horaDia')
                                .addSelect('SUM(factura.total_factura)', 'totalVentas')
                                .groupBy('diaSemana')
                                .addGroupBy('horaDia')
                                .orderBy('diaSemana', 'ASC')
                                .addOrderBy('horaDia', 'ASC')
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
                        fecha_hora_factura: f.fecha_hora_factura,
                        total_factura: Number(f.total_factura) || 0,
                        usuarioCajero: f.usuarioCajero ? `${f.usuarioCajero.nombre} ${f.usuarioCajero.apellido}` : 'Desconocido',
                        tipo_factura: f.tipo_factura,
                        pedidosAsociados: f.facturaPedidos.map(fp => ({
                                pedidoId: fp.pedido_id,
                                montoAplicado: Number(fp.monto_aplicado) || 0,
                        })),
                }));
                return {
                        fechaReporte: new Date().toISOString(),
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
                        ventasPorDiaHora: ventasPorDiaHora.map(r => ({
                                diaSemana: parseInt(r.diaSemana),
                                horaDia: parseInt(r.horaDia),
                                totalVentas: parseFloat(r.totalVentas || 0),
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
                        fechaReporte: new Date().toISOString(),
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
                        fechaHoraPedido: p.fecha_hora_pedido,
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
                        fechaReporte: new Date().toISOString(),
                        establecimientoId,
                        resumenPedidos,
                        detallePedidos: filteredPedidos,
                };
        }

           async generarTicketZPdf(cierreCajaId: string): Promise<Readable> {
        const cierre = await this.cierreCajaRepository.findOne({ where: { id: cierreCajaId } });
        if (!cierre) {
            throw new Error('Cierre de caja no encontrado.');
        }
        const totalGastos = await this.gastosService.sumByCierreCajaId(cierre.id);
        const totalIngresosExtra = await this.ingresosExtraService.sumByCierreCajaId(cierre.id);

        const doc = new PDFDocument({
            size: [227, 800], 
            margins: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }
        });

        doc.fontSize(10).font('Helvetica');
        doc.text('TICKET Z - CIERRE DE CAJA', { align: 'center' });
        doc.text('----------------------------------', { align: 'center' });
        doc.text(`Fecha: ${cierre.fecha_hora_cierre?.toLocaleString() || 'N/A'}`);
        doc.text(`ID de Cierre: ${cierre.id}`);
        doc.text(`Cajero: ${cierre.usuario_cajero_id}`);
        doc.text('---');
        doc.text(`Saldo Inicial de Caja: $${Number(cierre.saldo_inicial_caja).toFixed(2)}`);
        doc.text(`Pagos en Efectivo: $${Number(cierre.total_pagos_efectivo).toFixed(2)}`);
        doc.text(`Ingresos Extra: $${totalIngresosExtra.toFixed(2)}`);
        doc.text(`Gastos Operacionales: $${totalGastos.toFixed(2)}`);
        doc.text('---');
        const saldoEsperado = Number(cierre.saldo_inicial_caja) + Number(cierre.total_pagos_efectivo) + totalIngresosExtra - totalGastos;
        doc.text(`SALDO ESPERADO: $${saldoEsperado.toFixed(2)}`);
        doc.text(`SALDO CONTADO: $${Number(cierre.saldo_final_contado).toFixed(2)}`);
        doc.text(`DIFERENCIA: $${Number(cierre.diferencia_caja).toFixed(2)}`);
        doc.text('---');
        doc.text(`Ventas Brutas: $${Number(cierre.total_ventas_brutas).toFixed(2)}`);
        doc.text(`Descuentos: $${Number(cierre.total_descuentos).toFixed(2)}`);
        doc.text(`Total Neto de Ventas: $${Number(cierre.total_neto_ventas).toFixed(2)}`);
        doc.text(`Total Recaudado: $${Number(cierre.total_recaudado).toFixed(2)}`);
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
            relations: ['establecimiento', 'usuarioCajero']
        });
        if (!cierreActivo) {
            throw new Error('No hay un turno de caja activo.');
        }

        const fechaSimulada = new Date();
        const pagosDelTurno = await this.pagoRepository
            .createQueryBuilder('pago')
            .leftJoinAndSelect('pago.factura', 'factura')
            .leftJoinAndSelect('pago.cuentaBancaria', 'cuentaBancaria')
            .leftJoinAndSelect('cuentaBancaria.medio_pago_asociado', 'medioPago')
            .leftJoinAndSelect('pago.facturaPagosCliente', 'facturaPagosCliente')
            .where('factura.establecimiento_id = :establecimientoId', { establecimientoId })
            .andWhere('factura.usuario_cajero_id = :usuarioCajeroId', { usuarioCajeroId })
            .andWhere('pago.cierre_caja_id IS NULL')
            .andWhere('pago.fecha_hora_pago BETWEEN :fechaApertura AND :fechaCierre', {
                fechaApertura: cierreActivo.fecha_hora_apertura,
                fechaCierre: fechaSimulada,
            })
            .getMany();

        const totalPagosEfectivo = pagosDelTurno.filter(p => p.cuentaBancaria?.medio_pago_asociado?.es_efectivo).reduce((sum, p) => sum + Number(p.monto_recibido), 0);
        const totalGastos = await this.gastosService.sumByCierreCajaId(cierreActivo.id);
        const totalIngresosExtra = await this.ingresosExtraService.sumByCajaActiva(cierreActivo.id);
        const saldoEsperadoActual = Number(cierreActivo.saldo_inicial_caja) + totalPagosEfectivo + totalIngresosExtra - totalGastos;
        
        const doc = new PDFDocument({
            size: [227, 800], 
            margins: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }
        });

        doc.fontSize(10).font('Helvetica');
        doc.text('TICKET X - CORTE PARCIAL', { align: 'center' });
        doc.text('----------------------------------', { align: 'center' });
        doc.text(`Fecha: ${fechaSimulada.toLocaleString()}`);
        doc.text(`ID de Turno: ${cierreActivo.id}`);
        doc.text(`Cajero: ${cierreActivo.usuarioCajero.nombre} ${cierreActivo.usuarioCajero.apellido}`);
        doc.text('---');
        doc.text(`Saldo Inicial de Caja: $${Number(cierreActivo.saldo_inicial_caja).toFixed(2)}`);
        doc.text(`Pagos en Efectivo: $${totalPagosEfectivo.toFixed(2)}`);
        doc.text(`Ingresos Extra: $${totalIngresosExtra.toFixed(2)}`);
        doc.text(`Gastos Operacionales: $${totalGastos.toFixed(2)}`);
        doc.text('---');
        doc.text(`SALDO ESPERADO: $${saldoEsperadoActual.toFixed(2)}`);
        doc.text('----------------------------------');
        doc.text('¡Gracias por su servicio!');
        doc.end();
        return doc as unknown as Readable;
    }
}