import { ConflictException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImpresoraEntity } from './entities/impresora.entity';
import { CreateImpresoraDto } from './dto/create-impresora.dto';
import { UpdateImpresoraDto } from './dto/update.impresora.dto';
import { WebSocketEventsService } from 'src/websocket/services/websocket-events.service';
import { PedidoEntity, TipoPedido } from '../pedidos/entities/pedido.entity';
import puppeteer from 'puppeteer'; 
import { FacturaEntity } from '../facturas/entities/factura.entity';
interface OperacionImpresion {
    nombre: string;
    argumentos: (string | number | boolean | any)[];
}
@Injectable()
export class ImpresionService {
    private readonly logger = new Logger(ImpresionService.name);
    constructor(
        @InjectRepository(ImpresoraEntity)
        private readonly impresoraRepository: Repository<any>, 
        private readonly websocketEventsService: WebSocketEventsService, 
    ) { }

    private async emitUpdateEvent(establecimientoId: string, eventName: string): Promise<void> {
        const impresorasActualizadas = await this.findAll(establecimientoId);
        this.websocketEventsService.emitToEstablishment(
            establecimientoId, 
            eventName, 
            impresorasActualizadas
        );
        this.logger.log(`[WS] Emitido evento '${eventName}' a establecimiento ${establecimientoId}`);
    }
    async create(createImpresoraDto: CreateImpresoraDto): Promise<ImpresoraEntity> {
        const { 
            establecimiento_id, 
            nombre, 
            descripcion, 
            tipo_impresion, 
            tipo_conexion_tecnico, 
            ...rest 
        } = createImpresoraDto; 
        if (!establecimiento_id) {
            throw new NotFoundException('El ID del establecimiento es obligatorio');
        }
        if (!tipo_conexion_tecnico) {
            throw new ConflictException(
                'El tipo de conexión técnico (FILE, USB, NETWORK, etc.) es obligatorio.'
            );
        }
        if (!descripcion) {
            throw new NotFoundException('La descripción (ruta técnica) de la impresora es obligatoria');
        }
        this.logger.log(`Impresora ${nombre} creada por frontend. Persistiendo en DB...`);
        const impresora = this.impresoraRepository.create({
            establecimiento_id,
            nombre, 
            descripcion, 
            tipo_impresion,
            tipo_conexion_tecnico, 
            ...rest,
        });
        const nuevaImpresora = await this.impresoraRepository.save(impresora);
        await this.emitUpdateEvent(establecimiento_id, 'impresoras_actualizadas');
        return nuevaImpresora;
    }
     async findAll(establecimientoId: string): Promise<ImpresoraEntity[]> {
        return await this.impresoraRepository.find({
            where: { establecimiento_id: establecimientoId },
        });
    }    
    async findOne(id: string, establecimientoId?: string): Promise<ImpresoraEntity> {
        const whereCondition: any = { id };
        if (establecimientoId) {
            whereCondition.establecimiento_id = establecimientoId;
        }
        const impresora = await this.impresoraRepository.findOne({
            where: whereCondition,
        });
        if (!impresora) {
            throw new NotFoundException(`Impresora con ID "${id}" no encontrada.`);
        }
        return impresora;
    }

    async update(id: string, updateImpresoraDto: UpdateImpresoraDto, establecimientoId?: string): Promise<ImpresoraEntity> {
        const { nombre, descripcion, tipo_impresion, tipo_conexion_tecnico, ...rest } = updateImpresoraDto; 
        
        const impresora = await this.findOne(id, establecimientoId);
        const establecimiento_id = impresora.establecimiento_id;
        let updated = false;
        Object.assign(impresora, rest);
        if (updated) {
            this.logger.log(`Impresora ${impresora.nombre} actualizada en DB. Asumiendo acción local completada.`);
        }
        const impresoraActualizada = await this.impresoraRepository.save(impresora);
        if (updated) {
            await this.emitUpdateEvent(establecimiento_id, 'impresoras_actualizadas');
        }
        return impresoraActualizada;
    }
    async remove(id: string, establecimientoId?: string): Promise<void> {
        const impresora = await this.findOne(id, establecimientoId);
        const establecimiento_id = impresora.establecimiento_id;
        this.logger.log(`Impresora ${impresora.nombre} eliminada de DB. Asumiendo acción local completada.`);
        await this.impresoraRepository.delete(impresora.id);
        await this.emitUpdateEvent(establecimiento_id, 'impresoras_actualizadas');
    }

