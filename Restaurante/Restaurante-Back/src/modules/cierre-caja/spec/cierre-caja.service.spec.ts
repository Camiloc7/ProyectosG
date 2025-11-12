import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CierreCajaService } from '../cierre-caja.service';
import { CierreCajaEntity } from '../entities/cierre-caja.entity';
import { FacturaEntity, TipoFactura } from '../../facturas/entities/factura.entity';
import { PagoEntity } from '../../pagos/entities/pago.entity';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { UsuarioEntity } from '../../usuarios/entities/usuario.entity';
import { MedioPagoEntity } from '../../medios-pago/entities/medio-pago.entity';
import { RolEntity } from '../../roles/entities/rol.entity';
import { CreateCierreCajaDto } from '../dto/create-cierre-caja.dto';
import { UpdateCierreCajaDto } from '../dto/update-cierre-caja.dto';
import { GetCierreCajaReportDto } from '../dto/get-cierre-caja-report.dto';
import { Between, IsNull, Not } from 'typeorm';
const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
};
const mockCierreCajaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
};
const mockFacturaRepository = {
    find: jest.fn(),
};
const mockPagoRepository = {
    find: jest.fn(),
};
const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
    },
};

const mockRolCajero: Partial<RolEntity> = {
    id: 'rol-cajero-id',
    nombre: 'cajero',
    created_at: new Date(),
    updated_at: new Date(),
};
const mockEstablecimiento: Partial<EstablecimientoEntity> = {
    id: 'est-1-id',
    nombre: 'Establecimiento Principal',
    impuesto_porcentaje: 10.00,
    created_at: new Date(),
    updated_at: new Date(),
};
const mockUsuarioCajero: Partial<UsuarioEntity> = {
    id: 'cajero-1-id',
    nombre: 'Cajero de Prueba',
    apellido: 'Apellido Cajero',
    username: 'cajero.test',
    password_hash: 'hashedpassword',
    rol_id: mockRolCajero.id,
    establecimiento_id: mockEstablecimiento.id,
    activo: true,
    created_at: new Date(),
    updated_at: new Date(),
};
const baseMockMedioPagoEfectivo: MedioPagoEntity = {
    id: 'efectivo-id',
    nombre: 'Efectivo',
    activo: true,
    es_efectivo: true,
    establecimiento_id: mockEstablecimiento.id!,
    created_at: new Date(),
    updated_at: new Date(),
    establecimiento: mockEstablecimiento as EstablecimientoEntity,
};

