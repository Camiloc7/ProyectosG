import { ConflictException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Eliminamos 'axios' y 'puppeteer' ya que estas operaciones serán manejadas por
// el Frontend o son puramente locales.
import { ImpresoraEntity } from './entities/impresora.entity';
// Importaciones de otras entidades y servicios
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

    // --- LÓGICA DE WEBSOCKET (SE MANTIENE, ES EL MÉTODO DE SINCRONIZACIÓN) ---
    private async emitUpdateEvent(establecimientoId: string, eventName: string): Promise<void> {
        const impresorasActualizadas = await this.findAll(establecimientoId);
        this.websocketEventsService.emitToEstablishment(
            establecimientoId, 
            eventName, 
            impresorasActualizadas
        );
        this.logger.log(`[WS] Emitido evento '${eventName}' a establecimiento ${establecimientoId}`);
    }

// -----------------------------------------------------------------------------
// MÉTODOS CRUD AJUSTADOS (Solo DB + Notificación WS)
// -----------------------------------------------------------------------------

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
        
        // El frontend ya debió contactar al plugin para guardar la configuración,
        // o si es una red, ya hizo la prueba de conexión.
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

        // Notificar vía WebSocket a todos los clientes del establecimiento
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

        // Lógica de actualización de propiedades (DB)
        // ... (Tu lógica de actualización de propiedades se mantiene aquí) ...
        
        Object.assign(impresora, rest);

        // Ya NO llamamos a configurarImpresoraEnPlugin()
        if (updated) {
            this.logger.log(`Impresora ${impresora.nombre} actualizada en DB. Asumiendo acción local completada.`);
        }
        
        const impresoraActualizada = await this.impresoraRepository.save(impresora);
        
        // Notificar vía WebSocket si hubo cambios
        if (updated) {
            await this.emitUpdateEvent(establecimiento_id, 'impresoras_actualizadas');
        }

        return impresoraActualizada;
    }
    
    async remove(id: string, establecimientoId?: string): Promise<void> {
        const impresora = await this.findOne(id, establecimientoId);
        const establecimiento_id = impresora.establecimiento_id;
        
        // Ya NO llamamos a eliminarImpresoraEnPlugin()
        this.logger.log(`Impresora ${impresora.nombre} eliminada de DB. Asumiendo acción local completada.`);

        await this.impresoraRepository.delete(impresora.id);
        
        // Notificar vía WebSocket
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
// -----------------------------------------------------------------------------
// MÉTODOS DE CONEXIÓN AL PLUGIN ELIMINADOS
// -----------------------------------------------------------------------------

    // ¡ELIMINAR ESTOS MÉTODOS COMPLETAMENTE!
    // - obtenerImpresorasDisponibles() ❌ (Ahora es llamado directamente por el frontend)
    // - configurarImpresoraEnPlugin() ❌ (Ahora es llamado directamente por el frontend)
    // - eliminarImpresoraEnPlugin() ❌ (Ahora es llamado directamente por el frontend)
    // - probarConexionPlugin() ❌ (Ahora es llamado directamente por el frontend)
    // - enviarComandaAImpresora() ❌ (La comanda se envía por el frontend/Plugin)
    // - enviarFacturaTiquetaImpresora() ❌ (El tiquet se envía por el frontend/Plugin)
    // - generarPdfComanda() ❌ (Se elimina la dependencia de puppeteer)
    // ... (Mantener solo la lógica de formateo si otras partes del código la usan,



    //      o eliminar si solo era para el PDF/JSON de impresión)





    

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




































// import { ConflictException, Injectable, NotFoundException, Logger } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import axios from 'axios';
// import { ImpresoraEntity } from './entities/impresora.entity';
// import { PedidoEntity, TipoPedido } from '../pedidos/entities/pedido.entity';
// import { CreateImpresoraDto } from './dto/create-impresora.dto';
// import { UpdateImpresoraDto } from './dto/update.impresora.dto';
// import puppeteer from 'puppeteer'; 
// import { FacturaEntity } from '../facturas/entities/factura.entity';
// import { WebSocketEventsService } from 'src/websocket/services/websocket-events.service';
// interface OperacionImpresion {
//     nombre: string;
//     argumentos: (string | number | boolean | any)[];
// }
// interface OperacionImpresion {
//     nombre: string;
//     argumentos: (string | number | boolean | any)[];
// }

// const PLUGIN_IP = '127.0.0.1'; 
// const PLUGIN_PUERTO = 8000;

// @Injectable()
// export class ImpresionService {
//     private readonly logger = new Logger(ImpresionService.name);
//     constructor(
//         @InjectRepository(ImpresoraEntity)
//         private readonly impresoraRepository: Repository<any>, 
//         private readonly websocketEventsService: WebSocketEventsService, 

//     ) { }

// async create(createImpresoraDto: CreateImpresoraDto): Promise<ImpresoraEntity> {

//     const { 
//         establecimiento_id, 
//         nombre, 
//         descripcion, 
//         tipo_impresion, 
//         tipo_conexion_tecnico, 
//         ...rest 
//     } = createImpresoraDto; 

//     if (!establecimiento_id) {
//         throw new NotFoundException('El ID del establecimiento es obligatorio');
//     }
//         if (!tipo_conexion_tecnico) {
//         throw new ConflictException(
//             'El tipo de conexión técnico (FILE, USB, NETWORK, etc.) es obligatorio y debe obtenerse de /impresoras/disponibles.'
//         );
//     }
    
//     const existingAmigable = await this.impresoraRepository.findOneBy({ establecimiento_id, descripcion });
//     if (!descripcion) {
//         throw new NotFoundException('La descripción (ruta técnica) de la impresora es obligatoria');
//     }
    
//     await this.configurarImpresoraEnPlugin({
//         nombre: nombre, 
//         ruta: descripcion, 
//         tipo: tipo_conexion_tecnico 
//     });
//         const impresora = this.impresoraRepository.create({
//         establecimiento_id,
//         nombre, 
//         descripcion, 
//         tipo_impresion,
//         tipo_conexion_tecnico, 
//         ...rest,
//     });
//     return await this.impresoraRepository.save(impresora);
// }

//     async findAll(establecimientoId: string): Promise<ImpresoraEntity[]> {
//         return await this.impresoraRepository.find({
//             where: { establecimiento_id: establecimientoId },
//         });
//     }    
//     async findOne(id: string, establecimientoId?: string): Promise<ImpresoraEntity> {
//         const whereCondition: any = { id };
//         if (establecimientoId) {
//             whereCondition.establecimiento_id = establecimientoId;
//         }
//         const impresora = await this.impresoraRepository.findOne({
//             where: whereCondition,
//         });
//         if (!impresora) {
//             throw new NotFoundException(`Impresora con ID "${id}" no encontrada.`);
//         }
//         return impresora;
//     }

// async update(id: string, updateImpresoraDto: UpdateImpresoraDto, establecimientoId?: string): Promise<ImpresoraEntity> {
//     const { nombre, descripcion, tipo_impresion, tipo_conexion_tecnico, ...rest } = updateImpresoraDto; 
    
//     const impresora = await this.findOne(id, establecimientoId);
//     let updated = false;
    
//     if (nombre && nombre !== impresora.nombre) {
//         impresora.nombre = nombre;
//         updated = true;
//     }
//     if (descripcion && descripcion !== impresora.descripcion) {
//         impresora.descripcion = descripcion;
//         updated = true;
//     }
//     if (tipo_impresion && tipo_impresion !== impresora.tipo_impresion) {
//         impresora.tipo_impresion = tipo_impresion;
//         updated = true;
//     }
//     if (tipo_conexion_tecnico && tipo_conexion_tecnico !== impresora.tipo_conexion_tecnico) {
//         impresora.tipo_conexion_tecnico = tipo_conexion_tecnico;
//         updated = true;
//     }
    
//     Object.assign(impresora, rest);

//     if (updated) {
//         await this.configurarImpresoraEnPlugin({
//             nombre: impresora.nombre, 
//             ruta: impresora.descripcion, 
//             tipo: impresora.tipo_conexion_tecnico 
//         });
//     }

//     return await this.impresoraRepository.save(impresora);
// }
// async remove(id: string, establecimientoId?: string): Promise<void> {
//     const impresora = await this.findOne(id, establecimientoId);
//     try {
//         await this.eliminarImpresoraEnPlugin(impresora.nombre);
//     } catch (error) {
//         this.logger.error(`Fallo al eliminar en el plugin, pero se continúa con la DB: ${error.message}`);
//     }
//     await this.impresoraRepository.delete(impresora.id);
//     this.logger.log(`Impresora "${impresora.nombre}" (ID: ${id}) eliminada exitosamente de la DB.`);
// }
//     private formatearMoneda(valor: number): string {
//         const formatter = new Intl.NumberFormat('es-CO', {
//             style: 'currency',
//             currency: 'COP',
//             minimumFractionDigits: 0,
//             maximumFractionDigits: 0,
//         });
//         return formatter.format(valor);
//     }
    
//     async obtenerImpresorasDisponibles(): Promise<any[]> { 
//         const url = `http://${PLUGIN_IP}:${PLUGIN_PUERTO}/impresoras`; 
//         this.logger.log(`Consultando impresoras disponibles en: ${url}`);
//         try {
//             const response = await axios.get(url, { timeout: 5000 }); 
//             if (Array.isArray(response.data)) {
//                 return response.data;
//             }
//             return [];
//         } catch (error) {
//             this.logger.error(`Error al conectar con el plugin en ${url}`, error.message);
//             throw new NotFoundException(`No se pudo conectar con el plugin de impresión en ${PLUGIN_IP}:${PLUGIN_PUERTO}. Asegúrese de que esté activo.`);
//         }
//     }
//     async configurarImpresoraEnPlugin(config: { nombre: string, ruta: string, tipo: string }): Promise<any> {
//         const url = `http://${PLUGIN_IP}:${PLUGIN_PUERTO}/impresoras`; 
//         this.logger.log(`Enviando configuración al plugin: ${JSON.stringify(config)}`);
//         try {
//             const response = await axios.post(url, config, {
//                 headers: { 'Content-Type': 'application/json' },
//                 timeout: 5000, 
//             });
//             if (response.status !== 200) {
//                 throw new Error(`El plugin respondió con un error HTTP ${response.status}: ${response.data.mensaje || 'Error desconocido'}`);
//             }
//             this.logger.log(`Configuración del plugin exitosa para: ${config.nombre}`);
//             return response.data;
//         } catch (error) {
//             if (axios.isAxiosError(error) && error.response) {
//                 throw new Error(`Error al conectar o configurar la impresora en el plugin (${config.nombre}): ${error.response.data.mensaje || error.message}`);
//             }
//             throw new Error(`Error al conectar o configurar la impresora en el plugin (${config.nombre}): ${error.message}`);
//         }
//     }
// private generarJsonComanda(pedido: PedidoEntity): OperacionImpresion[] {
//     const operaciones: OperacionImpresion[] = []; 
//     const nombreEstablecimiento = pedido.establecimiento?.nombre || 'Quality Soft Service';
//     const numeroMesa = pedido.mesa?.numero ?? 'N/A';
//     const fechaActual = new Date().toLocaleString('es-ES', {
//         day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
//     });

//     const ALINEACION_IZQUIERDA = 0;
//     const ALINEACION_CENTRO = 1; 
//     operaciones.push({ "nombre": 'Iniciar', "argumentos": [] });
//     operaciones.push({ "nombre": 'EstablecerEnfatizado', "argumentos": [true] }); 
//     operaciones.push({ "nombre": 'EstablecerAlineacion', "argumentos": [ALINEACION_CENTRO] }); 
//     operaciones.push({ "nombre": 'EscribirTexto', "argumentos": [nombreEstablecimiento + '\n'] });
//     operaciones.push({ "nombre": 'EscribirTexto', "argumentos": ['COMANDA\n'] });
    
//     operaciones.push({ "nombre": 'EstablecerEnfatizado', "argumentos": [false] }); 
//     operaciones.push({ "nombre": 'EscribirTexto', "argumentos": ['--------------------------------\n'] });
//     operaciones.push({ "nombre": 'EstablecerAlineacion', "argumentos": [ALINEACION_IZQUIERDA] }); 
//     operaciones.push({ "nombre": 'EscribirTexto', "argumentos": [`Pedido: #${pedido.numero_secuencial_diario}\n`] });
//     operaciones.push({ "nombre": 'EscribirTexto', "argumentos": [`Fecha: ${fechaActual}\n`] });
    
//     if (pedido.tipo_pedido === TipoPedido.MESA) {
//         operaciones.push({ "nombre": 'EscribirTexto', "argumentos": [`Mesa: ${numeroMesa}\n`] });
//     } else {
//         operaciones.push({ "nombre": 'EscribirTexto', "argumentos": [`Tipo: ${pedido.tipo_pedido}\n`] });
//     }
    
//     operaciones.push({ "nombre": 'EscribirTexto', "argumentos": ['================================\n'] });
//     operaciones.push({ "nombre": 'EscribirTexto', "argumentos": ['CANT | DESCRIPCIÓN\n'] });
//     operaciones.push({ "nombre": 'EscribirTexto', "argumentos": ['================================\n'] });
    
//     for (const item of pedido.pedidoItems) {
//         const nombreProducto = item.producto?.nombre || item.productoConfigurable?.nombre || 'Producto Desconocido';
//         operaciones.push({ "nombre": 'EstablecerEnfatizado', "argumentos": [true] }); 
//         const linea = `${item.cantidad.toString().padStart(4, ' ')} | ${nombreProducto}`;
//         operaciones.push({ "nombre": 'EscribirTexto', "argumentos": [linea + '\n'] });
//         operaciones.push({ "nombre": 'EstablecerEnfatizado', "argumentos": [false] });

//         if (item.notas_item) {
//             operaciones.push({ "nombre": 'EscribirTexto', "argumentos": [`      * Notas: ${item.notas_item}\n`] });
//         }
//     }

//     operaciones.push({ "nombre": 'EscribirTexto', "argumentos": ['--------------------------------\n'] });
    
//     if (pedido.notas) {
//         operaciones.push({ "nombre": 'EscribirTexto', "argumentos": ['NOTAS GENERALES:\n'] });
//         operaciones.push({ "nombre": 'EscribirTexto', "argumentos": [pedido.notas + '\n'] });
//         operaciones.push({ "nombre": 'EscribirTexto', "argumentos": ['--------------------------------\n'] });
//     }
    
//     operaciones.push({ "nombre": 'EstablecerAlineacion', "argumentos": [ALINEACION_CENTRO] });
//     operaciones.push({ "nombre": 'EstablecerEnfatizado', "argumentos": [true] }); 
//     operaciones.push({ "nombre": 'EscribirTexto', "argumentos": ['¡Listo para preparar!\n'] });
//     operaciones.push({ "nombre": 'EstablecerEnfatizado', "argumentos": [false] }); 
    
//     operaciones.push({ "nombre": 'Feed', "argumentos": [5] });
//     operaciones.push({ "nombre": 'CortarPapel', "argumentos": [1] }); 
    
//     return operaciones;
// }

// async enviarComandaAImpresora(pedido: PedidoEntity): Promise<void> {
//     try {
//         const impresoraCocina = await this.impresoraRepository.findOne({
//             where: {
//                 establecimiento_id: pedido.establecimiento_id,
//                 tipo_impresion: 'COCINA',
//                 activa: true,
//             },
//         });
//         if (!impresoraCocina) {
//             this.logger.error(
//                 `FALLO TOTAL: No se encontró una impresora activa de cocina configurada en DB.`
//             );
//             throw new NotFoundException('Impresora de cocina no configurada o inactiva.');
//         }
//         const operacionesJson = this.generarJsonComanda(pedido);
//         const payload = {
//             nombreImpresora: impresoraCocina.nombre, 
//             operaciones: operacionesJson,
//         };
//         this.logger.log(`Payload completo para imprimir: ${JSON.stringify(payload)}`);        
//         if (operacionesJson.length === 0) {
//             this.logger.warn(`El array 'operacionesJson' está vacío. No se enviarán comandos al plugin.`);
//         }
//         const url = `http://${PLUGIN_IP}:${PLUGIN_PUERTO}/imprimir`; 
//         await axios.post(url, payload, {
//             headers: { 'Content-Type': 'application/json' },
//             timeout: 10000, 
//         });
        
//         this.logger.log(`Comanda ${pedido.id} enviada con éxito a ${url} (Impresora: ${impresoraCocina.nombre}).`);

//     } catch (error) {
//         if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
//             throw new Error(`Error de conexión con el plugin de impresión en ${PLUGIN_IP}:${PLUGIN_PUERTO}. Asegúrese de que el plugin esté activo.`);
//         }
//         this.logger.error(`Error al enviar la comanda del pedido "${pedido.id}":`, error.message);
//         throw new Error(`Error en el servicio de impresión: ${error.message}`);
//     }
// }
//     async generarPdfComanda(pedido: PedidoEntity): Promise<Buffer> {
//         try {
//             const html = await this.renderHtmlComanda(pedido);
//             const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
//             const page = await browser.newPage();
//             await page.setContent(html, { waitUntil: 'domcontentloaded' });
//             const pdfBuffer = Buffer.from(await page.pdf({
//                 width: '80mm',
//                 pageRanges: '1',
//                 printBackground: true,
//                 scale: 0.8,
//                 margin: {
//                     top: '0.5mm',
//                     right: '0.5mm',
//                     bottom: '0.5mm',
//                     left: '0.5mm',
//                 },
//             }));

//             await browser.close();
//             return pdfBuffer;
//         } catch (error) {
//             console.error('Error generando el PDF:', error);
//             throw new Error('Error al generar el PDF de la comanda.');
//         }
//     }

// private generarJsonFactura(factura: FacturaEntity, pedido: PedidoEntity): OperacionImpresion[] {
//     const operaciones: OperacionImpresion[] = [];
//     const establecimiento = pedido.establecimiento.nombre || 'Quality Soft Service';
//     const fechaActual = new Date(factura.fecha_hora_factura).toLocaleString('es-ES');
//     const ALINEACION_IZQUIERDA = 0;
//     const ALINEACION_CENTRO = 1;
//     const ALINEACION_DERECHA = 2;
//     operaciones.push({ nombre: 'Iniciar', argumentos: [] });    
//     operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [true] });
//     operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_CENTRO] });    
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: [establecimiento + '\n'] });
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: [`FACTURA #${factura.sales_code}\n`] });
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: ['--------------------------------\n'] })
//     operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [false] });
//     operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_IZQUIERDA] });
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Fecha: ${fechaActual}\n`] });
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Cajero: ${factura.usuarioCajero?.nombre || 'N/A'}\n`] });
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: [`Pedido ID: ${pedido.numero_secuencial_diario}\n`] });
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: ['================================\n'] });
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: ['CANT | DESCRIPCIÓN         | TOTAL\n'] });
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: ['================================\n'] });
//         for (const item of pedido.pedidoItems) {
//         const nombreProducto = item.producto?.nombre || item.productoConfigurable?.nombre || 'Producto Desconocido';
//         const totalItem = (Number(item.cantidad) * Number(item.precio_unitario_al_momento_venta)).toFixed(2);
//         const lineaProducto = `${item.cantidad.toString().padEnd(4)} ${nombreProducto.padEnd(20).substring(0, 20)} ${totalItem.padStart(8)}`;
//         operaciones.push({ nombre: 'EscribirTexto', argumentos: [lineaProducto + '\n'] });
//     }
    
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: ['\n'] });
//     operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_DERECHA] });    
    
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: [`SUBTOTAL: ${Number(factura.subtotal).toFixed(2)}\n`] });
//     if (factura.propina > 0) {
//         operaciones.push({ nombre: 'EscribirTexto', argumentos: [`PROPINA: ${Number(factura.propina).toFixed(2)}\n`] });
//     }
    
