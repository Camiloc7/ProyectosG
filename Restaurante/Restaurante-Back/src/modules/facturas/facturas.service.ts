import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, DeleteResult, EntityManager } from 'typeorm';
import { EstadoEnvioFactura, FacturaEntity, TipoFactura } from './entities/factura.entity';
import { FacturaPedidoEntity } from './entities/factura-pedido.entity';
import { UpdateFacturaDto } from './dto/update-factura.dto';
import { EstablecimientosService } from '../establecimientos/establecimientos.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { PedidoEntity, EstadoPedido } from '../pedidos/entities/pedido.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { v4 as uuidv4 } from 'uuid';
import { ClienteEntity } from '../clientes/entities/cliente.entity';
import { PagoEntity } from '../pagos/entities/pago.entity';
import { CreateFacturaAndPaymentDto } from './dto/create-factura-and-payment.dto';
import { CuentasBancariasService } from '../cuentas-banco/cuentas-bancarias.service';
import { CuentaBancariaEntity } from '../cuentas-banco/entities/cuenta-bancaria.entity';
import { FacturaPagosCliente } from './entities/factura-pagos-cliente.entity';
import axios from 'axios';
import { EstablecimientoEntity } from '../establecimientos/entities/establecimiento.entity';
import { UsuarioEntity } from '../usuarios/entities/usuario.entity';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { PedidoItemEntity } from '../pedidos/entities/pedido-item.entity';
import { ProductoEntity } from '../productos/entities/producto.entity';
import * as ejs from 'ejs';
import puppeteer from 'puppeteer';
import { FacturaRetryEntity } from './entities/factura-retry.entity';
import { ImpresionService } from '../impresion/impresion.service';
import { WebSocketEventsService } from 'src/websocket/services/websocket-events.service';
const EPSILON = 0.01;
@Injectable()
export class FacturasService {
    private readonly EPSILON = 0.0001;
    private readonly logger = new Logger(FacturasService.name);
    constructor(
        @InjectRepository(FacturaEntity)
        private readonly facturaRepository: Repository<FacturaEntity>,
        @InjectRepository(FacturaPedidoEntity)
        private readonly facturaPedidoRepository: Repository<FacturaPedidoEntity>,
        @InjectRepository(FacturaRetryEntity)
        private readonly facturaRetryRepository: Repository<FacturaRetryEntity>,
        @InjectRepository(ClienteEntity)
        private readonly clienteRepository: Repository<ClienteEntity>,
        @InjectRepository(FacturaPagosCliente)
        private readonly facturaPagosClienteRepository: Repository<FacturaPagosCliente>,
        @InjectRepository(PagoEntity)
        private readonly pagoRepository: Repository<PagoEntity>,
        private readonly establecimientosService: EstablecimientosService,
        private readonly pedidosService: PedidosService,
        private readonly usuariosService: UsuariosService,
        private readonly cuentasBancariasService: CuentasBancariasService,
        private dataSource: DataSource,
        @InjectRepository(PedidoEntity)
        private readonly pedidoRepository: Repository<PedidoEntity>,
        private readonly impresionService: ImpresionService,
        private readonly websocketEventsService: WebSocketEventsService,

    ) { }
    private async getOrCreateCliente(
        clientData: {
            tipo_documento?: string | null;
            numero_documento?: string | null;
            nombre_completo?: string | null;
            correo_electronico?: string | null;
            direccion?: string | null;
            telefono?: string | null;
            DV?: string | null;
        },
        establecimiento: EstablecimientoEntity,
        manager?: EntityManager,
    ): Promise<ClienteEntity> {
        const finalManager = manager || this.clienteRepository.manager;
        if (
            !clientData.tipo_documento ||
            !clientData.numero_documento ||
            clientData.tipo_documento === '' ||
            clientData.numero_documento === ''
        ) {
            const genericCliente = finalManager.create(ClienteEntity, {
                tipo_documento: clientData.tipo_documento === '' ? null : clientData.tipo_documento || 'N/A',
                numero_documento: clientData.numero_documento === '' ? null : clientData.numero_documento || uuidv4(),
                nombre_completo: clientData.nombre_completo || 'Cliente Genérico',
                correo_electronico: clientData.correo_electronico || null,
                direccion: clientData.direccion || null,
                telefono: clientData.telefono || null,
                DV: clientData.DV || null,
                establecimiento_id: establecimiento.id,
            });
            await finalManager.save(genericCliente);
            return genericCliente;
        }
        let cliente = await finalManager.findOne(ClienteEntity, {
            where: {
                tipo_documento: clientData.tipo_documento,
                numero_documento: clientData.numero_documento,
                establecimiento_id: establecimiento.id,
            },
        });
        if (!cliente) {
            try {
                const externalClientData = await this.fetchClientFromExternalApi(
                    clientData.tipo_documento,
                    clientData.numero_documento,
                    establecimiento,
                );
                cliente = finalManager.create(ClienteEntity, {
                    tipo_documento: clientData.tipo_documento,
                    numero_documento: clientData.numero_documento,
                    nombre_completo: externalClientData?.nombre || clientData.nombre_completo || 'Cliente Genérico',
                    correo_electronico: externalClientData?.email || clientData.correo_electronico || null,
                    direccion: clientData.direccion || null,
                    telefono: clientData.telefono || null,
                    DV: clientData.DV || null,
                    establecimiento_id: establecimiento.id,
                });
            } catch (error: any) {
                console.warn(
                    `No se pudo recuperar información del cliente externo para ${clientData.numero_documento}: ${error.message}`,
                );
                cliente = finalManager.create(ClienteEntity, {
                    tipo_documento: clientData.tipo_documento,
                    numero_documento: clientData.numero_documento,
                    nombre_completo: clientData.nombre_completo || 'Cliente Genérico',
                    correo_electronico: clientData.correo_electronico || null,
                    direccion: clientData.direccion || null,
                    telefono: clientData.telefono || null,
                    DV: clientData.DV || null,
                    establecimiento_id: establecimiento.id,
                });
            }
            await finalManager.save(cliente);
        } else {
            let updated = false;
            const updateField = (
                clientInstance: ClienteEntity,
                field: keyof ClienteEntity,
                value: string | null | undefined,
            ) => {
                if (value !== undefined && clientInstance[field] !== value) {
                    (clientInstance[field] as string | null) = value;
                    updated = true;
                }
            };
            updateField(cliente, 'nombre_completo', clientData.nombre_completo);
            updateField(cliente, 'correo_electronico', clientData.correo_electronico);
            updateField(cliente, 'direccion', clientData.direccion);
            updateField(cliente, 'telefono', clientData.telefono);
            updateField(cliente, 'DV', clientData.DV);
            if (updated) {
                await finalManager.save(cliente);
            }
        }
        return cliente;
    }
    private async fetchClientFromExternalApi(
        tipoDocumento: string,
        numeroDocumento: string,
        establecimiento: EstablecimientoEntity,
    ): Promise<{ nombre?: string; email?: string } | null> {
        const apiKey = establecimiento.api_key;
        const nit = establecimiento.nit;
        const apiUrl = 'https://gestionhumana.qualitysoftservices.com/index.php/api/cliente/recuperar-informacion';

        const requestBody = {
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento,
        };
        try {
            const response = await axios.post(apiUrl, requestBody, {
                headers: {
                    'api-key': apiKey,
                    'nit': nit,
                },
            });
            const data = response.data;
            if (!data || !data.dataApi) {
                console.error('La API externa no devolvió datos válidos.');
                return null;
            }
            const clientData = data.dataApi;
            const nombreCompleto = [
                clientData.primerNombre,
                clientData.segundoNombre,
                clientData.primerApellido,
                clientData.segundoApellido
            ].filter(Boolean).join(' ');
            return {
                nombre: nombreCompleto,
                email: undefined
            };

        } catch (error: any) {
            console.error('[fetchClientFromExternalApi] Error al consultar la API externa:', error.message);
            if (axios.isAxiosError(error) && error.response) {
                console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
            }
            return null;
        }
    }
    public async findOneWithRelations(id: string, establecimientoId: string): Promise<FacturaEntity | null> {
        return this.facturaRepository.findOne({
            where: { id, establecimiento_id: establecimientoId },
            relations: [
                'pagos',
                'pagos.pago',
                'pagos.pago.cuentaBancaria',
                'pagos.cliente',
                'usuarioCajero',
                'establecimiento',
            ],
        });
    }

