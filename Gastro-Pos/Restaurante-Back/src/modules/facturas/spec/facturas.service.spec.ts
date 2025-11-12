import { Test, TestingModule } from '@nestjs/testing';
import { FacturasService } from '../facturas.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FacturaEntity, TipoFactura } from '../entities/factura.entity';
import { FacturaPedidoEntity } from '../entities/factura-pedido.entity';
import { EstablecimientosService } from '../../establecimientos/establecimientos.service';
import { PedidosService } from '../../pedidos/pedidos.service';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { PedidoEntity, EstadoPedido, TipoPedido } from '../../pedidos/entities/pedido.entity';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { UsuarioEntity } from '../../usuarios/entities/usuario.entity';
import { ClienteEntity } from '../../clientes/entities/cliente.entity';
import { FacturaPagosCliente } from '../entities/factura-pagos-cliente.entity';
import { PagoEntity } from '../../pagos/entities/pago.entity';
import { CreateFacturaAndPaymentDto } from '../dto/create-factura-and-payment.dto';
import { CuentaBancariaEntity } from '../../cuentas-banco/entities/cuenta-bancaria.entity';
import { CuentasBancariasService } from '../../cuentas-banco/cuentas-bancarias.service';
import { ProductoEntity } from '../../productos/entities/producto.entity';
import { PedidoItemEntity } from '../../pedidos/entities/pedido-item.entity';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { MedioPagoEntity } from '../../cuentas-banco/entities/medio-pago.entity';