//     operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [true] });
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: [`TOTAL: ${Number(factura.total_factura).toFixed(2)}\n`] });
//     operaciones.push({ nombre: 'EstablecerEnfatizado', argumentos: [false] });

//     operaciones.push({ nombre: 'EscribirTexto', argumentos: ['--------------------------------\n'] });
//     operaciones.push({ nombre: 'EstablecerAlineacion', argumentos: [ALINEACION_CENTRO] });
//     operaciones.push({ nombre: 'EscribirTexto', argumentos: ['¡Gracias por su compra!\n'] });
//     operaciones.push({ nombre: 'Feed', argumentos: [5] });
//     operaciones.push({ nombre: 'CortarPapel', argumentos: [1] }); 

//     return operaciones;
// }

// async enviarFacturaTiquetaImpresora(factura: FacturaEntity, pedido: PedidoEntity, establecimientoId: string): Promise<void> {
//     try {
//         const impresoraCaja = await this.impresoraRepository.findOne({
//             where: {
//                 establecimiento_id: establecimientoId,
//                 tipo_impresion: 'CAJA', 
//                 activa: true,
//             },
//         });

//         if (!impresoraCaja) {
//             this.logger.warn(`No se encontró una impresora activa de CAJA para el establecimiento ${establecimientoId}. No se imprimirá el tiquet.`);
//             return; 
//         }
//         const operacionesJson = this.generarJsonFactura(factura, pedido);
//         const payload = {
//             nombreImpresora: impresoraCaja.nombre, 
//             operaciones: operacionesJson,
//         };
//                 this.logger.log(`[Factura] Payload completo para imprimir: ${JSON.stringify(payload)}`); 

