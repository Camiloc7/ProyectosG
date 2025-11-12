import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between, DataSource, Not, In } from 'typeorm';
import { CierreCajaEntity } from './entities/cierre-caja.entity';
import { EstadoFactura, FacturaEntity } from '../facturas/entities/factura.entity';
import { PagoEntity } from '../pagos/entities/pago.entity';
import { CreateCierreCajaDto } from './dto/create-cierre-caja.dto';
import { UpdateCierreCajaDto } from './dto/update-cierre-caja.dto';
import { GetCierreCajaReportDto } from './dto/get-cierre-caja-report.dto';
import { GastosService } from '../gastos/gastos.service';
import { DenominacionDto } from './dto/denominacion.dto';
import { IngresosExtraService } from '../ingresos-extra/ingresos-extra.service';
import { EstadoPedido, PedidoEntity } from '../pedidos/entities/pedido.entity';
import { WebSocketEventsService } from 'src/websocket/services/websocket-events.service';

@Injectable()
export class CierreCajaService {
    constructor(
        @InjectRepository(CierreCajaEntity)
        private readonly cierreCajaRepository: Repository<CierreCajaEntity>,
        @InjectRepository(FacturaEntity)
        private readonly facturaRepository: Repository<FacturaEntity>,
        @InjectRepository(PagoEntity)
        private readonly pagoRepository: Repository<PagoEntity>,
        private dataSource: DataSource,
        private readonly gastosService: GastosService,
        private readonly ingresosExtraService: IngresosExtraService,
        private readonly wsEventsService: WebSocketEventsService,
    ) { }

    private calcularTotalPorDenominaciones(denominaciones: DenominacionDto): number {
        let total = 0;
        if (typeof denominaciones !== 'object' || denominaciones === null) {
            return 0;
        }
        for (const key in denominaciones) {
            if (denominaciones.hasOwnProperty(key)) {
                const value = parseInt(key, 10);
                if (!isNaN(value)) {
                    const count = denominaciones[key];
                    if (!isNaN(count) && count >= 0) {
                        total += value * count;
                    }
                }
            }
        }
        return total;
    }