// Mock del módulo de axios para evitar llamadas reales a la API externa
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FacturasService', () => {
  let service: FacturasService;
  let mockFacturaRepository: any;
  let mockFacturaPedidoRepository: any;
  let mockClienteRepository: any;
  let mockFacturaPagosClienteRepository: any;
  let mockPagoRepository: any;
  let mockEstablecimientosService: any;
  let mockPedidosService: any;
  let mockUsuariosService: any;
  let mockCuentasBancariasService: any;
  let mockDataSource: any;

  // Mocks de Entidades Completos y Reutilizables
  const mockEstablecimiento: EstablecimientoEntity = {
    id: 'mock-establecimiento-id',
    nombre: 'Restaurante Test',
    direccion: 'Calle Falsa 123',
    telefono: '123456789',
    email: 'test@restaurante.com',
    nit: '123456789',
    impuesto_porcentaje: 19,
    codigo_postal: '110001',
    api_key: 'test_api_key',
    activo: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockProducto: ProductoEntity = {
    id: 'producto-id-1',
    establecimiento_id: mockEstablecimiento.id,
    nombre: 'Producto de prueba',
    nombre_mostrar: 'Producto A',
    descripcion: 'Descripción del producto A',
    imagen_url: 'http://imagen.com',
    precio: 25000,
    iva: 0.19,
    ic: 0,
    inc: 0,
    categoria_id: 'categoria-id-1',
    activa: true,
    tipo_producto: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPedidoItem: PedidoItemEntity = {
    id: 'item-1',
    pedido_id: 'mock-pedido-id',
    producto_id: mockProducto.id,
    cantidad: 2,
    precio_unitario_al_momento_venta: mockProducto.precio,
    producto: mockProducto,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPedido: PedidoEntity = {
    id: 'mock-pedido-id',
    establecimiento_id: mockEstablecimiento.id,
    mesa_id: null,
    usuario_creador_id: 'some-user',
    usuario_domiciliario_id: null,
    estado: EstadoPedido.ABIERTO,
    tipo_pedido: TipoPedido.RESTAURANTE,
    total_estimado: 50000,
    descuentos_aplicados: 0,
    impuesto_aplicado: 0,
    notas: null,
    nombre_cliente_pedido: null,
    fecha_hora_pedido: new Date(),
    fecha_hora_estado: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    facturaPedidos: [],
    pedidoItems: [mockPedidoItem],
  };

  beforeEach(async () => {
    mockFacturaRepository = { save: jest.fn(factura => factura), findOne: jest.fn(), find: jest.fn(), delete: jest.fn(), };
    mockFacturaPedidoRepository = { find: jest.fn(() => []), save: jest.fn(fp => fp), };
    mockClienteRepository = { manager: { create: jest.fn(), save: jest.fn() }, findOne: jest.fn(), };
    mockFacturaPagosClienteRepository = { save: jest.fn(fpc => fpc), };
    mockPagoRepository = { save: jest.fn(pago => pago), };

    mockEstablecimientosService = { findOne: jest.fn(() => mockEstablecimiento) };
    mockPedidosService = { updatePedidoStatus: jest.fn(), findOne: jest.fn() };
    mockUsuariosService = { findOne: jest.fn(() => ({
      id: 'mock-usuario-id',
      nombre: 'Cajero',
      apellido: 'Test',
      establecimiento_id: mockEstablecimiento.id,
      correo_electronico: 'cajero@test.com',
      username: 'cajerotest',
      password_hash: 'hash_password',
      activo: true,
      rol_id: 'mock-rol-id',
      created_at: new Date(),
      updated_at: new Date(),
    } as UsuarioEntity)),
    };

    const mockMedioPago: MedioPagoEntity = {
      id: 'mock-medio-pago-id',
      establecimiento_id: mockEstablecimiento.id,
      nombre: 'Efectivo',
      es_efectivo: true,
      activo: true,
      created_at: new Date(),
      updated_at: new Date(),
      establecimiento: mockEstablecimiento,
    };

    const mockCuentaBancaria: CuentaBancariaEntity = {
      id: 'mock-cuenta-id',
      nombre_banco: 'Caja Efectivo',
      tipo_cuenta: 'Ahorros',
      numero_cuenta: '123456789',
      activa: true,
      establecimiento_id: mockEstablecimiento.id,
      medio_pago_asociado: mockMedioPago,
      medio_pago_asociado_id: mockMedioPago.id,
      codigo_puc: '110505',
      created_at: new Date(),
      updated_at: new Date(),
      establecimiento: mockEstablecimiento,
      movimientos: [],
    };
    mockCuentasBancariasService = {
      findOne: jest.fn(() => mockCuentaBancaria),
      findDefaultCashAccount: jest.fn(() => mockCuentaBancaria),
    };

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      isTransactionActive: true,
      manager: {
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
      },
    };
    mockDataSource = { createQueryRunner: jest.fn(() => mockQueryRunner) };
    mockQueryRunner.manager.save.mockImplementation((entity) => entity);
    mockQueryRunner.manager.create.mockImplementation((entity, data) => ({ ...data }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacturasService,
        { provide: getRepositoryToken(FacturaEntity), useValue: mockFacturaRepository },
        { provide: getRepositoryToken(FacturaPedidoEntity), useValue: mockFacturaPedidoRepository },
        { provide: getRepositoryToken(ClienteEntity), useValue: mockClienteRepository },
        { provide: getRepositoryToken(FacturaPagosCliente), useValue: mockFacturaPagosClienteRepository },
        { provide: getRepositoryToken(PagoEntity), useValue: mockPagoRepository },
        { provide: EstablecimientosService, useValue: mockEstablecimientosService },
        { provide: PedidosService, useValue: mockPedidosService },
        { provide: UsuariosService, useValue: mockUsuariosService },
        { provide: CuentasBancariasService, useValue: mockCuentasBancariasService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<FacturasService>(FacturasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('createFacturaAndPaymentForOrder', () => {
    it('debería crear una factura y un pago para un pedido con pago en efectivo', async () => {
      mockDataSource.createQueryRunner().manager.findOne.mockResolvedValueOnce(mockPedido);
      mockDataSource.createQueryRunner().manager.find.mockResolvedValueOnce([]);
      mockDataSource.createQueryRunner().manager.find.mockResolvedValueOnce([]);
      mockedAxios.post.mockResolvedValue({
        data: {
          status: true,
          pdf_base64: 'mock-pdf-base64',
        },
      });

      const dto: CreateFacturaAndPaymentDto = {
        pedido_id: 'mock-pedido-id',
        monto_pagado: 50000,
        es_efectivo: true,
        denominaciones_efectivo: { billete_50000: 1 },
        propina: 0,
      };

      const result = await service.createFacturaAndPaymentForOrder(dto, 'mock-usuario-id', 'mock-establecimiento-id');

      expect(mockDataSource.createQueryRunner().connect).toHaveBeenCalled();
      expect(mockDataSource.createQueryRunner().startTransaction).toHaveBeenCalled();
      expect(mockDataSource.createQueryRunner().manager.save).toHaveBeenCalledWith(expect.any(FacturaEntity), expect.anything());
      expect(mockDataSource.createQueryRunner().manager.save).toHaveBeenCalledWith(expect.any(FacturaPedidoEntity), expect.anything());
      expect(mockDataSource.createQueryRunner().manager.save).toHaveBeenCalledWith(expect.any(PagoEntity), expect.anything());
      expect(mockDataSource.createQueryRunner().commitTransaction).toHaveBeenCalled();
      expect(mockDataSource.createQueryRunner().release).toHaveBeenCalled();
      expect(mockPedidosService.updatePedidoStatus).toHaveBeenCalledWith('mock-pedido-id', EstadoPedido.PAGADO, 'mock-establecimiento-id', 'mock-usuario-id', expect.anything());
      expect(result).toBeDefined();
      expect(result.tipo_factura).toEqual(TipoFactura.TOTAL);
      expect(result.total_factura).toEqual(50000);
    });

    it('debería lanzar un NotFoundException si el pedido no existe', async () => {
      mockDataSource.createQueryRunner().manager.findOne.mockResolvedValueOnce(null);
      const dto: CreateFacturaAndPaymentDto = { pedido_id: 'pedido-inexistente', monto_pagado: 10000, es_efectivo: true, propina: 0 };

      await expect(service.createFacturaAndPaymentForOrder(dto, 'user-id', 'est-id')).rejects.toThrow(NotFoundException);
      expect(mockDataSource.createQueryRunner().rollbackTransaction).toHaveBeenCalled();
      expect(mockDataSource.createQueryRunner().release).toHaveBeenCalled();
    });

    it('debería lanzar un ConflictException si el pedido ya está completamente facturado', async () => {
      const mockPedidoFacturado: PedidoEntity = {
        ...mockPedido,
        facturaPedidos: [{
          id: 'fp-1',
          factura_id: 'f-1',
          pedido_id: mockPedido.id,
          monto_aplicado: 50000,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };
      mockDataSource.createQueryRunner().manager.findOne.mockResolvedValueOnce(mockPedidoFacturado);
      mockDataSource.createQueryRunner().manager.find.mockResolvedValueOnce(mockPedidoFacturado.facturaPedidos);

      const dto: CreateFacturaAndPaymentDto = { pedido_id: 'mock-pedido-id', monto_pagado: 1000, es_efectivo: true, propina: 0 };

      await expect(service.createFacturaAndPaymentForOrder(dto, 'user-id', 'est-id')).rejects.toThrow(ConflictException);
      expect(mockDataSource.createQueryRunner().rollbackTransaction).toHaveBeenCalled();
    });

    it('debería lanzar un BadRequestException si el monto excede el total para pagos no en efectivo', async () => {
      const dto: CreateFacturaAndPaymentDto = {
        pedido_id: 'mock-pedido-id',
        monto_pagado: 60000,
        es_efectivo: false,
        cuenta_id: 'mock-cuenta-id',
        propina: 0,
      };

      mockDataSource.createQueryRunner().manager.findOne.mockResolvedValueOnce(mockPedido);
      mockDataSource.createQueryRunner().manager.find.mockResolvedValueOnce([]);

      const mockCuentaBancariaNoEfectivo: CuentaBancariaEntity = {
        id: 'mock-cuenta-id',
        nombre_banco: 'Banco Test',
        tipo_cuenta: 'Corriente',
        numero_cuenta: '98765',
        activa: true,
        establecimiento_id: 'est-id',
        medio_pago_asociado: {
            id: 'mp-2',
            nombre: 'Tarjeta',
            es_efectivo: false,
            created_at: new Date(),
            updated_at: new Date(),
            activo: true,
            establecimiento_id: 'est-id',
        },
        medio_pago_asociado_id: 'mp-2',
        codigo_puc: '110505',
        created_at: new Date(),
        updated_at: new Date(),
        establecimiento: mockEstablecimiento,
        movimientos: [],
      };

      mockCuentasBancariasService.findOne.mockResolvedValueOnce(mockCuentaBancariaNoEfectivo);

      await expect(service.createFacturaAndPaymentForOrder(dto, 'user-id', 'est-id')).rejects.toThrow(BadRequestException);
      expect(mockDataSource.createQueryRunner().rollbackTransaction).toHaveBeenCalled();
    });

    it('debería lanzar un error si el guardado en la base de datos falla', async () => {
        mockDataSource.createQueryRunner().manager.findOne.mockResolvedValueOnce(mockPedido);
        mockDataSource.createQueryRunner().manager.find.mockResolvedValueOnce([]);
        mockDataSource.createQueryRunner().manager.save.mockRejectedValue(new Error('Fallo al guardar factura'));

        const dto: CreateFacturaAndPaymentDto = { pedido_id: 'mock-pedido-id', monto_pagado: 10000, es_efectivo: true, propina: 0 };

        await expect(service.createFacturaAndPaymentForOrder(dto, 'user-id', 'est-id')).rejects.toThrow('Fallo al guardar factura');
        expect(mockDataSource.createQueryRunner().rollbackTransaction).toHaveBeenCalled();
        expect(mockDataSource.createQueryRunner().release).toHaveBeenCalled();
    });
  });
});


















// import { Test, TestingModule } from '@nestjs/testing';
// import { FacturasService } from '../facturas.service';
// import { CierreCajaEntity } from '../../cierre-caja/entities/cierre-caja.entity';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { Repository, DataSource, QueryRunner } from 'typeorm';
// import { FacturaEntity, TipoFactura } from '../entities/factura.entity';
// import { FacturaPedidoEntity } from '../entities/factura-pedido.entity';
// import { EstablecimientosService } from '../../establecimientos/establecimientos.service';
// import { PedidosService } from '../../pedidos/pedidos.service';
// import { MediosPagoService } from '../../medios-pago/medios-pago.service';
// import { UsuariosService } from '../../usuarios/usuarios.service';
// import { PedidoEntity, EstadoPedido, TipoPedido } from '../../pedidos/entities/pedido.entity';
// import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
// import { UsuarioEntity } from '../../usuarios/entities/usuario.entity';
// import { RolEntity } from '../../roles/entities/rol.entity';
// import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
// import { v4 as uuidv4 } from 'uuid';
// import { EstablecimientoConfiguracionPedidoEntity } from '../../establecimientos/entities/configuracion-pedidos.entity';
// import { ClienteEntity } from '../../../modules/clientes/entities/cliente.entity';
// import { FacturaPagosCliente } from '../entities/factura-pagos-cliente.entity'; // Importar FacturaPagosCliente
// import { PagoEntity } from '../../pagos/entities/pago.entity'; // Importar PagoEntity
// import { PagoDto } from '../dto/pago.dto'; // Importar PagoDto

// const MOCK_ESTABLECIMIENTO_ID = uuidv4();
// const MOCK_USUARIO_CAJERO_ID = uuidv4();
// const MOCK_PEDIDO_ID_1 = uuidv4();
// const MOCK_PEDIDO_ID_2 = uuidv4();
// const MOCK_FACTURA_ID = uuidv4();
// const MOCK_MEDIO_PAGO_EFECTIVO_ID = uuidv4();
// const MOCK_MEDIO_PAGO_TARJETA_ID = uuidv4();
// const MOCK_CLIENTE_ID = uuidv4();

// const mockEstablecimientoConfiguracion: EstablecimientoConfiguracionPedidoEntity = {
//   id: uuidv4(),
//   establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//   limite_cancelacion_preparacion_minutos: 10,
//   limite_cancelacion_enviado_cocina_minutos: 5,
//   limite_edicion_pedido_minutos: 15,
//   created_at: new Date(),
//   updated_at: new Date(),
// } as EstablecimientoConfiguracionPedidoEntity;

// const mockEstablecimiento: EstablecimientoEntity = {
//   id: MOCK_ESTABLECIMIENTO_ID,
//   nombre: 'Mi Restaurante',
//   direccion: 'Calle Falsa 123',
//   telefono: '123456789',
//   impuesto_porcentaje: 10,
//   activo: true,
//   created_at: new Date(),
//   updated_at: new Date(),
//   configuracionPedido: mockEstablecimientoConfiguracion,
// };

// const mockRol: RolEntity = {
//   id: uuidv4(),
//   nombre: 'Cajero',
//   created_at: new Date(),
//   updated_at: new Date(),
// };

// const mockUsuarioCajero: UsuarioEntity = {
//     id: MOCK_USUARIO_CAJERO_ID,
//     establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//     rol_id: mockRol.id,
//     nombre: 'Cajero Prueba',
//     apellido: 'Test',
//     username: 'cajero@test.com',
//     password_hash: 'hashed_password',
//     activo: true,
//     created_at: new Date(),
//     updated_at: new Date(),
//     establecimiento: mockEstablecimiento,
//     rol: mockRol,
// };

// const mockPedidoCerrado: PedidoEntity = {
//   id: MOCK_PEDIDO_ID_1,
//   establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//   mesa_id: uuidv4(),
//   usuario_creador_id: uuidv4(),
//   usuario_domiciliario_id: null,
//   usuario_cancelador_id: null,
//   tipo_pedido: TipoPedido.MESA,
//   estado: EstadoPedido.CERRADO,
//   total_estimado: 100.00,
//   descuentos_aplicados: 0.00,
//   notas: null,
//   fecha_hora_pedido: new Date(),
//   fecha_hora_cierre: new Date(),
//   fecha_cancelacion: null,
//   created_at: new Date(),
//   updated_at: new Date(),
//   fecha_ultima_actualizacion_relevante_cocina: null,
//   establecimiento: mockEstablecimiento,
//   mesa: null,
//   usuarioCreador: null,
//   usuarioDomiciliario: null,
//   usuarioCancelador: null,
//   pedidoItems: [],
//   cliente_nombre: null,
//   cliente_telefono: null,
//   cliente_direccion: null,
// };

// const mockPedidoAbierto: PedidoEntity = {
//   id: MOCK_PEDIDO_ID_2,
//   establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//   mesa_id: uuidv4(),
//   usuario_creador_id: uuidv4(),
//   usuario_domiciliario_id: null,
//   usuario_cancelador_id: null,
//   tipo_pedido: TipoPedido.MESA,
//   estado: EstadoPedido.ABIERTO,
//   total_estimado: 200.00,
//   descuentos_aplicados: 0.00,
//   notas: null,
//   fecha_hora_pedido: new Date(),
//   fecha_hora_cierre: null,
//   fecha_cancelacion: null,
//   created_at: new Date(),
//   updated_at: new Date(),
//   fecha_ultima_actualizacion_relevante_cocina: null,
//   establecimiento: mockEstablecimiento,
//   mesa: null,
//   usuarioCreador: null,
//   usuarioDomiciliario: null,
//   usuarioCancelador: null,
//   pedidoItems: [],
//   cliente_nombre: null,
//   cliente_telefono: null,
//   cliente_direccion: null,
// };

// const mockCierreCaja: CierreCajaEntity = {
//   id: uuidv4(),
//   establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//   usuario_cajero_id: MOCK_USUARIO_CAJERO_ID,
//   fecha_hora_apertura: new Date(),
//   fecha_hora_cierre: null,
//   saldo_inicial_caja: 100.00,
//   saldo_final_contado: 0.00,
//   total_ventas_brutas: 0.00,
//   total_descuentos: 0.00,
//   total_impuestos: 0.00,
//   total_propina: 0.00,
//   total_neto_ventas: 0.00,
//   total_pagos_efectivo: 0.00,
//   total_pagos_tarjeta: 0.00,
//   total_pagos_otros: 0.00,
//   total_recaudado: 0.00,
//   diferencia_caja: 0.00,
//   cerrado: false,
//   observaciones: null,
//   created_at: new Date(),
//   updated_at: new Date(),
//   establecimiento: mockEstablecimiento,
//   usuarioCajero: mockUsuarioCajero,
//   facturas: [],
//   pagos: [],
// };

// const mockMedioPagoEfectivo = {
//   id: MOCK_MEDIO_PAGO_EFECTIVO_ID,
//   nombre: 'Efectivo',
//   es_efectivo: true,
//   activo: true,
//   establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//   created_at: new Date(),
//   updated_at: new Date(),
// };

// const mockMedioPagoTarjeta = {
//   id: MOCK_MEDIO_PAGO_TARJETA_ID,
//   nombre: 'Tarjeta de Crédito',
//   es_efectivo: false,
//   activo: true,
//   establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//   created_at: new Date(),
//   updated_at: new Date(),
// };

// const mockCliente: ClienteEntity = {
//   id: MOCK_CLIENTE_ID,
//   tipo_documento: 'CC',
//   numero_documento: '123456789',
//   nombre_completo: 'Cliente de Prueba',
//   correo_electronico: 'cliente@prueba.com',
//   created_at: new Date(),
//   updated_at: new Date(),
// };

// const mockPagoDto: PagoDto = {
//   monto_pagado: 100,
//   medio_pago_id: MOCK_MEDIO_PAGO_EFECTIVO_ID,
//   metodo_pago: 'Efectivo', // Este campo se omite en AddPaymentToInvoiceDto, pero es parte de PagoDto
//   referencia_transaccion: null,
//   denominaciones_efectivo: { '100': 1 },
//   tipo_documento: 'CC',
//   numero_documento: '123456789',
//   nombre_completo: 'Cliente de Prueba',
//   correo_electronico: 'cliente@prueba.com',
// };

// const mockFacturaPagosCliente: FacturaPagosCliente = {
//   id: uuidv4(),
//   factura_id: MOCK_FACTURA_ID,
//   cliente_id: MOCK_CLIENTE_ID,
//   monto_pagado: 100,
//   metodo_pago: 'Efectivo',
//   created_at: new Date(),
//   updated_at: new Date(),
//   factura: null, // Se puede mockear si es necesario para tests específicos
//   cliente: null, // Se puede mockear si es necesario para tests específicos
// };

// const mockPagoEntity: PagoEntity = {
//   id: uuidv4(),
//   factura_id: MOCK_FACTURA_ID,
//   medio_pago_id: MOCK_MEDIO_PAGO_EFECTIVO_ID,
//   monto_recibido: 100,
//   referencia_transaccion: null,
//   denominaciones_efectivo: { '100': 1 },
//   fecha_hora_pago: new Date(),
//   cierre_caja_id: null,
//   created_at: new Date(),
//   updated_at: new Date(),
//   factura: null,
//   medioPago: null,
//   cierreCaja: null,
// };


// describe('FacturasService', () => {
//   let service: FacturasService;
//   let facturaRepository: Repository<FacturaEntity>;
//   let facturaPedidoRepository: Repository<FacturaPedidoEntity>;
//   let clienteRepository: Repository<ClienteEntity>; // Añadido
//   let facturaPagosClienteRepository: Repository<FacturaPagosCliente>; // Añadido
//   let pagoRepository: Repository<PagoEntity>; // Añadido
//   let establecimientosService: EstablecimientosService;
//   let pedidosService: PedidosService;
//   let mediosPagoService: MediosPagoService;
//   let usuariosService: UsuariosService;
//   let dataSource: DataSource;
//   let queryRunner: QueryRunner;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         FacturasService,
//         {
//           provide: getRepositoryToken(FacturaEntity),
//           useClass: Repository,
//         },
//         {
//           provide: getRepositoryToken(FacturaPedidoEntity),
//           useClass: Repository,
//         },
//         {
//           provide: getRepositoryToken(ClienteEntity), // Añadido
//           useClass: Repository,
//         },
//         {
//           provide: getRepositoryToken(FacturaPagosCliente), // Añadido
//           useClass: Repository,
//         },
//         {
//           provide: getRepositoryToken(PagoEntity), // Añadido
//           useClass: Repository,
//         },
//         {
//           provide: EstablecimientosService,
//           useValue: {
//             findOne: jest.fn().mockResolvedValue(mockEstablecimiento),
//           },
//         },
//         {
//           provide: PedidosService,
//           useValue: {
//             findOne: jest.fn(),
//             updatePedidoStatus: jest.fn().mockResolvedValue(true),
//           },
//         },
//         {
//           provide: MediosPagoService,
//           useValue: {
//             findOne: jest.fn().mockImplementation((id: string) => {
//               if (id === MOCK_MEDIO_PAGO_EFECTIVO_ID) return mockMedioPagoEfectivo;
//               if (id === MOCK_MEDIO_PAGO_TARJETA_ID) return mockMedioPagoTarjeta;
//               return null;
//             }),
//           },
//         },
//         {
//           provide: UsuariosService,
//           useValue: {
//             findOne: jest.fn().mockResolvedValue(mockUsuarioCajero),
//           },
//         },
//         {
//           provide: DataSource,
//           useValue: {
//             createQueryRunner: jest.fn(),
//           },
//         },
//       ],
//     }).compile();

//     service = module.get<FacturasService>(FacturasService);
//     facturaRepository = module.get<Repository<FacturaEntity>>(getRepositoryToken(FacturaEntity));
//     facturaPedidoRepository = module.get<Repository<FacturaPedidoEntity>>(getRepositoryToken(FacturaPedidoEntity));
//     clienteRepository = module.get<Repository<ClienteEntity>>(getRepositoryToken(ClienteEntity)); // Añadido
//     facturaPagosClienteRepository = module.get<Repository<FacturaPagosCliente>>(getRepositoryToken(FacturaPagosCliente)); // Añadido
//     pagoRepository = module.get<Repository<PagoEntity>>(getRepositoryToken(PagoEntity)); // Añadido
//     establecimientosService = module.get<EstablecimientosService>(EstablecimientosService);
//     pedidosService = module.get<PedidosService>(PedidosService);
//     mediosPagoService = module.get<MediosPagoService>(MediosPagoService);
//     usuariosService = module.get<UsuariosService>(UsuariosService);
//     dataSource = module.get<DataSource>(DataSource);
//     queryRunner = {
//       connect: jest.fn().mockResolvedValue(undefined),
//       startTransaction: jest.fn().mockResolvedValue(undefined),
//       commitTransaction: jest.fn().mockResolvedValue(undefined),
//       rollbackTransaction: jest.fn().mockResolvedValue(undefined),
//       release: jest.fn().mockResolvedValue(undefined),
//       manager: {
//         save: jest.fn((entity) => Promise.resolve(entity)),
//         findOne: jest.fn((entity, options) => {
//           if (entity === PedidoEntity && options.where.id === MOCK_PEDIDO_ID_1) {
//             return Promise.resolve(mockPedidoCerrado);
//           }
//           if (entity === PedidoEntity && options.where.id === MOCK_PEDIDO_ID_2) {
//             return Promise.resolve(mockPedidoAbierto);
//           }
//           if (entity === EstablecimientoEntity && options.where.id === MOCK_ESTABLECIMIENTO_ID) {
//             return Promise.resolve(mockEstablecimiento);
//           }
//           if (entity === ClienteEntity && options.where.numero_documento === mockCliente.numero_documento) { // Mock para ClienteEntity
//             return Promise.resolve(mockCliente);
//           }
//           return Promise.resolve(null);
//         }),
//         find: jest.fn((entity, options) => {
//           if (entity === FacturaPedidoEntity) {
//             return Promise.resolve([]);
//           }
//           if (entity === PedidoEntity && options.where.id && options.where.establecimiento_id) {
//             const ids = options.where.id.value;
//             const foundPedidos = [mockPedidoCerrado, mockPedidoAbierto].filter(p => ids.includes(p.id));
//             return Promise.resolve(foundPedidos);
//           }
//           if (entity === FacturaPagosCliente) { // Mock para FacturaPagosCliente
//             return Promise.resolve([]);
//           }
//           return Promise.resolve([]);
//         }),
//         update: jest.fn().mockResolvedValue({ affected: 1, raw: [] }),
//         count: jest.fn().mockResolvedValue(0),
//       },
//     } as unknown as QueryRunner;

//     jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(queryRunner);

//     jest.spyOn(facturaRepository, 'delete').mockResolvedValue({ affected: 1, raw: [] });
//     // Mock para el método findOne de FacturasService, usado en update y remove
//     jest.spyOn(service, 'findOne').mockResolvedValue({
//       id: MOCK_FACTURA_ID,
//       establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//       total_factura: 100,
//       tipo_factura: TipoFactura.TOTAL,
//       fecha_hora_factura: new Date(),
//       subtotal: 0,
//       impuestos: 0,
//       descuentos: 0,
//       propina: 0,
//       usuario_cajero_id: MOCK_USUARIO_CAJERO_ID,
//       establecimiento: mockEstablecimiento,
//       facturaPedidos: [],
//       notas: '',
//       created_at: new Date(),
//       updated_at: new Date(),
//       usuarioCajero: mockUsuarioCajero,
//       cierreCaja: mockCierreCaja,
//       pagos: [], // Asegúrate de que los mocks de FacturaEntity incluyan 'pagos'
//     });
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('debería estar definido el servicio', () => {
//     expect(service).toBeDefined();
//   });

//   describe('create', () => {
//     // Mock de un CreateFacturaDto válido para reutilizar
//     const validCreateFacturaDto = {
//         establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//         subtotal: 100.00,
//         impuestos: 10.00,
//         descuentos: 0,
//         propina: 5.00,
//         total_factura: 115.00,
//         tipo_factura: TipoFactura.TOTAL,
//         facturaPedidos: [{ pedido_id: MOCK_PEDIDO_ID_1, monto_aplicado: 100.00 }],
//         notas: 'Factura de prueba',
//         pagos: [mockPagoDto], // ¡Añadir la propiedad 'pagos'!
//     };

//     it('no debería crear una factura si el subtotal no coincide con la suma de montos aplicados de pedidos', async () => {
//         pedidosService.findOne = jest.fn().mockResolvedValue(mockPedidoCerrado);
//         (queryRunner.manager.find as jest.Mock)
//             .mockResolvedValueOnce([mockPedidoCerrado])
//             .mockResolvedValueOnce([]);
//         const createFacturaDto = {
//             ...validCreateFacturaDto,
//             subtotal: 90.00, // Subtotal incorrecto
//             total_factura: 105.00, // Total incorrecto para que coincida con el subtotal
//             pagos: [{...mockPagoDto, monto_pagado: 105.00}] // Ajustar el pago para que el total de pagos coincida con el total_factura
//         };

//         await expect(service.create(createFacturaDto, MOCK_USUARIO_CAJERO_ID)).rejects.toThrow(BadRequestException);
//         expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//         expect(queryRunner.release).toHaveBeenCalled();
//     });

//     it('debería lanzar BadRequestException si el monto aplicado es cero o negativo', async () => {
//         pedidosService.findOne = jest.fn().mockResolvedValue(mockPedidoCerrado);
//         (queryRunner.manager.find as jest.Mock)
//             .mockResolvedValueOnce([mockPedidoCerrado])
//             .mockResolvedValueOnce([]);

//         const createFacturaDto = {
//             ...validCreateFacturaDto,
//             subtotal: 0.00,
//             impuestos: 0,
//             descuentos: 0,
//             propina: 0,
//             total_factura: 0.00,
//             facturaPedidos: [{ pedido_id: MOCK_PEDIDO_ID_1, monto_aplicado: -10.00 }], // Monto aplicado negativo
//             pagos: [{...mockPagoDto, monto_pagado: 0.00}], // Ajustar el pago
//         };

//         await expect(service.create(createFacturaDto, MOCK_USUARIO_CAJERO_ID)).rejects.toThrow(BadRequestException);
//         expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//     });

//     it('debería lanzar BadRequestException si el monto a facturar excede el monto restante del pedido', async () => {
//       const pedidoConMontoRestante = { ...mockPedidoCerrado, total_estimado: 50.00 };
//       pedidosService.findOne = jest.fn().mockResolvedValue(pedidoConMontoRestante);
//       (queryRunner.manager.find as jest.Mock)
//         .mockResolvedValueOnce([pedidoConMontoRestante])
//         .mockResolvedValueOnce([]);
//       const createFacturaDto = {
//         ...validCreateFacturaDto,
//         subtotal: 100.00, // Subtotal que excede el monto restante del pedido
//         total_factura: 100.00,
//         facturaPedidos: [{ pedido_id: MOCK_PEDIDO_ID_1, monto_aplicado: 100.00 }],
//         pagos: [{...mockPagoDto, monto_pagado: 100.00}],
//       };

//       await expect(service.create(createFacturaDto, MOCK_USUARIO_CAJERO_ID)).rejects.toThrow(BadRequestException);
//       expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//     });

//     it('debería lanzar NotFoundException si uno o más pedidos no fueron encontrados', async () => {
//         pedidosService.findOne = jest.fn().mockResolvedValue(null);
//         (queryRunner.manager.find as jest.Mock).mockResolvedValueOnce([]);
//         const createFacturaDto = {
//             ...validCreateFacturaDto,
//             facturaPedidos: [{ pedido_id: uuidv4(), monto_aplicado: 100.00 }], // ID de pedido inexistente
//         };

//         await expect(service.create(createFacturaDto, MOCK_USUARIO_CAJERO_ID)).rejects.toThrow(NotFoundException);
//         expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//     });

//     it('debería lanzar BadRequestException si el pedido no está en un estado válido para facturar', async () => {
//         const mockPedidoInvalido = { ...mockPedidoCerrado, estado: EstadoPedido.EN_PREPARACION };
//         pedidosService.findOne = jest.fn().mockResolvedValue(mockPedidoInvalido);
//         (queryRunner.manager.find as jest.Mock).mockResolvedValueOnce([mockPedidoInvalido]);

//         const createFacturaDto = {
//             ...validCreateFacturaDto,
//             facturaPedidos: [{ pedido_id: MOCK_PEDIDO_ID_1, monto_aplicado: 100.00 }],
//         };

//         await expect(service.create(createFacturaDto, MOCK_USUARIO_CAJERO_ID)).rejects.toThrow(BadRequestException);
//         expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//     });

//     it('debería crear una factura parcial y mantener el estado del pedido en CERRADO si ya lo estaba, o cambiarlo a CERRADO si estaba ABIERTO y no completamente pagado', async () => {
//       const mockPedidoParaParcial = { ...mockPedidoAbierto, total_estimado: 200.00 };
//       pedidosService.findOne = jest.fn().mockResolvedValue(mockPedidoParaParcial);
//       (queryRunner.manager.find as jest.Mock)
//           .mockResolvedValueOnce([mockPedidoParaParcial])
//           .mockResolvedValueOnce([]);

//       const createFacturaDto = {
//           establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//           subtotal: 100.00,
//           impuestos: 0,
//           descuentos: 0,
//           propina: 0,
//           total_factura: 100.00,
//           tipo_factura: TipoFactura.PARCIAL,
//           facturaPedidos: [{ pedido_id: MOCK_PEDIDO_ID_2, monto_aplicado: 100.00 }],
//           pagos: [mockPagoDto], // Incluir pagos
//       };

//       const savedFacturaMock: FacturaEntity = {
//         id: MOCK_FACTURA_ID,
//         establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//         subtotal: 100.00,
//         impuestos: 0,
//         descuentos: 0,
//         propina: 0,
//         total_factura: 100.00,
//         tipo_factura: TipoFactura.PARCIAL,
//         usuario_cajero_id: MOCK_USUARIO_CAJERO_ID,
//         fecha_hora_factura: new Date(),
//         created_at: new Date(),
//         updated_at: new Date(),
//         usuarioCajero: mockUsuarioCajero,
//         establecimiento: mockEstablecimiento,
//         cierreCaja: mockCierreCaja,
//         notas: '',
//         facturaPedidos: [],
//         pagos: [mockFacturaPagosCliente], // Incluir pagos en el mock de FacturaEntity
//       };
//       (queryRunner.manager.save as jest.Mock).mockResolvedValueOnce(savedFacturaMock);
//       (queryRunner.manager.save as jest.Mock).mockResolvedValueOnce([]);

//       jest.spyOn(service, 'findOne').mockResolvedValue(savedFacturaMock);

//       await service.create(createFacturaDto, MOCK_USUARIO_CAJERO_ID);

//       expect(pedidosService.updatePedidoStatus).toHaveBeenCalledWith(
//           MOCK_PEDIDO_ID_2,
//           EstadoPedido.CERRADO,
//           MOCK_ESTABLECIMIENTO_ID,
//           MOCK_USUARIO_CAJERO_ID,
//       );
//       expect(pedidosService.updatePedidoStatus).not.toHaveBeenCalledWith(
//           MOCK_PEDIDO_ID_2,
//           EstadoPedido.PAGADO,
//           MOCK_ESTABLECIMIENTO_ID,
//           MOCK_USUARIO_CAJERO_ID,
//       );
//       expect(queryRunner.commitTransaction).toHaveBeenCalled();
//     });

//     it('debería lanzar BadRequestException si se intenta facturar un pedido que ya está completamente facturado', async () => {
//         pedidosService.findOne = jest.fn().mockResolvedValue(mockPedidoCerrado);
//         (queryRunner.manager.find as jest.Mock)
//             .mockResolvedValueOnce([mockPedidoCerrado])
//             .mockResolvedValueOnce([{ monto_aplicado: mockPedidoCerrado.total_estimado }]);
//         const createFacturaDto = {
//             establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//             subtotal: 100.00,
//             impuestos: 0,
//             descuentos: 0,
//             propina: 0,
//             total_factura: 100.00,
//             tipo_factura: TipoFactura.TOTAL,
//             facturaPedidos: [{ pedido_id: MOCK_PEDIDO_ID_1, monto_aplicado: 100.00 }],
//             pagos: [mockPagoDto], // Incluir pagos
//         };

//         await expect(service.create(createFacturaDto, MOCK_USUARIO_CAJERO_ID)).rejects.toThrow(BadRequestException);
//         expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//     });
//   });

//   describe('splitBill', () => {
//     it('debería lanzar BadRequestException si la suma de los pagos excede el monto restante del pedido', async () => {
//       pedidosService.findOne = jest.fn().mockResolvedValue(mockPedidoCerrado);
//       (queryRunner.manager.find as jest.Mock)
//         .mockResolvedValueOnce([]);

//       const splitBillDto = {
//         pedido_id: MOCK_PEDIDO_ID_1,
//         pagos: [ // Ahora SplitBillDto espera 'pagos'
//           { monto_pagado: 60.00, medio_pago_id: MOCK_MEDIO_PAGO_EFECTIVO_ID, metodo_pago: 'Efectivo' },
//           { monto_pagado: 50.00, medio_pago_id: MOCK_MEDIO_PAGO_TARJETA_ID, metodo_pago: 'Tarjeta' },
//         ],
//         propina_total: 0,
//       };

//       await expect(service.splitBill(splitBillDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_CAJERO_ID)).rejects.toThrow(BadRequestException);
//       expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//     });

//     it('debería lanzar NotFoundException si el pedido a dividir no se encuentra', async () => {
//       pedidosService.findOne = jest.fn().mockResolvedValue(null);
//       const splitBillDto = {
//         pedido_id: 'non-existent-pedido-id',
//         pagos: [{ monto_pagado: 50.00, medio_pago_id: MOCK_MEDIO_PAGO_EFECTIVO_ID, metodo_pago: 'Efectivo' }], // Incluir pagos
//         propina_total: 0,
//       };

//       await expect(service.splitBill(splitBillDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_CAJERO_ID)).rejects.toThrow(NotFoundException);
//       expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//     });
//   }); // Cierre del describe 'splitBill'

//   describe('findAll', () => {
//     it('debería retornar todas las facturas de un establecimiento', async () => {
//       const mockFacturas: FacturaEntity[] = [
//         {
//             id: uuidv4(),
//             establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//             total_factura: 100,
//             tipo_factura: TipoFactura.TOTAL,
//             fecha_hora_factura: new Date(),
//             subtotal: 0,
//             impuestos: 0,
//             descuentos: 0,
//             propina: 0,
//             usuario_cajero_id: MOCK_USUARIO_CAJERO_ID,
//             establecimiento: mockEstablecimiento,
//             facturaPedidos: [],
//             notas: '',
//             created_at: new Date(),
//             updated_at: new Date(),
//             usuarioCajero: mockUsuarioCajero,
//             cierreCaja: mockCierreCaja,
//             pagos: [], // ¡Añadir la propiedad 'pagos'!
//         },
//         {
//             id: uuidv4(),
//             establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//             total_factura: 200,
//             tipo_factura: TipoFactura.PARCIAL,
//             fecha_hora_factura: new Date(),
//             subtotal: 0,
//             impuestos: 0,
//             descuentos: 0,
//             propina: 0,
//             usuario_cajero_id: MOCK_USUARIO_CAJERO_ID,
//             establecimiento: mockEstablecimiento,
//             facturaPedidos: [],
//             notas: '',
//             created_at: new Date(),
//             updated_at: new Date(),
//             usuarioCajero: mockUsuarioCajero,
//             cierreCaja: mockCierreCaja,
//             pagos: [], // ¡Añadir la propiedad 'pagos'!
//         },
//       ];
//       jest.spyOn(facturaRepository, 'find').mockResolvedValue(mockFacturas);

//       const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID);

//       expect(facturaRepository.find).toHaveBeenCalledWith({
//         where: { establecimiento_id: MOCK_ESTABLECIMIENTO_ID },
//         relations: ['establecimiento', 'usuarioCajero', 'facturaPedidos', 'facturaPedidos.pedido', 'pagos', 'pagos.cliente'], // Añadir 'pagos' y 'pagos.cliente'
//         order: { fecha_hora_factura: 'DESC' },
//       });
//       expect(result).toEqual(mockFacturas);
//     });

//     it('debería filtrar facturas por tipo de factura', async () => {
//       const mockFacturas: FacturaEntity[] = [
//         {
//             id: uuidv4(),
//             establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//             total_factura: 100,
//             tipo_factura: TipoFactura.TOTAL,
//             fecha_hora_factura: new Date(),
//             subtotal: 0,
//             impuestos: 0,
//             descuentos: 0,
//             propina: 0,
//             usuario_cajero_id: MOCK_USUARIO_CAJERO_ID,
//             establecimiento: mockEstablecimiento,
//             facturaPedidos: [],
//             notas: '',
//             created_at: new Date(),
//             updated_at: new Date(),
//             usuarioCajero: mockUsuarioCajero,
//             cierreCaja: mockCierreCaja,
//             pagos: [], // ¡Añadir la propiedad 'pagos'!
//         },
//       ];
//       jest.spyOn(facturaRepository, 'find').mockResolvedValue(mockFacturas);

//       const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID, TipoFactura.TOTAL);

//       expect(facturaRepository.find).toHaveBeenCalledWith(expect.objectContaining({
//         where: { establecimiento_id: MOCK_ESTABLECIMIENTO_ID, tipo_factura: TipoFactura.TOTAL },
//       }));
//       expect(result).toEqual(mockFacturas);
//     });

//     it('debería filtrar facturas por rango de fechas', async () => {
//       const fechaInicio = new Date('2025-07-01T00:00:00.000Z');
//       const fechaFin = new Date('2025-07-31T23:59:59.999Z');
//       jest.spyOn(facturaRepository, 'find').mockResolvedValue([]);

//       await service.findAll(MOCK_ESTABLECIMIENTO_ID, undefined, undefined, fechaInicio, fechaFin);

//       expect(facturaRepository.find).toHaveBeenCalledWith(expect.objectContaining({
//         where: {
//           establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//           fecha_hora_factura: { gte: fechaInicio, lte: fechaFin },
//         },
//       }));
//     });
//   });

//   describe('findOne', () => {
//     it('debería encontrar una factura por ID', async () => {
//       const mockFactura: FacturaEntity = {
//         id: MOCK_FACTURA_ID,
//         establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//         total_factura: 100,
//         tipo_factura: TipoFactura.TOTAL,
//         fecha_hora_factura: new Date(),
//         subtotal: 0,
//         impuestos: 0,
//         descuentos: 0,
//         propina: 0,
//         usuario_cajero_id: MOCK_USUARIO_CAJERO_ID,
//         establecimiento: mockEstablecimiento,
//         facturaPedidos: [],
//         notas: '',
//         created_at: new Date(),
//         updated_at: new Date(),
//         usuarioCajero: mockUsuarioCajero,
//         cierreCaja: mockCierreCaja,
//         pagos: [], // ¡Añadir la propiedad 'pagos'!
//       };
//       jest.spyOn(facturaRepository, 'findOne').mockResolvedValue(mockFactura);

//       const result = await service.findOne(MOCK_FACTURA_ID, MOCK_ESTABLECIMIENTO_ID);

//       expect(facturaRepository.findOne).toHaveBeenCalledWith({
//         where: { id: MOCK_FACTURA_ID, establecimiento_id: MOCK_ESTABLECIMIENTO_ID },
//         relations: ['establecimiento', 'usuarioCajero', 'facturaPedidos', 'facturaPedidos.pedido', 'facturaPedidos.pedido.pedidoItems', 'facturaPedidos.pedido.pedidoItems.producto', 'pagos', 'pagos.cliente'], // Añadir 'pagos' y 'pagos.cliente'
//       });
//       expect(result).toEqual(mockFactura);
//     });

//     it('debería lanzar NotFoundException si la factura no se encuentra', async () => {
//       jest.spyOn(service, 'findOne').mockResolvedValue(null); // Asegurarse de que el mock de findOne del servicio retorne null
//       await expect(service.findOne('non-existent-id', MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(NotFoundException);
//     });
//   });

//   describe('update', () => {
//     let existingFactura: FacturaEntity;

//     beforeEach(() => {
//       existingFactura = {
//         id: MOCK_FACTURA_ID,
//         establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//         subtotal: 100.00,
//         impuestos: 10.00,
//         descuentos: 5.00,
//         propina: 0.00,
//         total_factura: 105.00,
//         tipo_factura: TipoFactura.TOTAL,
//         fecha_hora_factura: new Date(),
//         usuario_cajero_id: MOCK_USUARIO_CAJERO_ID,
//         notas: 'Notas originales',
//         establecimiento: mockEstablecimiento,
//         facturaPedidos: [],
//         created_at: new Date(),
//         updated_at: new Date(),
//         usuarioCajero: mockUsuarioCajero,
//         cierreCaja: mockCierreCaja,
//         pagos: [], // ¡Añadir la propiedad 'pagos'!
//       };
//       jest.spyOn(service, 'findOne').mockResolvedValue(existingFactura);
//       jest.spyOn(facturaRepository, 'save').mockResolvedValue(existingFactura);
//     });

//     it('debería actualizar solo las notas de una factura', async () => {
//       const updateDto = { notas: 'Nuevas notas' };
//       const result = await service.update(MOCK_FACTURA_ID, updateDto, MOCK_ESTABLECIMIENTO_ID);

//       expect(service.findOne).toHaveBeenCalledWith(MOCK_FACTURA_ID, MOCK_ESTABLECIMIENTO_ID);
//       expect(facturaRepository.save).toHaveBeenCalledWith(expect.objectContaining({
//         id: MOCK_FACTURA_ID,
//         notas: 'Nuevas notas',
//         subtotal: 100.00,
//         total_factura: 105.00,
//       }));
//       expect(result.notas).toBe('Nuevas notas');
//       expect(result.total_factura).toBe(105.00);
//     });

//     it('debería recalcular total_factura si se actualizan campos numéricos y total_factura no se proporciona', async () => {
//       const updateDto = { subtotal: 120.00, impuestos: 12.00 };
//       const expectedNewTotal = 120 + 12 - 5 + 0;

//       const result = await service.update(MOCK_FACTURA_ID, updateDto, MOCK_ESTABLECIMIENTO_ID);

//       expect(facturaRepository.save).toHaveBeenCalledWith(expect.objectContaining({
//         id: MOCK_FACTURA_ID,
//         subtotal: 120.00,
//         impuestos: 12.00,
//         total_factura: expectedNewTotal,
//       }));
//       expect(result.total_factura).toBeCloseTo(expectedNewTotal);
//     });

//     it('debería lanzar BadRequestException si total_factura proporcionado no coincide con el cálculo', async () => {
//       const updateDto = { subtotal: 120.00, total_factura: 100.00 };

//       await expect(service.update(MOCK_FACTURA_ID, updateDto, MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(BadRequestException);
//       expect(facturaRepository.save).not.toHaveBeenCalled();
//     });

//     it('debería lanzar NotFoundException si la factura a actualizar no existe', async () => {
//       jest.spyOn(service, 'findOne').mockRejectedValueOnce(new NotFoundException(`Factura con ID "non-existent-id" no encontrada.`));
//       const updateDto = { notas: 'Algunas notas' };
//       await expect(service.update('non-existent-id', updateDto, MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(NotFoundException);
//       expect(facturaRepository.save).not.toHaveBeenCalled();
//     });
//   });

//   describe('remove', () => {
//     it('debería eliminar una factura existente', async () => {
//       jest.spyOn(service, 'findOne').mockResolvedValue({
//         id: MOCK_FACTURA_ID,
//         establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
//         total_factura: 0,
//         tipo_factura: TipoFactura.TOTAL,
//         fecha_hora_factura: new Date(),
//         subtotal: 0,
//         impuestos: 0,
//         descuentos: 0,
//         propina: 0,
//         usuario_cajero_id: MOCK_USUARIO_CAJERO_ID,
//         establecimiento: mockEstablecimiento,
//         facturaPedidos: [],
//         notas: '',
//         created_at: new Date(),
//         updated_at: new Date(),
//         usuarioCajero: mockUsuarioCajero,
//         cierreCaja: mockCierreCaja,
//         pagos: [], // ¡Añadir la propiedad 'pagos'!
//       } as FacturaEntity);

//       const result = await service.remove(MOCK_FACTURA_ID, MOCK_ESTABLECIMIENTO_ID);

//       expect(service.findOne).toHaveBeenCalledWith(MOCK_FACTURA_ID, MOCK_ESTABLECIMIENTO_ID);
//       expect(facturaRepository.delete).toHaveBeenCalledWith(MOCK_FACTURA_ID);
//       expect(result.affected).toBe(1);
//     });

//     it('debería lanzar NotFoundException si la factura a eliminar no existe', async () => {
//       jest.spyOn(service, 'findOne').mockRejectedValueOnce(new NotFoundException(`Factura con ID "non-existent-id" no encontrada para eliminar.`));

//       await expect(service.remove('non-existent-id', MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(NotFoundException);
//       expect(facturaRepository.delete).not.toHaveBeenCalled();
//     });
//   });
// });