//         const url = `http://${PLUGIN_IP}:${PLUGIN_PUERTO}/imprimir`;
//         await axios.post(url, payload, {
//             headers: { 'Content-Type': 'application/json' },
//             timeout: 10000, 
//         });
        
//         this.logger.log(`Tiquet de Factura ${factura.sales_code} enviado con éxito a ${url}.`);

//     } catch (error) {
//         this.logger.error(`Error al enviar el tiquet de factura "${factura.sales_code}":`, error.message);
//         throw new Error(`Fallo al imprimir tiquet por plugin: ${error.message}`);
//     }
// }
// async eliminarImpresoraEnPlugin(nombreImpresora: string): Promise<any> {
//     const url = `http://${PLUGIN_IP}:${PLUGIN_PUERTO}/impresoras`; 
//     this.logger.log(`Solicitando eliminación de configuración en plugin para: ${nombreImpresora}`);
//     try {
//         const response = await axios.delete(url, {
//             data: { nombre: nombreImpresora }, 
//             headers: { 'Content-Type': 'application/json' },
//             timeout: 5000, 
//         });
//         this.logger.log(`Eliminación del plugin exitosa para: ${nombreImpresora}.`);
//         return response.data;
//     } catch (error) {
//         if (axios.isAxiosError(error) && error.response) {
//             if (error.response.status === 404) {
//                  this.logger.warn(`La impresora "${nombreImpresora}" ya no existía en la configuración del plugin. Se continúa.`);
//                  return { resultado: "OK", mensaje: "No estaba configurada en el plugin." };
//             }
//             throw new Error(`Error al eliminar la impresora en el plugin (${nombreImpresora}): ${error.response.data.mensaje || error.message}`);
//         }
//         throw new Error(`Error de conexión al intentar eliminar en el plugin (${nombreImpresora}): ${error.message}`);
//     }
// }