        private formatearMoneda(valor: number): string {
        const formatter = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
        return formatter.format(valor);
    }
private generarJsonFactura(factura: FacturaEntity, pedido: PedidoEntity): OperacionImpresion[] {
    const operaciones: OperacionImpresion[] = [];
    const establecimiento = pedido.establecimiento.nombre || 'Quality Soft Service';
    const fechaActual = new Date(factura.fecha_hora_factura).toLocaleString('es-ES');
    const ALINEACION_IZQUIERDA = 0;
    const ALINEACION_CENTRO = 1;
    const ALINEACION_DERECHA = 2;
    operaciones.push({ nombre: 'Iniciar', argumentos: [] });    
    operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [true] });
    operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_CENTRO] });    
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [establecimiento + '\n'] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`FACTURA #${factura.sales_code}\n`] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['--------------------------------\n'] })
    operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [false] });
    operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_IZQUIERDA] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Fecha: ${fechaActual}\n`] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Cajero: ${factura.usuarioCajero?.nombre || 'N/A'}\n`] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Pedido ID: ${pedido.numero_secuencial_diario}\n`] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['================================\n'] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['CANT | DESCRIPCIÓN         | TOTAL\n'] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['================================\n'] });
        for (const item of pedido.pedidoItems) {
        const nombreProducto = item.producto?.nombre || item.productoConfigurable?.nombre || 'Producto Desconocido';
        const totalItem = (Number(item.cantidad) * Number(item.precio_unitario_al_momento_venta)).toFixed(2);
        const lineaProducto = `${item.cantidad.toString().padEnd(4)} ${nombreProducto.padEnd(20).substring(0, 20)} ${totalItem.padStart(8)}`;
        operaciones.push({ nombre: 'EscribirTexto', argumentos: [lineaProducto + '\n'] });
    }
    
    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['\n'] });
    operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_DERECHA] });    
    
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`SUBTOTAL: ${Number(factura.subtotal).toFixed(2)}\n`] });
    if (factura.propina > 0) {
        operaciones.push({ nombre: 'EscribirTexto', argumentos: [`PROPINA: ${Number(factura.propina).toFixed(2)}\n`] });
    }
    
    operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [true] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`TOTAL: ${Number(factura.total_factura).toFixed(2)}\n`] });
    operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [false] });

    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['--------------------------------\n'] });
    operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_CENTRO] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['¡Gracias por su compra!\n'] });
    operaciones.push({ nombre: 'Feed', argumentos: [5] });
    operaciones.push({ nombre: 'CortarPapel', argumentos: [1] }); 

    return operaciones;
}

private generarJsonComanda(pedido: PedidoEntity): OperacionImpresion[] {
    const operaciones: OperacionImpresion[] = [];
    const ALINEACION_CENTRO = 1;
    const ALINEACION_IZQUIERDA = 0;
    const ALINEACION_DERECHA = 2; 
    const fechaHora = new Date(pedido.fecha_hora_pedido).toLocaleString('es-ES', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
    const mesero = pedido.usuarioCreador?.nombre || 'SISTEMA/WEB'; 
    const tipoPedido = pedido.tipo_pedido.toUpperCase(); 
    operaciones.push({ nombre: 'Iniciar', argumentos: [] });
    operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [true] });
    operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_CENTRO] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`*** COMANDA ***\n`] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`${pedido.establecimiento}\n`] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`PEDIDO #${pedido.numero_secuencial_diario}\n`] });
    const lugar = pedido.mesa?.numero ? `MESA: ${pedido.mesa.numero}` : `TIPO: ${tipoPedido}`;
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`${lugar}\n`] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['--------------------------------\n'] });
    operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [false] });
    operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_IZQUIERDA] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Fecha/Hora: ${fechaHora}\n`] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Mesero/Cajero: ${mesero}\n`] });
    if (pedido.tipo_pedido !== 'MESA' && pedido.cliente_nombre) {
        operaciones.push({ nombre: 'EscribirTexto', argumentos: ['--- DATOS DE CLIENTE ---\n'] });
        operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Cliente: ${pedido.cliente_nombre}\n`] });
        if (pedido.cliente_telefono) {
            operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Teléfono: ${pedido.cliente_telefono}\n`] });
        }
        if (pedido.cliente_direccion) {
            operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Dirección: ${pedido.cliente_direccion}\n`] });
        }
        operaciones.push({ nombre: 'EscribirTexto', argumentos: ['--------------------------------\n'] });
    }

    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['--- ITEMS DEL PEDIDO ---\n'] });
    
    for (const item of pedido.pedidoItems) {
        const nombreProducto = item.producto?.nombre || item.productoConfigurable?.nombre || 'Producto Desconocido';
        operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_IZQUIERDA] }); 
        operaciones.push({ nombre: 'EstablecerDobleAncho', argumentos: [true] }); 
        operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [true] });
        operaciones.push({ nombre: 'EscribirTexto', argumentos: [`${item.cantidad} x ${nombreProducto}\n`] });
        operaciones.push({ nombre: 'EstablecerDobleAncho', argumentos: [false] });
        operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [false] }); 
        if (item.notas_item) {
            operaciones.push({ nombre: 'EscribirTexto', argumentos: [`  ** NOTAS: ${item.notas_item}\n`] });
        }
        operaciones.push({ nombre: 'EscribirTexto', argumentos: ['--\n'] });
    }
    if (pedido.notas) {
        operaciones.push({ nombre: 'EscribirTexto', argumentos: ['--------------------------------\n'] });
        operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [true] });
        operaciones.push({ nombre: 'EscribirTexto', argumentos: [`NOTAS GENERALES DEL PEDIDO:\n`] });
        operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [false] });
        operaciones.push({ nombre: 'EscribirTexto', argumentos: [`${pedido.notas}\n`] });
    }
    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['\n'] });
    operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_CENTRO] });
    operaciones.push({ nombre: 'EscribirTexto', argumentos: ['*** FIN DE PEDIDO ***\n'] });
    operaciones.push({ nombre: 'Feed', argumentos: [3] });
    operaciones.push({ nombre: 'CortarPapel', argumentos: [1] }); 
    return operaciones;
}


async enviarFacturaAImpresora(factura: FacturaEntity, pedido: PedidoEntity, establecimientoId: string): Promise<void> {
    const impresoras = await this.impresoraRepository.find({
        where: {
            establecimiento_id: establecimientoId,
            tipo_impresion: 'CAJA', 
            activa: true
        },
    });

    if (impresoras.length === 0) {
        this.logger.warn(`No hay impresoras de caja/factura activas para el establecimiento ${establecimientoId}.`);
        return;
    }
    
    const operacionesFactura = this.generarJsonFactura(factura, pedido); 
    const targetId = establecimientoId;

    for (const impresora of impresoras) {
        this.websocketEventsService.emitPrintJobToDevice(targetId, { 
            tipoImpresion: 'CAJA', 
            nombreImpresora: impresora.nombre,
            operaciones: operacionesFactura,
            pedidoId: pedido.id, 
        });
        this.logger.log(`[WS] Factura ${factura.sales_code} enviada a impresora ${impresora.nombre} del establecimiento ${establecimientoId}.`);
    }
}

async enviarComandaAImpresora(pedido: PedidoEntity, establecimientoId: string): Promise<void> {
        const impresoras = await this.impresoraRepository.find({
        where: { 
            establecimiento_id: establecimientoId, 
            tipo_impresion: 'COCINA', 
            activa: true
        },
    });

    if (impresoras.length === 0) {
        this.logger.warn(`No hay impresoras de cocina activas para el establecimiento ${establecimientoId}.`);
        return;
    }
    const operacionesComanda = this.generarJsonComanda(pedido); 
    const targetId = establecimientoId; 
    for (const impresora of impresoras) {
        this.websocketEventsService.emitPrintJobToDevice(targetId, { 
            tipoImpresion: 'COCINA',
            nombreImpresora: impresora.nombre,
            operaciones: operacionesComanda,
            pedidoId: pedido.id,
        });
    }
}
    async generarPdfComanda(pedido: PedidoEntity): Promise<Buffer> {
        try {
            const html = await this.renderHtmlComanda(pedido);
            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'domcontentloaded' });
            const pdfBuffer = Buffer.from(await page.pdf({
                width: '80mm',
                pageRanges: '1',
                printBackground: true,
                scale: 0.8,
                margin: {
                    top: '0.5mm',
                    right: '0.5mm',
                    bottom: '0.5mm',
                    left: '0.5mm',
                },
            }));

            await browser.close();
            return pdfBuffer;
        } catch (error) {
            console.error('Error generando el PDF:', error);
            throw new Error('Error al generar el PDF de la comanda.');
        }
    }
    private async renderHtmlComanda(pedido: PedidoEntity): Promise<string> {
        const nombreEstablecimiento = pedido.establecimiento?.nombre || 'Mi Establecimiento';
        const numeroMesa = pedido.mesa?.numero ?? 'N/A';
        const notasGenerales = pedido.notas || 'Sin notas adicionales.';
        const fechaActual = new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        let subtotalPedido = 0;
        const itemsHtml = pedido.pedidoItems.map(item => {
            const nombreProducto = item.producto?.nombre || item.productoConfigurable?.nombre || 'Producto Desconocido';
            const notasItem = item.notas_item ? `<p style="font-size: 0.9em; margin: 0; padding-left: 5px; color: #000;">- Notas: ${item.notas_item}</p>` : '';
            const precioUnitario = parseFloat(item.precio_unitario_al_momento_venta as any);
            const subtotalItem = item.cantidad * precioUnitario;
            subtotalPedido += subtotalItem;
            const precioFormateado = this.formatearMoneda(precioUnitario);
            const subtotalFormateado = this.formatearMoneda(subtotalItem);

            let configuracionHtml = '';
            if (item.productoConfigurable && item.configuracion_json && item.configuracion_json.opcionesSeleccionadas) {
                const opciones = item.configuracion_json.opcionesSeleccionadas.map((op: any) =>
                    `<li>${op.nombre}</li>`
                ).join('');
                configuracionHtml = `
                <div style="font-size: 14px; margin-top: 1px; margin-left: 5px; color: #000;">
                    <strong>Opciones:</strong>
                    <ul style="margin: 0; padding-left: 10px; list-style-type: none;">
                        ${opciones}
                    </ul>
                </div>
            `;
            }
            return `
                <div style="border-bottom: 1px dashed #000; padding: 3px 0;"> 
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <p style="font-weight: bold; margin: 0; font-size: 14px; color: #000; flex-grow: 1;">
                        ${item.cantidad} x ${nombreProducto}
                    </p>
                    <span style="font-size: 14px; font-weight: bold; color: #000; white-space: nowrap;">${subtotalFormateado}</span>
                </div>
                <p style="font-size: 14px; margin: 1px 0 0 0; color: #000;">
                    Precio unitario: ${precioFormateado}
                </p>
                ${configuracionHtml}
                ${notasItem}
            </div>
            `;
        }).join('');
        const totalFinal = parseFloat(pedido.total_estimado as any);
        const descuentos = parseFloat(pedido.descuentos_aplicados as any);
        let infoAdicionalCliente = '';
        if (pedido.tipo_pedido === TipoPedido.DOMICILIO) {
            infoAdicionalCliente = `
                <h3 class="section-title" style="border-bottom: 1px solid #000; padding-bottom: 2px; color: #000; margin-top: 5px;">Datos del Cliente</h3>
            <p style="color: #000; margin-top: 1px;"><strong>Nombre:</strong> ${pedido.cliente_nombre || 'N/A'}</p>
            <p style="color: #000; margin-top: 1px;"><strong>Teléfono:</strong> ${pedido.cliente_telefono || 'N/A'}</p>
            <p style="color: #000; margin-top: 1px; margin-bottom: 5px;"><strong>Dirección:</strong> ${pedido.cliente_direccion || 'N/A'}</p>
            `;
        }
        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Comanda de Pedido</title>
            <style>
                body {
                    font-family: 'monospace', sans-serif; 
                    margin: 0;
                    padding: 0 2px; 
                    color: #000;
                    width: 80mm;
                    font-size: 18px; 
                }
                .container {
                    max-width: 80mm;
                    margin: auto;
                    border: none;
                    padding: 0;
                    box-shadow: none;
                }
                h1, h2, h3 {
                    text-align: center;
                    margin-top: 3px; 
                    margin-bottom: 3px; 
                    color: #000;
                }
                h1 {
                    font-size: 28px;
                    border-bottom: 2px solid #000; 
                    padding-bottom: 3px; 
                }
                h2 {
                    font-size: 26px; 
                }

                h3 {
                    font-size: 22px;
                }

                p, span, td {
                    font-size: 18px
                }
                .header-info {
                    display: block; 
                    font-size: 18px;
                    margin-bottom: 0px; 
                    color: #000;
                }
                .header-info div {
                    display: flex; 
                    justify-content: space-between;
                    margin-bottom: 0px;
                }
                .section-title {
                    font-size: 22px;
                    margin-top: 5px; 
                    margin-bottom: 2px; 
                    border-bottom: 1px solid #000; 
                    padding-bottom: 2px; 
                    color: #000;
                }
                .summary-table {
                    width: 100%;
                    margin-top: 2px;
                    border-collapse: collapse;
                }
                .summary-table td {
                    padding: 2px 0; 
                    border-top: 1px dashed #000; 
                    color: #000;
                }
                .summary-table .total-row td {
                    font-weight: bold;
                    font-size: 18px;
                    border-top: 2px solid #000; 
                    color: #000;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div style="text-align: center;">
                    <h2 style="font-size: 22px; margin-bottom: 0;">${nombreEstablecimiento}</h2>
                    <h3 style="font-size: 22px; margin-top: 3px;">Comanda de ${pedido.tipo_pedido === TipoPedido.MESA ? `Mesa #${numeroMesa}` : pedido.tipo_pedido}</h3>
                </div>

                <div class="header-info">
                    <div style="font-size: 18px;">
                        <span><strong>Número de Pedido:</strong></span>
                        <span style="font-weight: bold;">#${pedido.numero_secuencial_diario}</span>
                    </div>
                    <div style="font-size: 18px;">
                        <span><strong>Fecha y Hora:</strong></span>
                        <span style="font-weight: bold;">${fechaActual}</span>
                    </div>
                </div>
                
                ${infoAdicionalCliente}

                <h3 class="section-title">Detalle del Pedido</h3>
                <div class="items-list">
                    ${itemsHtml}
                </div>

                <table class="summary-table">
                    <tbody>
                        <tr>
                            <td>Subtotal</td>
                            <td style="text-align: right;">${this.formatearMoneda(subtotalPedido)}</td>
                        </tr>
                        <tr>
                            <td>Descuentos</td>
                            <td style="text-align: right;">-${this.formatearMoneda(descuentos)}</td>
                        </tr>
                        <tr class="total-row">
                            <td>Total a Pagar</td>
                            <td style="text-align: right;">${this.formatearMoneda(totalFinal)}</td>
                        </tr>
                    </tbody>
                    <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #000;">
                        Gracias por tu visita.
                    </div>
                </table>
            </div>
        </body>
        </html>
        `;
        return html;
    }
}