    public async findAll(
        establecimientoId: string,
        tipoFactura?: TipoFactura,
        usuarioCajeroId?: string,
        fechaInicio?: Date,
        fechaFin?: Date,
    ): Promise<FacturaEntity[]> {
        const whereCondition: any = {
            establecimiento_id: establecimientoId,
        };

        if (tipoFactura) whereCondition.tipo_factura = tipoFactura;
        if (usuarioCajeroId) whereCondition.usuario_cajero_id = usuarioCajeroId;

        if (fechaInicio && fechaFin) {
            whereCondition.fecha_hora_factura = Between(fechaInicio, fechaFin);
        } else if (fechaInicio) {
            whereCondition.fecha_hora_factura = MoreThanOrEqual(fechaInicio);
        } else if (fechaFin) {
            whereCondition.fecha_hora_factura = LessThanOrEqual(fechaFin);
        }

        return await this.facturaRepository.find({
            where: whereCondition,
            relations: [
                'establecimiento',
                'usuarioCajero',
                'facturaPedidos',
                'facturaPedidos.pedido',
                'pagos',
                'pagos.cliente',
                'pagos.cuentaBancaria',
            ],
            select: [
                'id', 'establecimiento_id', 'usuario_cajero_id', 'tipo_factura', 'subtotal',
                'impuestos', 'descuentos', 'propina', 'total_factura', 'sales_code',
                'estado_envio_api', 'error_envio_api', 'notas', 'estado',
                'fecha_hora_factura', 'created_at', 'updated_at', 'cierre_caja_id'
            ],
            order: { fecha_hora_factura: 'DESC' },
        });
    }
    public async findOne(id: string, establecimientoId?: string): Promise<FacturaEntity> {
        const whereCondition: any = { id };
        if (establecimientoId) {
            whereCondition.establecimiento_id = establecimientoId;
        }
        const relationsToLoad = [
            'establecimiento',
            'usuarioCajero',
            'facturaPedidos',
            'facturaPedidos.pedido',
            'facturaPedidos.pedido.pedidoItems',
            'facturaPedidos.pedido.pedidoItems.producto',
            'pagos',
            'pagos.cliente',
            'pagos.cuentaBancaria',
            'pagos.pago',
            'pagos.pago.cuentaBancaria'
        ];
        try {
            const findOptions = {
                where: whereCondition,
                relations: relationsToLoad,
            };
            const factura = await this.facturaRepository.findOne(findOptions);
            if (!factura) {
                const errorMessage = establecimientoId
                    ? `Factura con ID "${id}" no encontrada en el establecimiento "${establecimientoId}".`
                    : `Factura con ID "${id}" no encontrada.`;
                console.warn(`[findOne] ${errorMessage}`);
                throw new NotFoundException(errorMessage);
            }
            return factura;
        } catch (error) {
            console.error(`[findOne] Error al buscar factura con ID ${id}:`, error.message);
            throw error;
        }
    }
    private sumDenominations(denominations: { [key: string]: number }): number {
        let total = 0;
        for (const key in denominations) {
            if (denominations.hasOwnProperty(key)) {
                const valueMatch = key.match(/\d+/);
                const denominationValue = valueMatch ? Number(valueMatch[0]) : 0;
                total += denominationValue * Number(denominations[key]);
            }
        }
        return total;
    }