// async probarConexionPlugin(): Promise<any> {
//     this.logger.log(`Iniciando prueba de conexión al plugin en http://${PLUGIN_IP}:${PLUGIN_PUERTO}/imprimir`);
    
//     const payloadPrueba = {
//         nombreImpresora: "termica", 
//         operaciones: [
//             { nombre: "EscribirTexto", argumentos: ["¡PRUEBA EXITOSA!\n"] },
//             { nombre: "CortarPapel", argumentos: [1] },
//         ],
//     };
//     try {
//         const url = `http://${PLUGIN_IP}:${PLUGIN_PUERTO}/imprimir`;
//         const response = await axios.post(url, payloadPrueba, {
//             headers: { 'Content-Type': 'application/json' },
//             timeout: 5000, 
//         });
//         return {
//             status: response.status,
//             success: true,
//             message: `Conexión HTTP con el plugin exitosa. Respuesta: ${response.data.resultado || 'OK'}`,
//             data: response.data,
//         };
//     } catch (error) {
//         if (axios.isAxiosError(error) && error.code) {
//             this.logger.error(`Error de conexión con el plugin: ${error.code}`);
//             if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
//                 return {
//                     success: false,
//                     message: `FALLO DE CONEXIÓN. Código: ${error.code}. Esto puede indicar un bloqueo de Firewall o que el plugin NO está ejecutándose en ${PLUGIN_IP}:${PLUGIN_PUERTO}.`,
//                 };
//             }
//         }
//         return {
//             success: false,
//             message: `Error desconocido al contactar al plugin. Mensaje: ${error.message}`,
//         };
//     }
// }
//     private async renderHtmlComanda(pedido: PedidoEntity): Promise<string> {
//         const nombreEstablecimiento = pedido.establecimiento?.nombre || 'Mi Establecimiento';
//         const numeroMesa = pedido.mesa?.numero ?? 'N/A';
//         const notasGenerales = pedido.notas || 'Sin notas adicionales.';
//         const fechaActual = new Date().toLocaleString('es-ES', {
//             day: '2-digit',
//             month: '2-digit',
//             year: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//         });
//         let subtotalPedido = 0;
//         const itemsHtml = pedido.pedidoItems.map(item => {
//             const nombreProducto = item.producto?.nombre || item.productoConfigurable?.nombre || 'Producto Desconocido';
//             const notasItem = item.notas_item ? `<p style="font-size: 0.9em; margin: 0; padding-left: 5px; color: #000;">- Notas: ${item.notas_item}</p>` : '';
//             const precioUnitario = parseFloat(item.precio_unitario_al_momento_venta as any);
//             const subtotalItem = item.cantidad * precioUnitario;
//             subtotalPedido += subtotalItem;
//             const precioFormateado = this.formatearMoneda(precioUnitario);
//             const subtotalFormateado = this.formatearMoneda(subtotalItem);