    async abrirCaja(createCierreCajaDto: CreateCierreCajaDto): Promise<CierreCajaEntity> {
        const { establecimientoId, usuarioCajeroId, denominaciones_apertura } = createCierreCajaDto;
        const existingOpenCierre = await this.cierreCajaRepository.findOne({
            where: {
                establecimiento_id: establecimientoId,
                usuario_cajero_id: usuarioCajeroId,
                cerrado: false,
            },
        });
        if (existingOpenCierre) {
            throw new BadRequestException('Ya existe un turno de caja abierto para este cajero en este establecimiento.');
        }
        const saldoInicialCaja = this.calcularTotalPorDenominaciones(denominaciones_apertura ?? {});
        const nuevoCierre = this.cierreCajaRepository.create({
            establecimiento_id: establecimientoId,
            usuario_cajero_id: usuarioCajeroId,
            fecha_hora_apertura: new Date(),
            saldo_inicial_caja: saldoInicialCaja,
            saldo_final_contado: 0,
            total_ventas_brutas: 0,
            total_descuentos: 0,
            total_impuestos: 0,
            total_propina: 0,
            total_neto_ventas: 0,
            total_pagos_efectivo: 0,
            total_pagos_tarjeta: 0,
            total_pagos_otros: 0,
            total_recaudado: 0,
            gastos_operacionales: 0,
            diferencia_caja: 0,
            cerrado: false,
            denominaciones_apertura: denominaciones_apertura,
        });
        const cierreGuardado = await this.cierreCajaRepository.save(nuevoCierre);
        this.wsEventsService.emitCajaStatusUpdate(
            establecimientoId!,
            usuarioCajeroId!,
            true
        );
        return cierreGuardado;
    }
    async cerrarCaja(updateCierreCajaDto: UpdateCierreCajaDto): Promise<CierreCajaEntity> {
        const { establecimientoId, usuarioCajeroId, observaciones, denominaciones_cierre } = updateCierreCajaDto;
        const cierreCaja = await this.cierreCajaRepository.findOne({
            where: {
                establecimiento_id: establecimientoId,
                usuario_cajero_id: usuarioCajeroId,
                cerrado: false,
            },
        });
        if (!cierreCaja) {
            throw new NotFoundException('No se encontró un turno de caja abierto para este cajero y establecimiento.');
        }
        const veinticuatroHoras = 24 * 60 * 60 * 1000;
        if (new Date().getTime() - cierreCaja.fecha_hora_apertura.getTime() > veinticuatroHoras) {
            console.warn('Advertencia: El turno de caja lleva más de 24 horas abierto.');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const fechaCierre = new Date();

            const totalIngresosExtra = await this.ingresosExtraService.sumByCierreCajaId(cierreCaja.id);
            
            // 4. Realizar el cuadre de caja (usando el valor correcto de efectivo)
            const saldoFinalContadoCalculado = this.calcularTotalPorDenominaciones(denominaciones_cierre ?? {});
            const saldoEsperado = parseFloat(String(cierreCaja.saldo_inicial_caja || 0)) +
                parseFloat(String(cierreCaja.total_pagos_efectivo || 0)) +
                totalIngresosExtra - cierreCaja.gastos_operacionales; // Se resta totalGastos

            cierreCaja.diferencia_caja = isNaN(saldoFinalContadoCalculado - saldoEsperado) ? 0 : saldoFinalContadoCalculado - saldoEsperado;
            cierreCaja.saldo_final_contado = isNaN(saldoFinalContadoCalculado) ? 0 : saldoFinalContadoCalculado;
            cierreCaja.fecha_hora_cierre = fechaCierre;
            cierreCaja.denominaciones_cierre = denominaciones_cierre ?? {};
            cierreCaja.observaciones = observaciones || null;
            cierreCaja.cerrado = true;
            
            await queryRunner.manager.save(cierreCaja);

            await queryRunner.commitTransaction();

            this.wsEventsService.emitCajaStatusUpdate(
                establecimientoId!,
                usuarioCajeroId!,
                false
            );
            return cierreCaja;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error al cerrar caja:', error);
            throw new InternalServerErrorException('Error al procesar el cierre de caja. Por favor, intente de nuevo.');
        } finally {
            await queryRunner.release();
        }
    }
    async obtenerCierresCaja(queryDto: GetCierreCajaReportDto): Promise<CierreCajaEntity[]> {
        const { establecimientoId, usuarioCajeroId, fechaInicio, fechaFin } = queryDto;
        const queryBuilder = this.cierreCajaRepository.createQueryBuilder('cierre')
            .leftJoinAndSelect('cierre.establecimiento', 'establecimiento')
            .leftJoinAndSelect('cierre.usuarioCajero', 'usuarioCajero')
            .orderBy('cierre.fecha_hora_cierre', 'DESC');
        if (establecimientoId) {
            queryBuilder.andWhere('cierre.establecimiento_id = :establecimientoId', { establecimientoId });
        }

        if (usuarioCajeroId) {
            queryBuilder.andWhere('cierre.usuario_cajero_id = :usuarioCajeroId', { usuarioCajeroId });
        }

        if (fechaInicio && fechaFin) {
            queryBuilder.andWhere('cierre.fecha_hora_cierre BETWEEN :fechaInicio AND :fechaFin', {
                fechaInicio: new Date(fechaInicio),
                fechaFin: new Date(new Date(fechaFin).setHours(23, 59, 59, 999)),
            });
        } else if (fechaInicio) {
            queryBuilder.andWhere('cierre.fecha_hora_cierre >= :fechaInicio', { fechaInicio: new Date(fechaInicio) });
        } else if (fechaFin) {
            queryBuilder.andWhere('cierre.fecha_hora_cierre <= :fechaFin', { fechaFin: new Date(new Date(fechaFin).setHours(23, 59, 59, 999)) });
        }

        return queryBuilder.getMany();
    }