    public async createFacturaAndPaymentForOrder(
        createFacturaAndPaymentDto: CreateFacturaAndPaymentDto,
        usuarioCajeroId: string,
        establecimientoId: string,
    ): Promise<FacturaEntity> {
        const {
            pedido_id,
            numero_documento,
            nombre_completo,
            correo_electronico,
            tipo_documento,
            direccion,
            telefono,
            DV,
            notas,
            es_efectivo,
            cuenta_id,
            denominaciones_efectivo,
        } = createFacturaAndPaymentDto;
        const monto_pagado_dto = Number(createFacturaAndPaymentDto.monto_pagado);
        const propina = Number(createFacturaAndPaymentDto.propina || 0);
        const descuentos = Number(createFacturaAndPaymentDto.descuentos || 0);

        if (isNaN(monto_pagado_dto) || monto_pagado_dto <= 0) {
            throw new BadRequestException('El monto pagado debe ser un valor numérico positivo.');
        }
        if (isNaN(propina) || propina < 0) {
            throw new BadRequestException('La propina debe ser un valor numérico no negativo.');
        }
        if (isNaN(descuentos) || descuentos < 0 || descuentos > 100) {
            throw new BadRequestException('El descuento debe ser un valor numérico entre 0 y 100.');
        }
        const referencia_transaccion_dto = (createFacturaAndPaymentDto as any).referencia_transaccion;
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let savedFactura: FacturaEntity;
        let clienteParaApi: ClienteEntity;
        let cuentaBancariaParaApi: CuentaBancariaEntity;
        let pedidoCompletoParaApi: PedidoEntity;
        try {
            const establecimiento = await this.establecimientosService.findOne(establecimientoId);
            const usuarioCajero = await this.usuariosService.findOne(usuarioCajeroId, establecimientoId);
            if (!establecimiento || !usuarioCajero) {
                throw new NotFoundException('Establecimiento o usuario cajero no encontrado.');
            }

            const pedido = await queryRunner.manager.findOne(PedidoEntity, {
                where: { id: pedido_id, establecimiento_id: establecimientoId },
                relations: [
                    'establecimiento',
                    'facturaPedidos',
                    'facturaPedidos.factura',
                    'pedidoItems',
                    'pedidoItems.producto',
                    'pedidoItems.productoConfigurable',
                ],
            });
            if (!pedido) {
                throw new NotFoundException(`Pedido con ID "${pedido_id}" no encontrado.`);
            }
            if (
                ![
                    EstadoPedido.ABIERTO,
                    EstadoPedido.ENVIADO_A_COCINA,
                    EstadoPedido.EN_PREPARACION,
                    EstadoPedido.LISTO_PARA_ENTREGAR,
                    EstadoPedido.CERRADO,
                    EstadoPedido.ENTREGADO,
                    EstadoPedido.PENDIENTE_PAGO,
                    EstadoPedido.EN_REPARTO,
                ].includes(pedido.estado)
            ) {
                throw new BadRequestException(
                    `El pedido con ID "${pedido.id}" no está en un estado válido para facturar.`
                );
            }
            const facturasDelPedido = await queryRunner.manager.find(FacturaPedidoEntity, {
                where: { pedido_id: pedido.id },
            });
            const montoYaFacturado = facturasDelPedido.reduce((sum, fp) => sum + Number(fp.monto_aplicado), 0);
            let pedidoTotalEstimado = Number(pedido.total_estimado);
            if (descuentos > 0 && Math.abs(Number(pedido.descuentos_aplicados)) < this.EPSILON) {
                const montoDescuentoCalculado = pedidoTotalEstimado * (descuentos / 100);
                pedido.descuentos_aplicados = montoDescuentoCalculado;
                pedido.total_estimado = pedidoTotalEstimado - montoDescuentoCalculado;
                await queryRunner.manager.save(PedidoEntity, pedido);
                pedidoTotalEstimado = Number(pedido.total_estimado);
            }
            const montoRestanteDelPedido = pedidoTotalEstimado - montoYaFacturado;
            if (montoRestanteDelPedido <= this.EPSILON) {
                throw new ConflictException(`El pedido con ID "${pedido_id}" ya está completamente facturado.`);
            }

            let montoRealAPlicarAFactura: number;
            let montoRecibidoParaPagoEntity: number;
            let propinaAdicional = 0;

            if (es_efectivo) {
                cuentaBancariaParaApi = cuenta_id
                    ? await this.cuentasBancariasService.findOne(cuenta_id, establecimientoId)
                    : await this.cuentasBancariasService.findDefaultCashAccount(establecimientoId);
                if (!cuentaBancariaParaApi.medio_pago_asociado?.es_efectivo) {
                    throw new BadRequestException(`La cuenta "${cuentaBancariaParaApi.nombre_banco}" no está asociada a un medio de pago efectivo.`);
                }
                montoRealAPlicarAFactura = Math.min(monto_pagado_dto, montoRestanteDelPedido);
                montoRecibidoParaPagoEntity = this.sumDenominations(denominaciones_efectivo || {});
                if (montoRecibidoParaPagoEntity === 0 && monto_pagado_dto > 0) {
                    montoRecibidoParaPagoEntity = monto_pagado_dto;
                }
            } else {
                if (!cuenta_id) {
                    throw new BadRequestException('Para pagos no en efectivo, se debe proporcionar una cuenta bancaria.');
                }
                cuentaBancariaParaApi = await this.cuentasBancariasService.findOne(cuenta_id, establecimientoId);

                if (monto_pagado_dto > montoRestanteDelPedido + 100) {
                    throw new BadRequestException(`El monto pagado (${monto_pagado_dto.toFixed(2)}) excede el monto restante del pedido (${montoRestanteDelPedido.toFixed(2)}) en más de 100.`);
                }

                if (monto_pagado_dto > montoRestanteDelPedido) {
                    propinaAdicional = monto_pagado_dto - montoRestanteDelPedido;
                }

                montoRealAPlicarAFactura = Math.min(monto_pagado_dto, montoRestanteDelPedido);
                montoRecibidoParaPagoEntity = monto_pagado_dto;
            }

            if (!cuentaBancariaParaApi.activa) {
                throw new BadRequestException(`La cuenta bancaria "${cuentaBancariaParaApi.nombre_banco}" no está activa.`);
            }

            const subtotalFactura = montoRealAPlicarAFactura;
            const impuestosFactura = 0;
            const descuentosFactura = 0;
            const propinaFactura = propina + propinaAdicional;
            const totalFacturaCalculado = subtotalFactura + impuestosFactura - descuentosFactura + propinaFactura;

            const lastFactura = await queryRunner.manager.findOne(FacturaEntity, {
                where: { establecimiento_id: establecimientoId },
                order: { fecha_hora_factura: 'DESC' },
                select: ['sales_code']
            });
            let nextSalesCode: string;
            if (lastFactura && lastFactura.sales_code) {
                const lastSalesCodeAsNumber = parseInt(lastFactura.sales_code, 10);
                const nextSalesCodeNumber = lastSalesCodeAsNumber + 1;
                nextSalesCode = nextSalesCodeNumber.toString();
            } else {
                nextSalesCode = '1';
            }
            const nuevaFactura = new FacturaEntity();
            nuevaFactura.establecimiento_id = establecimientoId;
            nuevaFactura.usuario_cajero_id = usuarioCajeroId;
            nuevaFactura.tipo_factura = (Math.abs(montoRealAPlicarAFactura - montoRestanteDelPedido) < this.EPSILON && !pedido.facturaPedidos.length) ? TipoFactura.TOTAL : TipoFactura.PARCIAL;
            nuevaFactura.subtotal = isNaN(subtotalFactura) ? 0 : subtotalFactura;
            nuevaFactura.impuestos = isNaN(impuestosFactura) ? 0 : impuestosFactura;
            nuevaFactura.descuentos = isNaN(descuentosFactura) ? 0 : descuentosFactura;
            nuevaFactura.propina = isNaN(propinaFactura) ? 0 : propinaFactura;
            nuevaFactura.total_factura = isNaN(totalFacturaCalculado) ? 0 : totalFacturaCalculado;
            nuevaFactura.notas = notas || null;
            nuevaFactura.fecha_hora_factura = new Date();
            nuevaFactura.sales_code = nextSalesCode;
            nuevaFactura.estado_envio_api = EstadoEnvioFactura.PENDIENTE;
            nuevaFactura.pdf_factura_data = null;
            nuevaFactura.error_envio_api = null;
            savedFactura = await queryRunner.manager.save(FacturaEntity, nuevaFactura);
            savedFactura.usuarioCajero = usuarioCajero;
            const facturaPedido = new FacturaPedidoEntity();
            Object.assign(facturaPedido, {
                id: uuidv4(),
                factura_id: savedFactura.id,
                pedido_id: pedido.id,
                monto_aplicado: montoRealAPlicarAFactura,
            });
            await queryRunner.manager.save(FacturaPedidoEntity, facturaPedido);
            clienteParaApi = await this.getOrCreateCliente(
                {
                    tipo_documento,
                    numero_documento,
                    nombre_completo,
                    correo_electronico,
                    direccion,
                    telefono,
                    DV,
                },
                establecimiento,
                queryRunner.manager,
            );
            const newFacturaPagosCliente = queryRunner.manager.create(FacturaPagosCliente, {
                id: uuidv4(),
                factura_id: savedFactura.id,
                cliente_id: clienteParaApi.id,
                cuenta_bancaria_id: cuentaBancariaParaApi.id,
                monto_pagado: montoRealAPlicarAFactura,
                metodo_pago: cuentaBancariaParaApi.medio_pago_asociado?.nombre || 'Desconocido',
            });
            await queryRunner.manager.save(FacturaPagosCliente, newFacturaPagosCliente);
            const newPagoEntity = queryRunner.manager.create(PagoEntity, {
                factura_id: savedFactura.id,
                establecimiento_id: establecimientoId,
                cuenta_bancaria_id: cuentaBancariaParaApi.id,
                monto_recibido: montoRecibidoParaPagoEntity,
                referencia_transaccion: es_efectivo ? null : referencia_transaccion_dto || null,
                denominaciones_efectivo: es_efectivo ? denominaciones_efectivo : null,
                fecha_hora_pago: new Date(),
                cierre_caja_id: null,
                factura_pagos_cliente_id: newFacturaPagosCliente.id,
            });
            await queryRunner.manager.save(PagoEntity, newPagoEntity);

            const totalMontoFacturadoParaPedido = (
                await queryRunner.manager.find(FacturaPedidoEntity, {
                    where: { pedido_id: pedido.id },
                })
            ).reduce((sum, fp) => sum + Number(fp.monto_aplicado), 0);
            if (Math.abs(totalMontoFacturadoParaPedido - pedidoTotalEstimado) < this.EPSILON) {
                if (
                    pedido.estado !== EstadoPedido.PAGADO
                ) {
                    await this.pedidosService.updatePedidoStatus(
                        pedido.id,
                        EstadoPedido.PAGADO,
                        establecimientoId,
                        usuarioCajeroId,
                        queryRunner.manager,
                    );
                }
            }
            pedidoCompletoParaApi = pedido;
            await queryRunner.commitTransaction();
        } catch (error: any) {
            console.error(`[createFacturaAndPaymentForOrder] Error detectado durante la transacción: ${error.message}`);
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
        }


        try {
            const establecimientoParaApi = await this.establecimientosService.findOne(establecimientoId);
            const usuarioCajeroParaApi = await this.usuariosService.findOne(usuarioCajeroId, establecimientoId);


            //Validar si establecimiento factura electronicamente
            let pdfBuffer: Buffer | null = null;
            if (clienteParaApi.numero_documento !== '111111111111') {
                pdfBuffer = await this.enviarFacturaAPIExterna(
                    savedFactura,
                    pedidoCompletoParaApi,
                    clienteParaApi,
                    usuarioCajeroParaApi,
                    cuentaBancariaParaApi,
                    establecimientoParaApi,
                );
            }

            if (pdfBuffer) {
                await this.facturaRepository.update(savedFactura.id, {
                    pdf_factura_data: pdfBuffer,
                    estado_envio_api: EstadoEnvioFactura.ENVIADO,
                    error_envio_api: null,
                });
                console.log('[createFacturaAndPaymentForOrder] PDF y estado de envío actualizados con éxito.');
                savedFactura.pdf_factura_data = pdfBuffer;
                savedFactura.estado_envio_api = EstadoEnvioFactura.ENVIADO;
            } else {
                console.warn('[createFacturaAndPaymentForOrder] Envío a API fallido: No se recibió PDF.');
                const localPdfBuffer = await this.generateLocalFallbackPdf(savedFactura, pedidoCompletoParaApi, clienteParaApi);
                await this.facturaRepository.update(savedFactura.id, {
                    pdf_factura_data: localPdfBuffer,
                    estado_envio_api: EstadoEnvioFactura.FALLIDO,
                    error_envio_api: 'La API externa no devolvió un PDF.',
                });
                savedFactura.pdf_factura_data = localPdfBuffer;
                savedFactura.estado_envio_api = EstadoEnvioFactura.FALLIDO;
            }
        } catch (error: any) {
            console.error(`[createFacturaAndPaymentForOrder] Error en envío a API externa: ${error.message}`);
            const localPdfBuffer = await this.generateLocalFallbackPdf(savedFactura, pedidoCompletoParaApi, clienteParaApi);
            await this.facturaRepository.update(savedFactura.id, {
                pdf_factura_data: localPdfBuffer,
                estado_envio_api: EstadoEnvioFactura.FALLIDO,
                error_envio_api: error.message,
            });
            savedFactura.pdf_factura_data = localPdfBuffer;
            savedFactura.estado_envio_api = EstadoEnvioFactura.FALLIDO;

        }

        if (savedFactura && pedidoCompletoParaApi) {
            try {
                await this.impresionService.enviarFacturaAImpresora(savedFactura, pedidoCompletoParaApi, establecimientoId);
            } catch (error) {
                console.error(
                    `Error al imprimir factura ${savedFactura.id} del pedido ${pedidoCompletoParaApi.id}:`,
                    error,
                );
            }
        }
        if (savedFactura && this.websocketEventsService) {
            this.websocketEventsService.emitFacturaCreated(establecimientoId, savedFactura.id);
        } else {
            console.error('No se pudo emitir el evento de factura creada.');
        }

        return savedFactura;
    }