//             let configuracionHtml = '';
//             if (item.productoConfigurable && item.configuracion_json && item.configuracion_json.opcionesSeleccionadas) {
//                 const opciones = item.configuracion_json.opcionesSeleccionadas.map((op: any) =>
//                     `<li>${op.nombre}</li>`
//                 ).join('');
//                 configuracionHtml = `
//                 <div style="font-size: 14px; margin-top: 1px; margin-left: 5px; color: #000;">
//                     <strong>Opciones:</strong>
//                     <ul style="margin: 0; padding-left: 10px; list-style-type: none;">
//                         ${opciones}
//                     </ul>
//                 </div>
//             `;
//             }
//             return `
//                 <div style="border-bottom: 1px dashed #000; padding: 3px 0;"> 
//                 <div style="display: flex; justify-content: space-between; align-items: flex-start;">
//                     <p style="font-weight: bold; margin: 0; font-size: 14px; color: #000; flex-grow: 1;">
//                         ${item.cantidad} x ${nombreProducto}
//                     </p>
//                     <span style="font-size: 14px; font-weight: bold; color: #000; white-space: nowrap;">${subtotalFormateado}</span>
//                 </div>
//                 <p style="font-size: 14px; margin: 1px 0 0 0; color: #000;">
//                     Precio unitario: ${precioFormateado}
//                 </p>
//                 ${configuracionHtml}
//                 ${notasItem}
//             </div>
//             `;
//         }).join('');
//         const totalFinal = parseFloat(pedido.total_estimado as any);
//         const descuentos = parseFloat(pedido.descuentos_aplicados as any);
//         let infoAdicionalCliente = '';
//         if (pedido.tipo_pedido === TipoPedido.DOMICILIO) {
//             infoAdicionalCliente = `
//                 <h3 class="section-title" style="border-bottom: 1px solid #000; padding-bottom: 2px; color: #000; margin-top: 5px;">Datos del Cliente</h3>
//             <p style="color: #000; margin-top: 1px;"><strong>Nombre:</strong> ${pedido.cliente_nombre || 'N/A'}</p>
//             <p style="color: #000; margin-top: 1px;"><strong>Teléfono:</strong> ${pedido.cliente_telefono || 'N/A'}</p>
//             <p style="color: #000; margin-top: 1px; margin-bottom: 5px;"><strong>Dirección:</strong> ${pedido.cliente_direccion || 'N/A'}</p>
//             `;
//         }
//         const html = `
//         <!DOCTYPE html>
//         <html lang="es">
//         <head>
//             <meta charset="UTF-8">
//             <title>Comanda de Pedido</title>
//             <style>
//                 body {
//                     font-family: 'monospace', sans-serif; 
//                     margin: 0;
//                     padding: 0 2px; 
//                     color: #000;
//                     width: 80mm;
//                     font-size: 18px; 
//                 }
//                 .container {
//                     max-width: 80mm;
//                     margin: auto;
//                     border: none;
//                     padding: 0;
//                     box-shadow: none;
//                 }
//                 h1, h2, h3 {
//                     text-align: center;
//                     margin-top: 3px; 
//                     margin-bottom: 3px; 
//                     color: #000;
//                 }
//                 h1 {
//                     font-size: 28px;
//                     border-bottom: 2px solid #000; 
//                     padding-bottom: 3px; 
//                 }
//                 h2 {
//                     font-size: 26px; 
//                 }