    async obtenerCierreCajaPorId(id: string): Promise<CierreCajaEntity> {
        const cierre = await this.cierreCajaRepository.findOne({
            where: { id },
            relations: ['establecimiento', 'usuarioCajero'],
        });
        if (!cierre) {
            throw new NotFoundException(`Cierre de caja con ID "${id}" no encontrado.`);
        }
        return cierre;
    }
    async obtenerCierreCajaActivo(establecimientoId: string, usuarioCajeroId: string): Promise<any> {
        const cierreCaja = await this.cierreCajaRepository.findOne({
            where: {
                establecimiento_id: establecimientoId,
                usuario_cajero_id: usuarioCajeroId,
                cerrado: false,
            },
        });
        if (!cierreCaja) {
            return null;
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
            .andWhere('pago.cierreCaja IS NULL')
            .andWhere('pago.fecha_hora_pago BETWEEN :fechaApertura AND :fechaSimulada', {
                fechaApertura: cierreCaja.fecha_hora_apertura,
                fechaSimulada: fechaSimulada,
            })
            .getMany();
        const totalGastos = await this.gastosService.sumByCierreCajaId(cierreCaja.id);
        const totalPagosEfectivo = pagosDelTurno
            .filter(pago => pago.cuentaBancaria?.medio_pago_asociado?.es_efectivo === true)
            .reduce((sum, pago) => {
                const montoAPlicar = pago.facturaPagosCliente ? Number(pago.facturaPagosCliente.monto_pagado) : 0;
                return sum + montoAPlicar;
            }, 0);
        
        const saldoEsperadoActual = Number(cierreCaja.saldo_inicial_caja) + totalPagosEfectivo - totalGastos;
        
        return {
            ...cierreCaja,
            saldo_esperado_actual: saldoEsperadoActual,
        };
    }

    async findAllOpenGlobal(): Promise<CierreCajaEntity[]> {
        return this.cierreCajaRepository.find({
            where: {
                cerrado: false,
            },
        });
    }

    async findAllOpenByEstablecimiento(establecimientoId: string): Promise<CierreCajaEntity[]> {
        return this.cierreCajaRepository.find({
            where: {
                establecimiento_id: establecimientoId,
                cerrado: false,
            },
            relations: ['usuarioCajero'], 
        });
    }

    async cerrarCajasPendientes(): Promise<void> {
        try {
            const turnosAbiertos = await this.findAllOpenGlobal(); 
            for (const turno of turnosAbiertos) {
                if (turno.establecimiento_id && turno.usuario_cajero_id) {
                    await this.cerrarCajaAutomaticamente(turno.establecimiento_id, turno.usuario_cajero_id);
                } else {
                    console.warn(`Turno abierto encontrado sin establecimientoId o usuarioCajeroId. ID: ${turno.id}`);
                }
            }
        } catch (error) {
            console.error('Error al procesar el cierre automático de todas las cajas pendientes:', error);
        }
    }

    async cerrarCajaAutomaticamente(establecimientoId: string, usuarioCajeroId: string): Promise<CierreCajaEntity | null> {
        const cierreCaja = await this.cierreCajaRepository.findOne({
            where: {
                establecimiento_id: establecimientoId,
                usuario_cajero_id: usuarioCajeroId,
                cerrado: false,
            },
        });
        if (!cierreCaja) {
            return null;
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const fechaCierre = new Date();
            const estadosExcluidos = [
                EstadoPedido.PAGADO,
                EstadoPedido.CANCELADO,
                EstadoPedido.PENDIENTE_PAGO,
            ];
            const pedidosAActualizar = await queryRunner.manager.find(PedidoEntity, {
                where: {
                    establecimiento_id: establecimientoId,
                    usuario_creador_id: usuarioCajeroId,
                    estado: Not(In(estadosExcluidos)),
                    fecha_hora_pedido: Between(cierreCaja.fecha_hora_apertura, fechaCierre),
                },
            });

            for (const pedido of pedidosAActualizar) {
                pedido.notas = 'Cancelado pago por cierre de caja automático.';
                pedido.estado = EstadoPedido.CANCELADO;
                pedido.cierreCaja = cierreCaja;
                await queryRunner.manager.save(pedido);
            }

            const facturasDelTurno = await queryRunner.manager.find(FacturaEntity, {
                where: {
                    establecimiento_id: establecimientoId,
                    usuario_cajero_id: usuarioCajeroId, 
                    cierreCaja: IsNull(),
                    fecha_hora_factura: Between(cierreCaja.fecha_hora_apertura, fechaCierre),
                },
            });
            const pagosDelTurno = await queryRunner.manager
                .createQueryBuilder(PagoEntity, 'pago')
                .leftJoinAndSelect('pago.factura', 'factura')
                .leftJoinAndSelect('pago.cuentaBancaria', 'cuentaBancaria')
                .leftJoinAndSelect('cuentaBancaria.medio_pago_asociado', 'medioPago')
                .leftJoinAndSelect('pago.facturaPagosCliente', 'facturaPagosCliente')
                .where('factura.establecimiento_id = :establecimientoId', { establecimientoId })
                .andWhere('factura.usuario_cajero_id = :usuarioCajeroId', { usuarioCajeroId })
                .andWhere('pago.cierreCaja IS NULL')
                .andWhere('pago.fecha_hora_pago BETWEEN :fechaApertura AND :fechaCierre', {
                    fechaApertura: cierreCaja.fecha_hora_apertura,
                    fechaCierre: fechaCierre,
                })
                .getMany();

            const totalGastos = await this.gastosService.sumByCierreCajaId(cierreCaja.id);
            const pagosPorFactura: { [key: string]: typeof pagosDelTurno } = {};
            pagosDelTurno.forEach((pago) => {
                if (pago.factura?.id) {
                    if (!pagosPorFactura[pago.factura.id]) pagosPorFactura[pago.factura.id] = [];
                    pagosPorFactura[pago.factura.id].push(pago);
                }
            });

            let totalPagosEfectivoConPropina = 0;
            let totalPagosTarjetaConPropina = 0;
            let totalPagosOtrosConPropina = 0;
            let totalRecaudadoFinal = 0;

            for (const facturaId in pagosPorFactura) {
                const pagos = pagosPorFactura[facturaId];
                const factura = pagos[0].factura;
                const totalMontoPagadoBase = pagos.reduce((s, p) => (p.facturaPagosCliente ? s + Number(p.facturaPagosCliente.monto_pagado || 0) : s), 0);
                const propinaDeFactura = Number(factura.propina) || 0;

                pagos.forEach((pago) => {
                    const montoRecibidoBase = pago.facturaPagosCliente ? Number(pago.facturaPagosCliente.monto_pagado || 0) : 0;
                    let montoPropinaProporcional = 0;

                    if (totalMontoPagadoBase > 0) {
                        const proporcion = montoRecibidoBase / totalMontoPagadoBase;
                        montoPropinaProporcional = propinaDeFactura * proporcion;
                    }
                    const montoTotalRecaudado = montoRecibidoBase + montoPropinaProporcional;
                    totalRecaudadoFinal += montoTotalRecaudado;

                    const esEfectivo = pago.cuentaBancaria?.medio_pago_asociado?.es_efectivo || false;
                    const esTarjeta = pago.cuentaBancaria?.medio_pago_asociado?.nombre.toUpperCase().includes('TARJETA');
                    
                    if (esEfectivo) {
                        totalPagosEfectivoConPropina += montoTotalRecaudado;
                    } else if (esTarjeta) {
                        totalPagosTarjetaConPropina += montoTotalRecaudado;
                    } else {
                        totalPagosOtrosConPropina += montoTotalRecaudado;
                    }
                });
            }
            cierreCaja.total_ventas_brutas = facturasDelTurno.reduce((sum, f) => sum + parseFloat(String(f.subtotal || 0)), 0);
            cierreCaja.total_descuentos = facturasDelTurno.reduce((sum, f) => sum + parseFloat(String(f.descuentos || 0)), 0);
            cierreCaja.total_impuestos = facturasDelTurno.reduce((sum, f) => sum + parseFloat(String(f.impuestos || 0)), 0);
            cierreCaja.total_propina = facturasDelTurno.reduce((sum, f) => sum + parseFloat(String(f.propina || 0)), 0);
            cierreCaja.total_neto_ventas = facturasDelTurno.reduce((sum, f) => sum + parseFloat(String(f.total_factura || 0)), 0);
            cierreCaja.total_pagos_efectivo = totalPagosEfectivoConPropina;
            cierreCaja.total_pagos_tarjeta = totalPagosTarjetaConPropina;
            cierreCaja.total_pagos_otros = totalPagosOtrosConPropina;
            cierreCaja.total_recaudado = totalRecaudadoFinal;            
            cierreCaja.gastos_operacionales = totalGastos;
            cierreCaja.diferencia_caja = 0;
            cierreCaja.saldo_final_contado = 0;
            cierreCaja.observaciones = 'Cierre de caja automático. Pedidos pendientes cancelados.';
            cierreCaja.fecha_hora_cierre = fechaCierre;
            cierreCaja.cerrado = true;

            await queryRunner.manager.save(cierreCaja);
            
            for (const factura of facturasDelTurno) {
                factura.cierreCaja = cierreCaja;
                await queryRunner.manager.save(factura);
            }

            for (const pago of pagosDelTurno) {
                pago.cierreCaja = cierreCaja;
                await queryRunner.manager.save(pago);
            }
            await queryRunner.commitTransaction();
            this.wsEventsService.emitCajaStatusUpdate(
                establecimientoId,
                usuarioCajeroId,
                false
            );
            return cierreCaja;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error al procesar el cierre de caja automático:', error);
            throw new InternalServerErrorException('Error al procesar el cierre de caja automático. Por favor, intente de nuevo.');
        } finally {
            await queryRunner.release();
        }
    }
}