const baseMockMedioPagoTarjeta: MedioPagoEntity = {
    id: 'tarjeta-id',
    nombre: 'Tarjeta Credito',
    activo: true,
    es_efectivo: false,
    establecimiento_id: mockEstablecimiento.id!,
    created_at: new Date(),
    updated_at: new Date(),
    establecimiento: mockEstablecimiento as EstablecimientoEntity,
};
const baseMockMedioPagoOtro: MedioPagoEntity = {
    id: 'otro-id',
    nombre: 'Otro',
    activo: true,
    es_efectivo: false,
    establecimiento_id: mockEstablecimiento.id!,
    created_at: new Date(),
    updated_at: new Date(),
    establecimiento: mockEstablecimiento as EstablecimientoEntity,
};
const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
};
describe('CierreCajaService', () => {
    let service: CierreCajaService;
    let cierreCajaRepository: Repository<CierreCajaEntity>;
    let facturaRepository: Repository<FacturaEntity>;
    let pagoRepository: Repository<PagoEntity>;
    let dataSource: DataSource;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CierreCajaService,
                {
                    provide: getRepositoryToken(CierreCajaEntity),
                    useValue: mockCierreCajaRepository,
                },
                {
                    provide: getRepositoryToken(FacturaEntity),
                    useValue: mockFacturaRepository,
                },
                {
                    provide: getRepositoryToken(PagoEntity),
                    useValue: mockPagoRepository,
                },
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
            ],
        }).compile();

        service = module.get<CierreCajaService>(CierreCajaService);
        cierreCajaRepository = module.get<Repository<CierreCajaEntity>>(getRepositoryToken(CierreCajaEntity));
        facturaRepository = module.get<Repository<FacturaEntity>>(getRepositoryToken(FacturaEntity));
        pagoRepository = module.get<Repository<PagoEntity>>(getRepositoryToken(PagoEntity));
        dataSource = module.get<DataSource>(DataSource);

        jest.clearAllMocks();

        mockQueryBuilder.leftJoinAndSelect.mockClear().mockReturnThis();
        mockQueryBuilder.orderBy.mockClear().mockReturnThis();
        mockQueryBuilder.andWhere.mockClear().mockReturnThis();
        mockQueryBuilder.getMany.mockClear();

        mockCierreCajaRepository.create.mockImplementation(dto => ({
            ...dto,
            id: 'mock-cierre-id',
            fecha_hora_apertura: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
        }));
        mockCierreCajaRepository.save.mockResolvedValue(true);
        mockCierreCajaRepository.findOne.mockResolvedValue(null);
        mockQueryRunner.manager.save.mockResolvedValue(true);
        mockQueryRunner.manager.find.mockResolvedValue([]);
        mockQueryRunner.manager.findOne.mockResolvedValue(null);
        mockQueryBuilder.getMany.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('debería ser definido', () => {
        expect(service).toBeDefined();
    });

    describe('abrirCaja', () => {
        const createDto: CreateCierreCajaDto = {
            establecimientoId: 'est-1-id',
            usuarioCajeroId: 'cajero-1-id',
            saldoInicialCaja: 100.00,
        };

        it('debería abrir una nueva caja exitosamente', async () => {
            mockCierreCajaRepository.findOne.mockResolvedValue(null);
            mockCierreCajaRepository.save.mockImplementation(caja => ({ ...caja, id: 'new-caja-id' }));

            const result = await service.abrirCaja(createDto);

            expect(cierreCajaRepository.findOne).toHaveBeenCalledWith({
                where: {
                    establecimiento_id: createDto.establecimientoId,
                    usuario_cajero_id: createDto.usuarioCajeroId,
                    cerrado: false,
                },
            });
            expect(cierreCajaRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                establecimiento_id: createDto.establecimientoId,
                usuario_cajero_id: createDto.usuarioCajeroId,
                saldo_inicial_caja: createDto.saldoInicialCaja,
                cerrado: false,
                fecha_hora_apertura: expect.any(Date),
            }));
            expect(cierreCajaRepository.save).toHaveBeenCalled();
            expect(result).toHaveProperty('id');
            expect(result.cerrado).toBe(false);
            expect(result.saldo_inicial_caja).toBe(createDto.saldoInicialCaja);
        });

        it('debería lanzar BadRequestException si ya existe un turno de caja abierto para el cajero y establecimiento', async () => {
            const existingOpenCaja: Partial<CierreCajaEntity> = { id: 'open-caja-id', cerrado: false };
            mockCierreCajaRepository.findOne.mockResolvedValue(existingOpenCaja);

            await expect(service.abrirCaja(createDto)).rejects.toThrow(BadRequestException);
            await expect(service.abrirCaja(createDto)).rejects.toThrow('Ya existe un turno de caja abierto para este cajero en este establecimiento.');
            expect(cierreCajaRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('cerrarCaja', () => {
        const updateDto: UpdateCierreCajaDto = {
            establecimientoId: 'est-1-id',
            usuarioCajeroId: 'cajero-1-id',
            saldoFinalContado: 1500.00,
            observaciones: 'Cierre de prueba',
        };
        const openCaja: Partial<CierreCajaEntity> = {
            id: 'open-caja-id',
            establecimiento_id: updateDto.establecimientoId,
            usuario_cajero_id: updateDto.usuarioCajeroId,
            fecha_hora_apertura: new Date(Date.now() - 3600000),
            saldo_inicial_caja: 500.00,
            cerrado: false,
            created_at: new Date(),
            updated_at: new Date(),
        };

        let dateNowSpy: jest.SpyInstance;

        beforeEach(() => {
            const mockCurrentTime = openCaja.fecha_hora_apertura!.getTime() + 7200000;
            dateNowSpy = jest.spyOn(global.Date, 'now').mockReturnValue(mockCurrentTime);

            mockCierreCajaRepository.findOne.mockResolvedValue(openCaja);
        });

        afterEach(() => {
            dateNowSpy.mockRestore();
        });

        it('debería cerrar la caja y calcular todos los totales correctamente con múltiples facturas y pagos', async () => {
            const mockFacturas: Partial<FacturaEntity>[] = [
                {
                    id: 'f1',
                    subtotal: 100, descuentos: 10, impuestos: 5, propina: 2, total_factura: 97,
                    establecimiento_id: updateDto.establecimientoId,
                    usuario_cajero_id: updateDto.usuarioCajeroId,
                    fecha_hora_factura: new Date(openCaja.fecha_hora_apertura!.getTime() + 100000),
                    facturaPedidos: [],
                    establecimiento: mockEstablecimiento as EstablecimientoEntity,
                    usuarioCajero: mockUsuarioCajero as UsuarioEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    tipo_factura: TipoFactura.TOTAL, notas: null,
                },
                {
                    id: 'f2',
                    subtotal: 200, descuentos: 20, impuestos: 10, propina: 4, total_factura: 194,
                    establecimiento_id: updateDto.establecimientoId,
                    usuario_cajero_id: updateDto.usuarioCajeroId,
                    fecha_hora_factura: new Date(openCaja.fecha_hora_apertura!.getTime() + 200000),
                    facturaPedidos: [],
                    establecimiento: mockEstablecimiento as EstablecimientoEntity,
                    usuarioCajero: mockUsuarioCajero as UsuarioEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    tipo_factura: TipoFactura.TOTAL, notas: null,
                },
            ];

            const mockPagos: Partial<PagoEntity>[] = [
                {
                    id: 'p1', factura_id: 'f1', monto_recibido: 97,
                    medioPago: { ...baseMockMedioPagoEfectivo },
                    fecha_hora_pago: new Date(openCaja.fecha_hora_apertura!.getTime() + 150000),
                    factura: { id: 'f1', usuario_cajero_id: updateDto.usuarioCajeroId, establecimiento_id: updateDto.establecimientoId } as FacturaEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    referencia_transaccion: 'ref1',
                },
                {
                    id: 'p2', factura_id: 'f2', monto_recibido: 100,
                    medioPago: { ...baseMockMedioPagoEfectivo },
                    fecha_hora_pago: new Date(openCaja.fecha_hora_apertura!.getTime() + 250000),
                    factura: { id: 'f2', usuario_cajero_id: updateDto.usuarioCajeroId, establecimiento_id: updateDto.establecimientoId } as FacturaEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    referencia_transaccion: 'ref2',
                },
                {
                    id: 'p3', factura_id: 'f2', monto_recibido: 94,
                    medioPago: { ...baseMockMedioPagoTarjeta },
                    fecha_hora_pago: new Date(openCaja.fecha_hora_apertura!.getTime() + 300000),
                    factura: { id: 'f2', usuario_cajero_id: updateDto.usuarioCajeroId, establecimiento_id: updateDto.establecimientoId } as FacturaEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    referencia_transaccion: 'ref3',
                },
                {
                    id: 'p4', factura_id: 'f1', monto_recibido: 5,
                    medioPago: { ...baseMockMedioPagoOtro },
                    fecha_hora_pago: new Date(openCaja.fecha_hora_apertura!.getTime() + 120000),
                    factura: { id: 'f1', usuario_cajero_id: updateDto.usuarioCajeroId, establecimiento_id: updateDto.establecimientoId } as FacturaEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    referencia_transaccion: 'ref4',
                },
            ];

            mockQueryRunner.manager.find
                .mockResolvedValueOnce(mockFacturas as FacturaEntity[])
                .mockResolvedValueOnce(mockPagos as PagoEntity[]);

            const saldoFinalContadoSimulado = openCaja.saldo_inicial_caja! + (97 + 100);

            const result = await service.cerrarCaja({ ...updateDto, saldoFinalContado: saldoFinalContadoSimulado });

            expect(cierreCajaRepository.findOne).toHaveBeenCalledWith({
                where: {
                    cerrado: false,
                    establecimiento_id: updateDto.establecimientoId,
                    usuario_cajero_id: updateDto.usuarioCajeroId
                }
            });
            expect(mockQueryRunner.connect).toHaveBeenCalled();
            expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.manager.find).toHaveBeenCalledWith(FacturaEntity, expect.objectContaining({
                where: {
                    establecimiento_id: updateDto.establecimientoId,
                    usuario_cajero_id: updateDto.usuarioCajeroId,
                    cierreCaja: IsNull(),
                    fecha_hora_factura: Between(openCaja.fecha_hora_apertura!, expect.any(Date)),
                },
            }));
            expect(mockQueryRunner.manager.find).toHaveBeenCalledWith(PagoEntity, expect.objectContaining({
                where: {
                    factura: { id: Not(IsNull()) },
                    cierreCaja: IsNull(),
                    fecha_hora_pago: Between(openCaja.fecha_hora_apertura!, expect.any(Date)),
                },
                relations: ['factura', 'medioPago'],
            }));
            expect(result.total_ventas_brutas).toBe(300);
            expect(result.total_descuentos).toBe(30);
            expect(result.total_impuestos).toBe(15);
            expect(result.total_propina).toBe(6);
            expect(result.total_neto_ventas).toBe(291);
            expect(result.total_pagos_efectivo).toBe(197);
            expect(result.total_pagos_tarjeta).toBe(94);
            expect(result.total_pagos_otros).toBe(5);
            expect(result.total_recaudado).toBe(296);
            expect(result.saldo_final_contado).toBe(saldoFinalContadoSimulado);
            expect(result.diferencia_caja).toBe(0);
            expect(result.cerrado).toBe(true);
            expect(result.fecha_hora_cierre).toBeInstanceOf(Date);
            expect(result.observaciones).toBe(updateDto.observaciones);
            expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(1 + mockFacturas.length + mockPagos.length);
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('debería lanzar NotFoundException si no se encuentra un turno de caja abierto', async () => {
            mockCierreCajaRepository.findOne.mockResolvedValue(null);

            await expect(service.cerrarCaja(updateDto)).rejects.toThrow(NotFoundException);
            await expect(service.cerrarCaja(updateDto)).rejects.toThrow('No se encontró un turno de caja abierto para este cajero y establecimiento.');
            expect(mockQueryRunner.connect).not.toHaveBeenCalled();
        });

        it('debería calcular la diferencia de caja como 0 si el saldo final coincide con el esperado', async () => {
            const mockFacturaParaPagoEfectivo: Partial<FacturaEntity>[] = [{
                id: 'f1',
                establecimiento_id: updateDto.establecimientoId,
                usuario_cajero_id: updateDto.usuarioCajeroId,
                fecha_hora_factura: new Date(),
                total_factura: 200,
                subtotal: 200, descuentos: 0, impuestos: 0, propina: 0, facturaPedidos: [], cierreCaja: null,
                establecimiento: mockEstablecimiento as EstablecimientoEntity,
                usuarioCajero: mockUsuarioCajero as UsuarioEntity,
                created_at: new Date(), updated_at: new Date(),
                tipo_factura: TipoFactura.TOTAL, notas: null,
            }];

            const pagosEfectivo: Partial<PagoEntity>[] = [{
                id: 'p1', factura_id: 'f1', monto_recibido: 200,
                medioPago: { ...baseMockMedioPagoEfectivo },
                fecha_hora_pago: new Date(),
                factura: { id: 'f1', usuario_cajero_id: updateDto.usuarioCajeroId, establecimiento_id: updateDto.establecimientoId } as FacturaEntity,
                cierreCaja: null,
                created_at: new Date(), updated_at: new Date(),
                referencia_transaccion: 'ref1',
            }];
            mockQueryRunner.manager.find
                .mockResolvedValueOnce(mockFacturaParaPagoEfectivo as FacturaEntity[])
                .mockResolvedValueOnce(pagosEfectivo as PagoEntity[]);

            const saldoFinalContado = openCaja.saldo_inicial_caja! + 200;

            const result = await service.cerrarCaja({ ...updateDto, saldoFinalContado });

            expect(result.total_pagos_efectivo).toBe(200);
            expect(result.diferencia_caja).toBe(0);
            expect(result.saldo_inicial_caja).toBe(openCaja.saldo_inicial_caja);
            expect(result.saldo_final_contado).toBe(saldoFinalContado);
        });

        it('debería calcular una diferencia de caja positiva (excedente)', async () => {
            const mockFacturaParaPagoEfectivo: Partial<FacturaEntity>[] = [{
                id: 'f1',
                establecimiento_id: updateDto.establecimientoId,
                usuario_cajero_id: updateDto.usuarioCajeroId,
                fecha_hora_factura: new Date(),
                total_factura: 200,
                subtotal: 200, descuentos: 0, impuestos: 0, propina: 0, facturaPedidos: [], cierreCaja: null,
                establecimiento: mockEstablecimiento as EstablecimientoEntity,
                usuarioCajero: mockUsuarioCajero as UsuarioEntity,
                created_at: new Date(), updated_at: new Date(),
                tipo_factura: TipoFactura.TOTAL, notas: null,
            }];

            const pagosEfectivo: Partial<PagoEntity>[] = [{
                id: 'p1', factura_id: 'f1', monto_recibido: 200,
                medioPago: { ...baseMockMedioPagoEfectivo },
                fecha_hora_pago: new Date(),
                factura: { id: 'f1', usuario_cajero_id: updateDto.usuarioCajeroId, establecimiento_id: updateDto.establecimientoId } as FacturaEntity,
                cierreCaja: null,
                created_at: new Date(), updated_at: new Date(),
                referencia_transaccion: 'ref1',
            }];

            mockQueryRunner.manager.find
                .mockResolvedValueOnce(mockFacturaParaPagoEfectivo as FacturaEntity[])
                .mockResolvedValueOnce(pagosEfectivo as PagoEntity[]);

            const saldoEsperado = openCaja.saldo_inicial_caja! + 200;
            const saldoFinalContado = saldoEsperado + 50;

            const result = await service.cerrarCaja({ ...updateDto, saldoFinalContado });

            expect(result.total_pagos_efectivo).toBe(200);
            expect(result.diferencia_caja).toBe(50);
        });

        it('debería calcular una diferencia de caja negativa (faltante)', async () => {
            const mockFacturaParaPagoEfectivo: Partial<FacturaEntity>[] = [{
                id: 'f1',
                establecimiento_id: updateDto.establecimientoId,
                usuario_cajero_id: updateDto.usuarioCajeroId,
                fecha_hora_factura: new Date(),
                total_factura: 200,
                subtotal: 200, descuentos: 0, impuestos: 0, propina: 0, facturaPedidos: [], cierreCaja: null,
                establecimiento: mockEstablecimiento as EstablecimientoEntity,
                usuarioCajero: mockUsuarioCajero as UsuarioEntity,
                created_at: new Date(), updated_at: new Date(),
                tipo_factura: TipoFactura.TOTAL, notas: null,
            }];

            const pagosEfectivo: Partial<PagoEntity>[] = [{
                id: 'p1', factura_id: 'f1', monto_recibido: 200,
                medioPago: { ...baseMockMedioPagoEfectivo },
                fecha_hora_pago: new Date(),
                factura: { id: 'f1', usuario_cajero_id: updateDto.usuarioCajeroId, establecimiento_id: updateDto.establecimientoId } as FacturaEntity,
                cierreCaja: null,
                created_at: new Date(), updated_at: new Date(),
                referencia_transaccion: 'ref1',
            }];

            mockQueryRunner.manager.find
                .mockResolvedValueOnce(mockFacturaParaPagoEfectivo as FacturaEntity[])
                .mockResolvedValueOnce(pagosEfectivo as PagoEntity[]);

            const saldoEsperado = openCaja.saldo_inicial_caja! + 200;
            const saldoFinalContado = saldoEsperado - 50;

            const result = await service.cerrarCaja({ ...updateDto, saldoFinalContado });

            expect(result.total_pagos_efectivo).toBe(200);
            expect(result.diferencia_caja).toBe(-50);
        });

        it('debería cerrar la caja con saldo inicial si no hay movimientos de efectivo', async () => {
            mockQueryRunner.manager.find
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            const saldoFinalContado = openCaja.saldo_inicial_caja!;

            const result = await service.cerrarCaja({ ...updateDto, saldoFinalContado });

            expect(result.total_pagos_efectivo).toBe(0);
            expect(result.total_recaudado).toBe(0);
            expect(result.total_neto_ventas).toBe(0);
            expect(result.diferencia_caja).toBe(0);
            expect(result.cerrado).toBe(true);
            expect(result.saldo_final_contado).toBe(saldoFinalContado);
        });

        it('debería filtrar pagos para incluir solo aquellos asociados a facturas del cajero actual en el turno', async () => {
            const mockFacturas: Partial<FacturaEntity>[] = [
                {
                    id: 'f1', subtotal: 100, descuentos: 0, impuestos: 0, propina: 0, total_factura: 100,
                    establecimiento_id: updateDto.establecimientoId,
                    usuario_cajero_id: updateDto.usuarioCajeroId,
                    fecha_hora_factura: new Date(openCaja.fecha_hora_apertura!.getTime() + 100000),
                    facturaPedidos: [],
                    establecimiento: mockEstablecimiento as EstablecimientoEntity,
                    usuarioCajero: mockUsuarioCajero as UsuarioEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    tipo_factura: TipoFactura.TOTAL, notas: null,
                },
                {
                    id: 'f2', subtotal: 50, descuentos: 0, impuestos: 0, propina: 0, total_factura: 50,
                    establecimiento_id: updateDto.establecimientoId,
                    usuario_cajero_id: 'other-cajero-id',
                    fecha_hora_factura: new Date(openCaja.fecha_hora_apertura!.getTime() + 120000),
                    facturaPedidos: [],
                    establecimiento: mockEstablecimiento as EstablecimientoEntity,
                    usuarioCajero: { ...mockUsuarioCajero, id: 'other-cajero-id', username: 'other.cajero', nombre: 'Otro Cajero', apellido: 'Apellido Otro' } as UsuarioEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    tipo_factura: TipoFactura.TOTAL, notas: null,
                },
            ];
            const mockPagos: Partial<PagoEntity>[] = [
                {
                    id: 'p1', factura_id: 'f1', monto_recibido: 100,
                    medioPago: { ...baseMockMedioPagoEfectivo },
                    fecha_hora_pago: new Date(openCaja.fecha_hora_apertura!.getTime() + 150000),
                    factura: { id: 'f1', usuario_cajero_id: updateDto.usuarioCajeroId, establecimiento_id: updateDto.establecimientoId } as FacturaEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    referencia_transaccion: 'ref1',
                },
                {
                    id: 'p2', factura_id: 'f2', monto_recibido: 50,
                    medioPago: { ...baseMockMedioPagoEfectivo },
                    fecha_hora_pago: new Date(openCaja.fecha_hora_apertura!.getTime() + 200000),
                    factura: { id: 'f2', usuario_cajero_id: 'other-cajero-id', establecimiento_id: updateDto.establecimientoId } as FacturaEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    referencia_transaccion: 'ref2',
                },
                {
                    id: 'p3', factura_id: 'f3', monto_recibido: 75,
                    medioPago: { ...baseMockMedioPagoEfectivo },
                    fecha_hora_pago: new Date(openCaja.fecha_hora_apertura!.getTime() + 250000),
                    factura: { id: 'f3', usuario_cajero_id: updateDto.usuarioCajeroId, establecimiento_id: updateDto.establecimientoId } as FacturaEntity,
                    cierreCaja: null,
                    created_at: new Date(), updated_at: new Date(),
                    referencia_transaccion: 'ref3',
                },
            ];

            mockQueryRunner.manager.find
                .mockResolvedValueOnce(mockFacturas as FacturaEntity[])
                .mockResolvedValueOnce(mockPagos as PagoEntity[]);

            const saldoFinalContadoSimulado = openCaja.saldo_inicial_caja! + 100;

            const result = await service.cerrarCaja({ ...updateDto, saldoFinalContado: saldoFinalContadoSimulado });

            expect(result.total_pagos_efectivo).toBe(100);
            expect(result.total_recaudado).toBe(100);
            expect(result.diferencia_caja).toBe(0);
            expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(4);
        });
    });

    describe('obtenerCierresCaja', () => {
        const queryDto: GetCierreCajaReportDto = {
            establecimientoId: 'est-1-id',
            fechaInicio: '2023-01-01',
            fechaFin: '2023-01-31',
        };
        const mockCierres: Partial<CierreCajaEntity>[] = [
            {
                id: 'c1',
                establecimiento_id: 'est-1-id',
                usuario_cajero_id: 'cajero-1-id',
                fecha_hora_cierre: new Date('2023-01-15T10:00:00Z'),
                cerrado: true,
                establecimiento: mockEstablecimiento as EstablecimientoEntity,
                usuarioCajero: mockUsuarioCajero as UsuarioEntity,
                created_at: new Date(), updated_at: new Date(),
                fecha_hora_apertura: new Date(), saldo_inicial_caja: 0,
                total_pagos_efectivo: 0, total_pagos_tarjeta: 0, total_pagos_otros: 0,
                total_ventas_brutas: 0, total_neto_ventas: 0, total_impuestos: 0,
                total_descuentos: 0, total_propina: 0, total_recaudado: 0,
                diferencia_caja: 0, saldo_final_contado: 0, observaciones: null,
                facturas: [],
            },
        ];

        beforeEach(() => {
            mockQueryBuilder.getMany.mockResolvedValue(mockCierres);
        });

        it('debería obtener cierres de caja con todos los filtros aplicados', async () => {
            const result = await service.obtenerCierresCaja(queryDto);

            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('cierre.establecimiento', 'establecimiento');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('cierre.usuarioCajero', 'usuarioCajero');
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('cierre.fecha_hora_cierre', 'DESC');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cierre.establecimiento_id = :establecimientoId', { establecimientoId: queryDto.establecimientoId });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cierre.fecha_hora_cierre BETWEEN :fechaInicio AND :fechaFin', expect.any(Object));
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
            expect(result).toEqual(mockCierres);
        });

        it('debería obtener todos los cierres de caja sin filtros', async () => {
            const emptyQueryDto: GetCierreCajaReportDto = {};
            await service.obtenerCierresCaja(emptyQueryDto);

            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith('cierre.establecimiento_id = :establecimientoId', expect.any(Object));
            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith('cierre.usuario_cajero_id = :usuarioCajeroId', expect.any(Object));
            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(expect.stringContaining('fecha_hora_cierre'), expect.any(Object));
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
        });

        it('debería filtrar cierres de caja solo por fecha de inicio', async () => {
            const partialQueryDto: GetCierreCajaReportDto = { fechaInicio: '2023-01-01' };
            await service.obtenerCierresCaja(partialQueryDto);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cierre.fecha_hora_cierre >= :fechaInicio', expect.any(Object));
            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(expect.stringContaining('fecha_hora_cierre <= :fechaFin'), expect.any(Object));
        });

        it('debería filtrar cierres de caja solo por fecha de fin', async () => {
            const partialQueryDto: GetCierreCajaReportDto = { fechaFin: '2023-01-31' };
            await service.obtenerCierresCaja(partialQueryDto);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cierre.fecha_hora_cierre <= :fechaFin', expect.any(Object));
            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(expect.stringContaining('fecha_hora_cierre >= :fechaInicio'), expect.any(Object));
        });

        it('debería filtrar cierres de caja por usuario cajero', async () => {
            const partialQueryDto: GetCierreCajaReportDto = { usuarioCajeroId: 'cajero-filtered-id' };
            await service.obtenerCierresCaja(partialQueryDto);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cierre.usuario_cajero_id = :usuarioCajeroId', { usuarioCajeroId: 'cajero-filtered-id' });
        });
    });

    describe('obtenerCierreCajaPorId', () => {
        const cierreId = 'cierre-1-id';
        const mockCierre: Partial<CierreCajaEntity> = {
            id: cierreId,
            establecimiento_id: 'est-1-id',
            usuario_cajero_id: 'cajero-1-id',
            fecha_hora_apertura: new Date(),
            cerrado: true,
            fecha_hora_cierre: new Date(),
            establecimiento: mockEstablecimiento as EstablecimientoEntity,
            usuarioCajero: mockUsuarioCajero as UsuarioEntity,
            created_at: new Date(), updated_at: new Date(),
            saldo_inicial_caja: 0, total_pagos_efectivo: 0, total_pagos_tarjeta: 0, total_pagos_otros: 0,
            total_ventas_brutas: 0, total_neto_ventas: 0, total_impuestos: 0,
            total_descuentos: 0, total_propina: 0, total_recaudado: 0,
            diferencia_caja: 0, saldo_final_contado: 0, observaciones: null,
            facturas: [],
        };

        beforeEach(() => {
            mockCierreCajaRepository.findOne.mockResolvedValue(mockCierre);
        });

        it('debería retornar un cierre de caja si se encuentra por ID', async () => {
            const result = await service.obtenerCierreCajaPorId(cierreId);
            expect(cierreCajaRepository.findOne).toHaveBeenCalledWith({
                where: { id: cierreId },
                relations: ['establecimiento', 'usuarioCajero'],
            });
            expect(result).toEqual(mockCierre);
        });

        it('debería lanzar NotFoundException si el cierre de caja no se encuentra por ID', async () => {
            mockCierreCajaRepository.findOne.mockResolvedValue(null);
            await expect(service.obtenerCierreCajaPorId('non-existent-id')).rejects.toThrow(NotFoundException);
            await expect(service.obtenerCierreCajaPorId('non-existent-id')).rejects.toThrow('Cierre de caja con ID "non-existent-id" no encontrado.');
        });
    });

    describe('obtenerCierreCajaActivo', () => {
        const establecimientoId = 'est-1-id';
        const usuarioCajeroId = 'cajero-1-id';
        const mockOpenCierre: Partial<CierreCajaEntity> = {
            id: 'open-caja-id',
            establecimiento_id: establecimientoId,
            usuario_cajero_id: usuarioCajeroId,
            fecha_hora_apertura: new Date(),
            saldo_inicial_caja: 100,
            cerrado: false,
            establecimiento: mockEstablecimiento as EstablecimientoEntity,
            usuarioCajero: mockUsuarioCajero as UsuarioEntity,
            created_at: new Date(), updated_at: new Date(),
            total_pagos_efectivo: 0, total_pagos_tarjeta: 0, total_pagos_otros: 0,
            total_ventas_brutas: 0, total_neto_ventas: 0, total_impuestos: 0,
            total_descuentos: 0, total_propina: 0, total_recaudado: 0,
            diferencia_caja: 0, saldo_final_contado: 0, observaciones: null,
            facturas: [],
        };

        it('debería retornar el turno de caja activo si existe', async () => {
            mockCierreCajaRepository.findOne.mockResolvedValue(mockOpenCierre);
            const result = await service.obtenerCierreCajaActivo(establecimientoId, usuarioCajeroId);
            expect(cierreCajaRepository.findOne).toHaveBeenCalledWith({
                where: { establecimiento_id: establecimientoId, usuario_cajero_id: usuarioCajeroId, cerrado: false },
            });
            expect(result).toEqual(mockOpenCierre);
        });

        it('debería retornar null si no hay un turno de caja activo', async () => {
            mockCierreCajaRepository.findOne.mockResolvedValue(null);
            const result = await service.obtenerCierreCajaActivo(establecimientoId, usuarioCajeroId);
            expect(result).toBeNull();
        });
    });
});