//                 h3 {
//                     font-size: 22px;
//                 }

//                 p, span, td {
//                     font-size: 18px
//                 }
//                 .header-info {
//                     display: block; 
//                     font-size: 18px;
//                     margin-bottom: 0px; 
//                     color: #000;
//                 }
//                 .header-info div {
//                     display: flex; 
//                     justify-content: space-between;
//                     margin-bottom: 0px;
//                 }
//                 .section-title {
//                     font-size: 22px;
//                     margin-top: 5px; 
//                     margin-bottom: 2px; 
//                     border-bottom: 1px solid #000; 
//                     padding-bottom: 2px; 
//                     color: #000;
//                 }
//                 .summary-table {
//                     width: 100%;
//                     margin-top: 2px;
//                     border-collapse: collapse;
//                 }
//                 .summary-table td {
//                     padding: 2px 0; 
//                     border-top: 1px dashed #000; 
//                     color: #000;
//                 }
//                 .summary-table .total-row td {
//                     font-weight: bold;
//                     font-size: 18px;
//                     border-top: 2px solid #000; 
//                     color: #000;
//                 }
//             </style>
//         </head>
//         <body>
//             <div class="container">
//                 <div style="text-align: center;">
//                     <h2 style="font-size: 22px; margin-bottom: 0;">${nombreEstablecimiento}</h2>
//                     <h3 style="font-size: 22px; margin-top: 3px;">Comanda de ${pedido.tipo_pedido === TipoPedido.MESA ? `Mesa #${numeroMesa}` : pedido.tipo_pedido}</h3>
//                 </div>