    public async findPendingInvoices(): Promise<FacturaEntity[]> {
        return this.facturaRepository.find({
            where: [
                { estado_envio_api: EstadoEnvioFactura.PENDIENTE },
                { estado_envio_api: EstadoEnvioFactura.FALLIDO },
            ],
            relations: ['establecimiento', 'usuarioCajero', 'facturaPedidos.pedido.pedidoItems.producto', 'pagos.cliente', 'pagos.cuentaBancaria'],
        });
    }
    public async resendInvoiceToApi(facturaId: string, establecimientoId: string): Promise<void> {
        try {
            const factura = await this.findOneWithRelations(facturaId, establecimientoId);
            if (!factura) {
                throw new NotFoundException(`Factura con ID "${facturaId}" no encontrada.`);
            }
            const pedido = await this.pedidosService.findPedidoByFacturaId(facturaId);
            if (!pedido) {
                throw new NotFoundException(`Pedido relacionado con la factura "${facturaId}" no encontrado.`);
            }
            const cliente = factura.pagos && factura.pagos[0] ? factura.pagos[0].cliente : null;
            if (!cliente) {
                throw new Error('Cliente no encontrado en los pagos de la factura.');
            }
            const usuarioCajero = factura.usuarioCajero;
            if (!usuarioCajero) {
                throw new Error('Usuario cajero no encontrado en la factura.');
            }

            const establecimiento = factura.establecimiento;
            if (!establecimiento) {
                throw new Error('Establecimiento no encontrado en la factura.');
            }

            const cuentaBancariaParaPago = factura.pagos && factura.pagos[0] && factura.pagos[0].pago && factura.pagos[0].pago.cuentaBancaria
                ? factura.pagos[0].pago.cuentaBancaria
                : null;
            if (!cuentaBancariaParaPago) {
                throw new Error('Cuenta bancaria para el pago no encontrada.');
            }
            const pdfBase64 = await this.enviarFacturaAPIExterna(
                factura,
                pedido,
                cliente,
                usuarioCajero,
                cuentaBancariaParaPago,
                establecimiento
            );
            if (pdfBase64) {
                await this.facturaRepository.update(facturaId, {
                    pdf_factura_data: pdfBase64,
                    estado_envio_api: EstadoEnvioFactura.ENVIADO,
                    error_envio_api: null
                });
                console.log(`[resendInvoiceToApi] Factura ${facturaId} reenviada con éxito.`);
            } else {
                await this.facturaRepository.update(facturaId, {
                    estado_envio_api: EstadoEnvioFactura.FALLIDO,
                    error_envio_api: 'La API no devolvió el PDF.'
                });
                console.warn(`[resendInvoiceToApi] Envío de factura ${facturaId} falló: No se recibió PDF.`);
            }
        } catch (error: any) {
            console.error(`[resendInvoiceToApi] Error general al reenviar factura ${facturaId}: ${error.message}`);
            await this.facturaRepository.update(facturaId, {
                estado_envio_api: EstadoEnvioFactura.FALLIDO,
                error_envio_api: error.message
            });
        }
    }

