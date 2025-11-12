import { Test, TestingModule } from '@nestjs/testing';
import { CierreCajaService } from '../cierre-caja.service';
import { FacturaEntity, EstadoFactura } from '../../facturas/entities/factura.entity';
import { CierreCajaEntity } from '../entities/cierre-caja.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, Between, IsNull } from 'typeorm';
import { PagoEntity } from '../../pagos/entities/pago.entity';
import { GastosService } from '../../gastos/gastos.service';

describe('CierreCajaService - Cierre Automático', () => {
  let service: CierreCajaService;
  let cierreCajaRepository: Repository<CierreCajaEntity>;
  let dataSource: DataSource;
  let gastosService: GastosService;

  // Mock del QueryRunner que será persistente
  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CierreCajaService,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => mockQueryRunner),
          },
        },
        {
          provide: getRepositoryToken(CierreCajaEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(FacturaEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PagoEntity),
          useClass: Repository,
        },
        {
          provide: GastosService,
          useValue: {
            sumByCierreCajaId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CierreCajaService>(CierreCajaService);
    cierreCajaRepository = module.get<Repository<CierreCajaEntity>>(getRepositoryToken(CierreCajaEntity));
    dataSource = module.get<DataSource>(DataSource);
    gastosService = module.get<GastosService>(GastosService);

    // Reiniciar los mocks antes de cada test para evitar interferencias
    jest.clearAllMocks();
  });
  
  it('debería cancelar pedidos pendientes y cerrar la caja si se olvida, y calcular los totales', async () => {
    const establecimientoId = 'test-est-id';
    const usuarioCajeroId = 'test-cajero-id';
    const turnoAbierto = new CierreCajaEntity();
    Object.assign(turnoAbierto, {
      id: 'caja-abierta-id',
      cerrado: false,
      establecimiento_id: establecimientoId,
      usuario_cajero_id: usuarioCajeroId,
      fecha_hora_apertura: new Date('2024-01-01T08:00:00Z'),
    });
    
    const medioPagoEfectivo = { id: 'mp1', nombre: 'EFECTIVO', es_efectivo: true };
    const medioPagoTarjeta = { id: 'mp2', nombre: 'TARJETA DE CRÉDITO', es_efectivo: false };
    const cuentaBancariaEfectivo = { medio_pago_asociado: medioPagoEfectivo };
    const cuentaBancariaTarjeta = { medio_pago_asociado: medioPagoTarjeta };
    
    const facturaPagada1 = new FacturaEntity();
    Object.assign(facturaPagada1, {
      id: 'factura-pagada-1',
      subtotal: 100,
      descuentos: 5,
      impuestos: 8,
      total_factura: 103,
    });
    const facturaPagada2 = new FacturaEntity();
    Object.assign(facturaPagada2, {
      id: 'factura-pagada-2',
      subtotal: 100,
      descuentos: 5,
      impuestos: 8,
      total_factura: 103,
    });

    const pagosDelTurno = [
      {
        id: 'pago-efectivo-1',
        factura: facturaPagada1,
        cuentaBancaria: cuentaBancariaEfectivo,
        facturaPagosCliente: { monto_pagado: 50 },
      },
      {
        id: 'pago-tarjeta-1',
        factura: facturaPagada2,
        cuentaBancaria: cuentaBancariaTarjeta,
        facturaPagosCliente: { monto_pagado: 150 },
      },
    ];

    jest.spyOn(cierreCajaRepository, 'findOne').mockResolvedValue(turnoAbierto);
    mockQueryRunner.manager.find
      .mockResolvedValueOnce([
        { id: 'pedido-pendiente-1', estado: EstadoFactura.PENDIENTE_PAGO, notas: '' },
        { id: 'pedido-pendiente-2', estado: EstadoFactura.PENDIENTE_PAGO, notas: '' },
      ])
      .mockResolvedValueOnce([facturaPagada1, facturaPagada2]);
    mockQueryRunner.manager.createQueryBuilder
      .mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(pagosDelTurno),
      } as any);

    jest.spyOn(gastosService, 'sumByCierreCajaId').mockResolvedValue(25);
    const saveSpy = jest.spyOn(mockQueryRunner.manager, 'save');
    const resultado = await service.cerrarCajaAutomaticamente(establecimientoId, usuarioCajeroId);
    expect(resultado).toBeDefined();
    expect(resultado!.cerrado).toBe(true);
    expect(resultado!.observaciones).toBe('Cierre de caja automático. Pedidos pendientes cancelados.');
    expect(resultado!.total_ventas_brutas).toBe(200);
    expect(resultado!.total_descuentos).toBe(10);
    expect(resultado!.total_impuestos).toBe(16);
    expect(resultado!.total_neto_ventas).toBe(206);
    expect(resultado!.total_pagos_efectivo).toBe(50);
    expect(resultado!.total_pagos_tarjeta).toBe(150);
    expect(resultado!.total_recaudado).toBe(200);
    expect(resultado!.gastos_operacionales).toBe(25);
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'pedido-pendiente-1', estado: EstadoFactura.CANCELADA }));
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'pedido-pendiente-2', estado: EstadoFactura.CANCELADA }));
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'caja-abierta-id', cerrado: true }));
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'factura-pagada-1', cierreCaja: expect.anything() }));
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'factura-pagada-2', cierreCaja: expect.anything() }));
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'pago-efectivo-1', cierreCaja: expect.anything() }));
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'pago-tarjeta-1', cierreCaja: expect.anything() }));
  });

  it('debería retornar null si no hay un turno de caja abierto', async () => {
    jest.spyOn(cierreCajaRepository, 'findOne').mockResolvedValue(null);
    const resultado = await service.cerrarCajaAutomaticamente('cualquier-id', 'cualquier-id');
    expect(resultado).toBeNull();
  });
});