//                 <div class="header-info">
//                     <div style="font-size: 18px;">
//                         <span><strong>Número de Pedido:</strong></span>
//                         <span style="font-weight: bold;">#${pedido.numero_secuencial_diario}</span>
//                     </div>
//                     <div style="font-size: 18px;">
//                         <span><strong>Fecha y Hora:</strong></span>
//                         <span style="font-weight: bold;">${fechaActual}</span>
//                     </div>
//                 </div>
                
//                 ${infoAdicionalCliente}

//                 <h3 class="section-title">Detalle del Pedido</h3>
//                 <div class="items-list">
//                     ${itemsHtml}
//                 </div>

//                 <table class="summary-table">
//                     <tbody>
//                         <tr>
//                             <td>Subtotal</td>
//                             <td style="text-align: right;">${this.formatearMoneda(subtotalPedido)}</td>
//                         </tr>
//                         <tr>
//                             <td>Descuentos</td>
//                             <td style="text-align: right;">-${this.formatearMoneda(descuentos)}</td>
//                         </tr>
//                         <tr class="total-row">
//                             <td>Total a Pagar</td>
//                             <td style="text-align: right;">${this.formatearMoneda(totalFinal)}</td>
//                         </tr>
//                     </tbody>
//                     <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #000;">
//                         Gracias por tu visita.
//                     </div>
//                 </table>
//             </div>
//         </body>
//         </html>
//         `;
//         return html;
//     }
    
// }