    private async generateLocalFallbackPdf(
        factura: FacturaEntity,
        pedido: PedidoEntity,
        cliente: ClienteEntity
    ): Promise<Buffer> {
        const fechaHoraFactura = new Date(factura.fecha_hora_factura);
        const timeZone = 'America/Bogota';
        const templateData = {
            nombre_gastro: 'GASTRO-POS',
            resolution_number: 'N/A',
            prefix: '',
            number: String(factura.sales_code),
            date: fechaHoraFactura.toLocaleDateString('es-CO', { timeZone }),
            time: fechaHoraFactura.toLocaleTimeString('es-CO', { timeZone }),
            customer_name: cliente.nombre_completo,
            identification_number: cliente.numero_documento,
            customer_dv: cliente.DV,
            customer_address: cliente.direccion,
            items: pedido.pedidoItems.map(item => ({
                nombre: item.producto ? item.producto.nombre : 'Producto no disponible',
                cantidad: item.cantidad,
                precio: item.precio_unitario_al_momento_venta,
            })),
            legal_monetary_totals: {
                tax_exclusive_amount: Number(factura.subtotal),
            },
            total: Number(factura.total_factura),
            cufe: 'Factura será enviada por correo',
        };

        const htmlContent = ejs.render(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Arial', sans-serif; font-size: 10px; }
                .ticket { width: 72mm; margin: 0 auto; text-align: left; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .line { border-top: 1px dashed black; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 2px 0; text-align: left; }
                thead th { border-bottom: 1px solid black; }
            </style>
        </head>
        <body>
            <div class="ticket">
                <p class="center bold"><%= data.nombre_gastro %></p>
                <p class="center">FACTURA DE VENTA POS</p>
                <p>Resolución No. <%= data.resolution_number %></p>
                <p>Factura: <%= data.number %></p>
                <p>Fecha: <%= data.date %></p>
                <p>Hora: <%= data.time %></p>
                <div class="line"></div>
                <p>Cliente: <%= data.customer_name %></p>
                <p>ID: <%= data.identification_number %></p>
                <p>Dirección: <%= data.customer_address %></p>
                <div class="line"></div>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Cant.</th>
                            <th>Precio</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% data.items.forEach(item => { %>
                        <tr>
                            <td><%= item.nombre %></td>
                            <td><%= item.cantidad %></td>
                            <td><%= item.precio %></td>
                            <td><%= (item.cantidad * item.precio).toFixed(2) %></td>
                        </tr>
                        <% }); %>
                    </tbody>
                </table>
                <div class="line"></div>
                <p>Subtotal: <%= data.legal_monetary_totals.tax_exclusive_amount.toFixed(2) %></p>
                <p class="bold">Total a Pagar: <%= data.total.toFixed(2) %></p>
                <div class="line"></div>
                <div style="text-align: center; margin-top: 10px;">
                    <% if (data.cufe) { %>
                        <p class="center">CUFE: <%= data.cufe %></p>
                    <% } else { %>
                        <p class="center bold">El CUFE será enviado a su correo.</p>
                    <% } %>
                </div>
            </div>
        </body>
        </html>
    `, { data: templateData });

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            width: '72mm',
            printBackground: true,
        });

        await browser.close();

        return Buffer.from(pdfBuffer);
    }

    async getInvoicePdf(facturaId: string, establecimientoId: string): Promise<Buffer | null> {
        const factura = await this.facturaRepository.findOne({
            where: { id: facturaId, establecimiento_id: establecimientoId },
            select: ['id', 'establecimiento_id', 'pdf_factura_data'],
        });

        if (!factura) return null;
        if (factura.pdf_factura_data) {
            return Buffer.isBuffer(factura.pdf_factura_data)
                ? factura.pdf_factura_data
                : Buffer.from(factura.pdf_factura_data);
        }
        const facturaPedido = await this.facturaPedidoRepository.findOne({ where: { factura_id: facturaId } });
        if (!facturaPedido) {
            console.warn(`[getInvoicePdf] No se encontró facturaPedido para la factura ID: ${facturaId}.`);
            return null;
        }

        const pedido = await this.pedidoRepository.findOne({
            where: { id: facturaPedido.pedido_id },
            relations: ['pedidoItems', 'pedidoItems.producto'],
        });

        const facturaPagoCliente = await this.facturaPagosClienteRepository.findOne({ where: { factura_id: facturaId } });
        if (!pedido || !facturaPagoCliente) {
            console.warn(`[getInvoicePdf] Faltan detalles del pedido o del pago para la factura ID: ${facturaId}.`);
            return null;
        }

        const cliente = await this.clienteRepository.findOne({ where: { id: facturaPagoCliente.cliente_id } });
        if (!cliente) {
            console.warn(`[getInvoicePdf] No se encontró el cliente para la factura ID: ${facturaId}.`);
            return null;
        }

        return this.generateLocalFallbackPdf(factura, pedido, cliente);
    }
    public async update(id: string, updateFacturaDto: UpdateFacturaDto, establecimientoId: string): Promise<FacturaEntity> {
        const factura = await this.findOne(id, establecimientoId);
        if (updateFacturaDto.notas !== undefined) factura.notas = updateFacturaDto.notas;
        if (updateFacturaDto.subtotal !== undefined) factura.subtotal = updateFacturaDto.subtotal;
        if (updateFacturaDto.impuestos !== undefined) factura.impuestos = updateFacturaDto.impuestos;
        if (updateFacturaDto.descuentos !== undefined) factura.descuentos = updateFacturaDto.descuentos;
        if (updateFacturaDto.propina !== undefined) factura.propina = updateFacturaDto.propina;
        if (
            updateFacturaDto.total_factura !== undefined ||
            updateFacturaDto.subtotal !== undefined ||
            updateFacturaDto.impuestos !== undefined ||
            updateFacturaDto.descuentos !== undefined ||
            updateFacturaDto.propina !== undefined
        ) {
            const currentSubtotal =
                updateFacturaDto.subtotal !== undefined ? updateFacturaDto.subtotal : factura.subtotal;
            const currentImpuestos =
                updateFacturaDto.impuestos !== undefined ? updateFacturaDto.impuestos : factura.impuestos;
            const currentDescuentos =
                updateFacturaDto.descuentos !== undefined ? updateFacturaDto.descuentos : factura.descuentos;
            const currentPropina =
                updateFacturaDto.propina !== undefined ? updateFacturaDto.propina : factura.propina;
            const calculatedTotalFactura = currentSubtotal + currentImpuestos - currentDescuentos + currentPropina;
            if (
                updateFacturaDto.total_factura !== undefined &&
                Math.abs(updateFacturaDto.total_factura - calculatedTotalFactura) > EPSILON
            ) {
                throw new BadRequestException(
                    `El total_factura proporcionado (${updateFacturaDto.total_factura.toFixed(
                        2,
                    )}) no coincide con el cálculo (${calculatedTotalFactura.toFixed(
                        2,
                    )}: subtotal + impuestos - descuentos + propina) al actualizar.`,
                );
            }
            factura.total_factura =
                updateFacturaDto.total_factura !== undefined
                    ? updateFacturaDto.total_factura
                    : calculatedTotalFactura;
        }
        return await this.facturaRepository.save(factura);
    }
    public async remove(id: string, establecimientoId: string): Promise<DeleteResult> {
        await this.findOne(id, establecimientoId);
        const result = await this.facturaRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Factura con ID "${id}" no encontrada para eliminar.`);
        }
        return result;
    }
    private async enviarFacturaAPIExterna(
        factura: FacturaEntity,
        pedido: PedidoEntity,
        cliente: ClienteEntity,
        usuarioCajero: UsuarioEntity,
        cuentaBancariaParaPago: CuentaBancariaEntity,
        establecimiento: EstablecimientoEntity,
    ) {
        try {
            const IVA_PORCENTAJE = 0.19;
            const IC_PORCENTAJE = 0.08;
            const itemsParaAPI = pedido.pedidoItems.map(item => {
                if (!item.producto) {
                    throw new Error(`El producto para el item de pedido con ID "${item.id}" no se encontró.`);
                }
                let precioBase = Number(item.precio_unitario_al_momento_venta);
                if (item.producto.iva) {
                    precioBase = precioBase / (1 + IVA_PORCENTAJE);
                } else if (item.producto.inc) {
                    precioBase = precioBase / (1 + IC_PORCENTAJE);
                }
                return {
                    nombre: item.producto.nombre,
                    cantidad: Number(item.cantidad),
                    precio: parseFloat(precioBase.toFixed(2)),
                    iva: item.producto.iva,
                    ic: item.producto.inc,
                    inc: item.producto.inc,
                };
            });
            const subtotalCalculado = itemsParaAPI.reduce((sum, item) => {
                return sum + (item.precio * item.cantidad);
            }, 0);
            const payload = {
                plate_number: factura.id,
                location: establecimiento.direccion,
                cashier: `${usuarioCajero.nombre} ${usuarioCajero.apellido}`,
                cash_type: cuentaBancariaParaPago.medio_pago_asociado?.es_efectivo ? 'efectivo' : 'otro',
                sales_code: String(factura.sales_code),
                subtotal: parseFloat(subtotalCalculado.toFixed(2)),
                identification_number: Number(cliente.numero_documento),
                customer_name: cliente.nombre_completo,
                customer_dv: Number(cliente.DV),
                customer_email: cliente.correo_electronico,
                customer_phone: cliente.telefono,
                customer_address: cliente.direccion,
                customer_type_document_identification_id: Number(cliente.tipo_documento_codigo),
                customer_type_organization_id: 2,
                customer_municipality_id: Number(establecimiento.codigo_postal),
                number: 123,
                postal_zone_code: establecimiento.codigo_postal,
                payment_form_id: 1,
                payment_method_id: 2,
                payment_due_date: factura.fecha_hora_factura.toISOString().split('T')[0],
                duration_measure: Math.ceil(Math.abs(
                    (new Date(factura.fecha_hora_factura).getTime() - new Date(pedido.fecha_hora_pedido).getTime()) / 60000,
                )),
                items: itemsParaAPI,
            };
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'api-key': establecimiento.api_key,
                'nit': establecimiento.nit,
            };
            const apiUrl = process.env.API_EXTERNAL_FACTURADOR_URL;

            if (!apiUrl) {
                console.error('La URL de la API externa no está configurada.');
                return null;
            }
            const TIMEOUT_MS = 100;
            const response = await axios.post(apiUrl, payload, {
                headers,
                timeout: TIMEOUT_MS
            });
            if (response.data.status && response.data.pdf_base64) {
                const base64String: string = response.data.pdf_base64;
                const fullBuffer: Buffer = Buffer.from(base64String, 'base64');
                const pdfStartMarker = '%PDF-';
                const pdfStartIndex = fullBuffer.indexOf(pdfStartMarker);
                if (pdfStartIndex === -1) {
                    throw new Error('El PDF recibido no tiene un formato válido.');
                }
                const pdfBuffer: Buffer = fullBuffer.slice(pdfStartIndex);
                return pdfBuffer;

            } else {
                throw new Error('La API externa no devolvió el PDF esperado.');
            }

        } catch (error: any) {
                throw error;
        }
    }
    public async findInvoicesToProcess(): Promise<{ factura: FacturaEntity, retry?: FacturaRetryEntity }[]> {
        const facturasPendientes = await this.facturaRepository.find({
            where: [
                { estado_envio_api: EstadoEnvioFactura.PENDIENTE },
                { estado_envio_api: EstadoEnvioFactura.FALLIDO },
            ],

            relations: ['establecimiento', 'usuarioCajero', 'facturaPedidos.pedido.pedidoItems.producto', 'pagos.cliente', 'pagos.cuentaBancaria'],
        });

        const retriesReady = await this.facturaRetryRepository.find({
            where: { proximo_intento: LessThanOrEqual(new Date()) },
            relations: ['factura', 'factura.establecimiento', 'factura.usuarioCajero', 'factura.facturaPedidos.pedido.pedidoItems.producto', 'factura.pagos.cliente', 'factura.pagos.cuentaBancaria'],
        });

        const facturasParaProcesar = [
            ...facturasPendientes.map(f => ({ factura: f })),
            ...retriesReady.map(r => ({ factura: r.factura, retry: r })),
        ];

        return facturasParaProcesar;
    }

    public async processInvoice(facturaId: string): Promise<void> {
        const factura = await this.facturaRepository.findOne({
            where: { id: facturaId },
            relations: ['establecimiento', 'usuarioCajero', 'facturaPedidos.pedido.pedidoItems.producto', 'pagos.cliente', 'pagos.cuentaBancaria'],
        });

        if (!factura) {
            this.logger.error(`Factura con ID ${facturaId} no encontrada.`);
            return;
        }

        let retry = await this.facturaRetryRepository.findOne({ where: { factura_id: facturaId } });


        if (factura.pagos[0].cliente.numero_documento !== '111111111111') {

            try {
                await this.enviarFacturaAPIExterna(
                    factura,
                    factura.facturaPedidos[0].pedido,
                    factura.pagos[0].cliente,
                    factura.usuarioCajero,
                    factura.pagos[0].cuentaBancaria,
                    factura.establecimiento,
                );

                factura.estado_envio_api = EstadoEnvioFactura.ENVIADO;
                await this.facturaRepository.save(factura);

                if (retry) {
                    await this.facturaRetryRepository.delete(retry.id);
                }

            } catch (error: any) {
                this.logger.error(`Error al procesar la factura ${facturaId}: ${error.message}`);

                if (!retry) {
                    retry = this.facturaRetryRepository.create({
                        factura_id: facturaId,
                        intentos_fallidos: 0,
                        proximo_intento: new Date(),
                    });
                }

                retry.intentos_fallidos += 1;
                let tiempoDeEsperaEnMinutos = Math.pow(2, retry.intentos_fallidos);

                if (retry.intentos_fallidos >= 5) {
                    tiempoDeEsperaEnMinutos = 24 * 60;
                }

                const proximoIntento = new Date();
                proximoIntento.setMinutes(proximoIntento.getMinutes() + tiempoDeEsperaEnMinutos);

                retry.proximo_intento = proximoIntento;
                await this.facturaRetryRepository.save(retry);

                factura.estado_envio_api = EstadoEnvioFactura.FALLIDO;
                await this.facturaRepository.save(factura);
            }
        }
    }
    /**
     * Busca una factura por el ID del pedido asociado.
     * @param pedidoId El ID del pedido a buscar.
     * @param establecimientoId El ID del establecimiento para asegurar la seguridad.
     * @returns La entidad de la factura si se encuentra, de lo contrario, null.
     */
    async findOneByPedidoId(pedidoId: string, establecimientoId: string): Promise<FacturaEntity | null> {
        const facturaPedido = await this.facturaPedidoRepository.findOne({
            where: { pedido_id: pedidoId },
            relations: ['factura'],
        });

        if (!facturaPedido) {
            return null;
        }
        const factura = facturaPedido.factura;
        if (factura.establecimiento_id !== establecimientoId) {
            throw new NotFoundException('Factura no encontrada o no pertenece a tu establecimiento.');
        }

        return factura;
    }
}