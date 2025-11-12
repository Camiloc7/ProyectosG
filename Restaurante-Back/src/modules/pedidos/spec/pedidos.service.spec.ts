import { Test, TestingModule } from '@nestjs/testing';
import { PedidosService } from '../pedidos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PedidoEntity, EstadoPedido, TipoPedido } from '../entities/pedido.entity';
import { PedidoItemEntity, EstadoCocina } from '../entities/pedido-item.entity';
import { Repository, DataSource, QueryRunner, UpdateResult, DeleteResult } from 'typeorm';
import { EstablecimientosService } from '../../establecimientos/establecimientos.service';
import { MesasService } from '../../mesas/mesas.service';
import { ProductosService } from '../../productos/productos.service';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { WebSocketEventsService } from '../../../websocket/services/websocket-events.service';
import { RolesService } from '../../roles/roles.service';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { CreatePedidoItemDto } from '../dto/create-pedido-item.dto';
import { NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UpdatePedidoDto } from '../dto/update-pedido.dto';
import { UpdatePedidoItemDto } from '../dto/update-pedido-item.dto';
import { RoleName } from '../../../../src/common/constants/app.constants';
import { MesaEntity, EstadoMesa } from '../../mesas/entities/mesa.entity';
import { Not, In } from 'typeorm';
import { EstablecimientoConfiguracionPedidoService } from '../../establecimientos/configuracion-pedidos.service';
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-item-123'),
}));
describe('PedidosService (Unitarios)', () => {
  let service: PedidosService;
  let pedidoRepository: Repository<PedidoEntity>;
  let pedidoItemRepository: Repository<PedidoItemEntity>;
  let establecimientosService: EstablecimientosService;
  let mesasService: MesasService;
  let productosService: ProductosService;
  let usuariosService: UsuariosService;
  let websocketEventsService: WebSocketEventsService;
  let rolesService: RolesService;
  let establecimientoConfiguracionPedidoService: EstablecimientoConfiguracionPedidoService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  const MOCK_ESTABLECIMIENTO_ID = 'establecimiento-uuid';
  const MOCK_USUARIO_CREADOR_ID = 'usuario-creador-uuid';
  const MOCK_USUARIO_ACTUANTE_ID = 'usuario-actuante-uuid';
  const MOCK_PRODUCTO_ID_PIZZA = 'producto-pizza-uuid';
  const MOCK_PRODUCTO_ID_COCA = 'producto-coca-uuid';
  const MOCK_PRODUCTO_ID_PAPAS = 'producto-papas-uuid';
  const MOCK_PRODUCTO_ID_BEBIDA = 'producto-bebida-uuid';
  const MOCK_CATEGORIA_BEBIDA_ID = 'categoria-bebida-uuid';
  const MOCK_CATEGORIA_COMIDA_ID = 'categoria-comida-uuid';
  const MOCK_MESA_ID = 'mesa-uuid';
  const MOCK_MESA_ID_2 = 'mesa-uuid-2';
  const MOCK_PEDIDO_ID = 'pedido-uuid';
  const MOCK_ADMIN_ROLE = { id: 'admin-role-id', nombre: RoleName.ADMIN } as any;
  const MOCK_MESERO_ROLE = { id: 'mesero-role-id', nombre: RoleName.MESERO } as any;
  const MOCK_COCINERO_ROLE = {id: 'cocinero-role-id',nombre: 'COCINERO',created_at: new Date(), updated_at: new Date(),} as any; 
   const MOCK_CAJERO_ROLE = { id: 'cajero-role-id', nombre: RoleName.CAJERO } as any;
  const MOCK_DOMICILIARIO_ROLE = { id: 'domiciliario-role-id', nombre: RoleName.DOMICILIARIO } as any;
  const MOCK_SUPERVISOR_ROLE = { id: 'supervisor-role-id', nombre: RoleName.SUPERVISOR } as any;
  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
        find: jest.fn(),
      },
    } as unknown as QueryRunner;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidosService,
        {
          provide: getRepositoryToken(PedidoEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(), 
          }
        },
        {
          provide: getRepositoryToken(PedidoItemEntity), useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
          }
        },
        {
          provide: getRepositoryToken(PedidoItemEntity), useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            delete: jest.fn(),
            find: jest.fn(),
          }
        },
        { provide: EstablecimientosService, useValue: { findOne: jest.fn() } },
        { provide: MesasService, useValue: { findOne: jest.fn(), updateEstadoMesa: jest.fn() } },
        { provide: ProductosService, useValue: { findOne: jest.fn(), consumeProductIngredients: jest.fn() } },
        { provide: UsuariosService, useValue: { findOne: jest.fn() } },
        {
          provide: WebSocketEventsService, useValue: {
            emitPedidoCreated: jest.fn(),
            emitPedidoStatusUpdated: jest.fn(),
            emitPedidoItemUpdated: jest.fn(),
            emitPedidoUpdated: jest.fn(),
            emitPedidoItemRemoved: jest.fn(),
            emitPedidoRemoved: jest.fn(),
            emitPedidoTableTransferred: jest.fn(),
            emitPedidoItemCreated: jest.fn(),
            emitMesaStatusUpdated: jest.fn(),
          }
        },
        { provide: RolesService, useValue: { findOne: jest.fn(), findOneByName: jest.fn() } },
        { provide: EstablecimientoConfiguracionPedidoService, useValue: { findOneByEstablecimientoId: jest.fn() } },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => queryRunner),
          },
        },
      ],
    }).compile();
    service = module.get<PedidosService>(PedidosService);
    pedidoRepository = module.get<Repository<PedidoEntity>>(getRepositoryToken(PedidoEntity));
    pedidoItemRepository = module.get<Repository<PedidoItemEntity>>(getRepositoryToken(PedidoItemEntity));
    establecimientosService = module.get<EstablecimientosService>(EstablecimientosService);
    mesasService = module.get<MesasService>(MesasService);
    productosService = module.get<ProductosService>(ProductosService);
    usuariosService = module.get<UsuariosService>(UsuariosService);
    websocketEventsService = module.get<WebSocketEventsService>(WebSocketEventsService);
    rolesService = module.get<RolesService>(RolesService);
    establecimientoConfiguracionPedidoService = module.get<EstablecimientoConfiguracionPedidoService>(EstablecimientoConfiguracionPedidoService);
    dataSource = module.get<DataSource>(DataSource);
    jest.clearAllMocks();
    jest.spyOn(establecimientosService, 'findOne').mockResolvedValue({ id: MOCK_ESTABLECIMIENTO_ID, nombre: 'Restaurante Prueba' } as any);
    jest.spyOn(usuariosService, 'findOne').mockImplementation((id: string) => {
      if (id === MOCK_USUARIO_CREADOR_ID) {
        return Promise.resolve({ id: MOCK_USUARIO_CREADOR_ID, nombre: 'Usuario Creador', rol_id: MOCK_MESERO_ROLE.id } as any);
      }if (id === MOCK_USUARIO_ACTUANTE_ID) {
        return Promise.resolve({ id: MOCK_USUARIO_ACTUANTE_ID, nombre: 'Usuario Actuante', rol_id: MOCK_ADMIN_ROLE.id } as any);
      }if (id === 'usuario-cajero-id') {
        return Promise.resolve({ id: 'usuario-cajero-id', nombre: 'Usuario Cajero', rol_id: MOCK_CAJERO_ROLE.id } as any);
      }if (id === 'usuario-cocinero-id') {
        return Promise.resolve({ id: 'usuario-cocinero-id', nombre: 'Usuario Cocinero', rol_id: MOCK_COCINERO_ROLE.id } as any);
      }if (id === 'usuario-domiciliario-id') {
        return Promise.resolve({ id: 'usuario-domiciliario-id', nombre: 'Usuario Domiciliario', rol_id: MOCK_DOMICILIARIO_ROLE.id } as any);
      }if (id === 'usuario-supervisor-id') {
        return Promise.resolve({ id: 'usuario-supervisor-id', nombre: 'Usuario Supervisor', rol_id: MOCK_SUPERVISOR_ROLE.id } as any);
      }return Promise.resolve(null);
    });
    jest.spyOn(rolesService, 'findOne').mockImplementation((id: string) => {
      if (id === MOCK_ADMIN_ROLE.id) return Promise.resolve(MOCK_ADMIN_ROLE);
      if (id === MOCK_MESERO_ROLE.id) return Promise.resolve(MOCK_MESERO_ROLE);
      if (id === MOCK_COCINERO_ROLE.id) return Promise.resolve(MOCK_COCINERO_ROLE);
      if (id === MOCK_CAJERO_ROLE.id) return Promise.resolve(MOCK_CAJERO_ROLE);
      if (id === MOCK_DOMICILIARIO_ROLE.id) return Promise.resolve(MOCK_DOMICILIARIO_ROLE);
      if (id === MOCK_SUPERVISOR_ROLE.id) return Promise.resolve(MOCK_SUPERVISOR_ROLE);
      return Promise.resolve(null);
    });
    jest.spyOn(rolesService, 'findOneByName').mockImplementation((name: RoleName) => {
      if (name === RoleName.ADMIN) return Promise.resolve(MOCK_ADMIN_ROLE);
      if (name === RoleName.MESERO) return Promise.resolve(MOCK_MESERO_ROLE);
      if (name === RoleName.COCINERO) return Promise.resolve(MOCK_COCINERO_ROLE);
      if (name === RoleName.CAJERO) return Promise.resolve(MOCK_CAJERO_ROLE);
      if (name === RoleName.DOMICILIARIO) return Promise.resolve(MOCK_DOMICILIARIO_ROLE);
      if (name === RoleName.SUPERVISOR) return Promise.resolve(MOCK_SUPERVISOR_ROLE);
      return Promise.resolve(null);
    });
    jest.spyOn(pedidoRepository, 'create').mockImplementation((entity: any) => entity);
    jest.spyOn(pedidoItemRepository, 'create').mockImplementation((entity: any) => entity);
    let savedPedidoId: string;
    jest.spyOn(queryRunner.manager, 'save')
      .mockImplementation((entity: any) => {
        if (entity instanceof PedidoEntity) {
          savedPedidoId = entity.id || MOCK_PEDIDO_ID;
          return Promise.resolve(entity);
        }
        if (Array.isArray(entity) && entity[0] instanceof PedidoItemEntity) {
          const itemsWithPedidoId = entity.map(item => ({
            ...item,
            pedido_id: savedPedidoId
          }));
          return Promise.resolve(itemsWithPedidoId);
        }
        return Promise.resolve(entity);
      });
    jest.spyOn(queryRunner.manager, 'update').mockResolvedValue({ affected: 1, raw: [] } as UpdateResult);
    jest.spyOn(queryRunner.manager, 'delete').mockResolvedValue({ affected: 1, raw: [] } as DeleteResult);
    jest.spyOn(establecimientoConfiguracionPedidoService, 'findOneByEstablecimientoId').mockResolvedValue({
      establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
      limite_cancelacion_preparacion_minutos: 10,
      limite_cancelacion_enviado_cocina_minutos: 5,
      limite_edicion_pedido_minutos: 15,
    } as any);
  });
  it('debería ser definido', () => {
    expect(service).toBeDefined();
  });
  it('no debería crear un pedido sin ítems y lanzar BadRequestException', async () => {
    const createPedidoDto: CreatePedidoDto = {
      mesa_id: MOCK_MESA_ID,
      tipo_pedido: TipoPedido.MESA,
      pedidoItems: [],
    };
    jest.spyOn(mesasService, 'findOne').mockResolvedValue({ id: MOCK_MESA_ID, estado: EstadoMesa.LIBRE } as any);
    await expect(service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(
      'El pedido debe contener al menos un ítem',
    );
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    expect(queryRunner.manager.save).not.toHaveBeenCalled();
  });
  it('debería lanzar NotFoundException si el establecimientoId del parámetro no existe', async () => {
    const createPedidoDto: CreatePedidoDto = {
      mesa_id: MOCK_MESA_ID,
      tipo_pedido: TipoPedido.MESA,
      pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
    };
    jest.spyOn(establecimientosService, 'findOne').mockRejectedValue(new NotFoundException('Establecimiento no encontrado.'));
    await expect(service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, 'non-existent-establecimiento-id')).rejects.toThrow(
      NotFoundException,
    );
    expect(establecimientosService.findOne).toHaveBeenCalledWith('non-existent-establecimiento-id');
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    expect(queryRunner.manager.save).not.toHaveBeenCalled();
  });
  it('no debería crear un pedido con cantidad de ítem inválida (<1) y lanzar BadRequestException', async () => {
    const createPedidoDto: CreatePedidoDto = {
      mesa_id: MOCK_MESA_ID,
      tipo_pedido: TipoPedido.MESA,
      pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 0, notas_item: 'cantidad cero' }],
    };
    const mockProducto = { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Coca Cola', precio: 2.50, activo: true } as any;
    jest.spyOn(productosService, 'findOne').mockResolvedValue(mockProducto);
    jest.spyOn(mesasService, 'findOne').mockResolvedValue({ id: MOCK_MESA_ID, estado: EstadoMesa.LIBRE } as any);
    await expect(service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(
      'La cantidad mínima para un ítem de pedido es 1.',
    );
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    expect(queryRunner.manager.save).not.toHaveBeenCalled();
  });
  it('no debería crear un pedido de MESA si la mesa está OCUPADA', async () => {
    const createPedidoDto: CreatePedidoDto = {
      mesa_id: MOCK_MESA_ID,
      tipo_pedido: TipoPedido.MESA,
      pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
    };
    const mockMesaOcupada = { id: MOCK_MESA_ID, numero: 5, estado: EstadoMesa.OCUPADA } as any;
    jest.spyOn(mesasService, 'findOne').mockResolvedValue(mockMesaOcupada);
    await expect(service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(
      ConflictException,
    );
    expect(mesasService.findOne).toHaveBeenCalledWith(MOCK_MESA_ID, MOCK_ESTABLECIMIENTO_ID);
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    expect(queryRunner.manager.save).not.toHaveBeenCalled();
  });
  it('no debería crear un pedido si un producto no está ACTIVO', async () => {
    const createPedidoDto: CreatePedidoDto = {
      mesa_id: MOCK_MESA_ID,
      tipo_pedido: TipoPedido.MESA,
      pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
    };
    const mockProductoInactivo = { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', precio: 10.00, activo: false } as any;
    const mockMesa = { id: MOCK_MESA_ID, numero: 5, estado: EstadoMesa.LIBRE } as any;
    jest.spyOn(mesasService, 'findOne').mockResolvedValue(mockMesa);
    jest.spyOn(productosService, 'findOne').mockResolvedValue(mockProductoInactivo);
    await expect(service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(
      BadRequestException,
    );
    expect(productosService.findOne).toHaveBeenCalledWith(MOCK_PRODUCTO_ID_PIZZA, MOCK_ESTABLECIMIENTO_ID);
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    expect(queryRunner.manager.save).not.toHaveBeenCalled();
  });
  it('debería crear un pedido tipo DOMICILIO con datos de cliente', async () => {
    const createPedidoDto: CreatePedidoDto = {
      tipo_pedido: TipoPedido.DOMICILIO,
      cliente_nombre: 'Juan Perez',
      cliente_telefono: '123456789',
      cliente_direccion: 'Calle Falsa 123',
      pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
    };
    const mockProducto = { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Hamburguesa', precio: 15.00, activo: true } as any;
    const expectedPedido = {
      id: MOCK_PEDIDO_ID,
      establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
      mesa_id: null,
      usuario_creador_id: MOCK_USUARIO_CREADOR_ID,
      tipo_pedido: TipoPedido.DOMICILIO,
      total_estimado: 15.00,
      cliente_nombre: 'Juan Perez',
      cliente_telefono: '123456789',
      cliente_direccion: 'Calle Falsa 123',
      estado: EstadoPedido.ABIERTO,
      usuario_domiciliario_id: null,
      usuario_cancelador_id: null,
      descuentos_aplicados: 0.00,
      notas: null,
      fecha_hora_pedido: expect.any(Date),
      fecha_hora_cierre: null,
      fecha_cancelacion: null,
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
      fecha_ultima_actualizacion_relevante_cocina: expect.any(Date),
      establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any,
      mesa: null,
      usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any,
      usuarioDomiciliario: null as any,
      usuarioCancelador: null as any,
      pedidoItems: [],
    } as PedidoEntity;
    jest.spyOn(productosService, 'findOne').mockResolvedValue(mockProducto);
    jest.spyOn(service, 'findOne').mockResolvedValue(expectedPedido);
    const result = await service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID);
    expect(result).toEqual(expectedPedido);
    expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({ tipo_pedido: TipoPedido.DOMICILIO, cliente_nombre: 'Juan Perez' }));
    expect(mesasService.findOne).not.toHaveBeenCalled();
  });
  it('no debería crear un pedido DOMICILIO sin nombre de cliente', async () => {
    const createPedidoDto: CreatePedidoDto = {
      tipo_pedido: TipoPedido.DOMICILIO,
      cliente_telefono: '123456789',
      cliente_direccion: 'Calle Falsa 123',
      pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
    };
    jest.spyOn(productosService, 'findOne').mockResolvedValue({ id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', precio: 10.00, activo: true } as any);
    await expect(service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(
      new BadRequestException('Para pedidos a domicilio, el nombre del cliente es obligatorio.'),
    );
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    expect(queryRunner.manager.save).not.toHaveBeenCalled();
  });
  it('debería reintentar la transacción en caso de ER_LOCK_WAIT_TIMEOUT', async () => {
    const createPedidoDto: CreatePedidoDto = {
      mesa_id: MOCK_MESA_ID,
      tipo_pedido: TipoPedido.MESA,
      pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
    };
    const mockMesa = { id: MOCK_MESA_ID, numero: 5, estado: EstadoMesa.LIBRE } as any;
    const mockProducto = { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', precio: 10.00, activo: true } as any;
    jest.spyOn(mesasService, 'findOne').mockResolvedValue(mockMesa);
    jest.spyOn(productosService, 'findOne').mockResolvedValue(mockProducto);
    jest.spyOn(queryRunner.manager, 'save')
      .mockRejectedValueOnce({ code: 'ER_LOCK_WAIT_TIMEOUT' })
      .mockRejectedValueOnce({ code: 'ER_LOCK_WAIT_TIMEOUT' })
      .mockImplementation((entity: any) => {
        if (entity instanceof PedidoEntity) {
          return Promise.resolve({ id: 'pedido-uuid-retry', total_estimado: 10.00 } as PedidoEntity);
        }
        if (Array.isArray(entity) && entity[0] instanceof PedidoItemEntity) {
          return Promise.resolve(entity);
        }
        return Promise.resolve(entity);
      });
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'pedido-uuid-retry', total_estimado: 10.00 } as PedidoEntity);
    const result = await service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID);
    expect(result.id).toBe('pedido-uuid-retry');
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(3);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(2);
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
  });
  it('calcularTotalEstimado debería calcular el total correctamente a partir de DTOs', async () => {
    const items: CreatePedidoItemDto[] = [
      { producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 2, notas_item: 'sin sal' },
      { producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, notas_item: 'extra queso' },
    ];
    jest.spyOn(productosService, 'findOne')
      .mockResolvedValueOnce({ id: MOCK_PRODUCTO_ID_PIZZA, precio: 5.00 } as any)
      .mockResolvedValueOnce({ id: MOCK_PRODUCTO_ID_COCA, precio: 12.50 } as any);
    const total = await (service as any).calcularTotalEstimado(items, MOCK_ESTABLECIMIENTO_ID);
    expect(total).toBe(5.00 * 2 + 12.50 * 1);
    expect(productosService.findOne).toHaveBeenCalledTimes(2);
  });
  it('calcularTotalEstimado debería calcular el total correctamente a partir de entidades PedidoItemEntity', async () => {
    const items: PedidoItemEntity[] = [
      { id: 'item-1', pedido_id: MOCK_PEDIDO_ID, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 3, precio_unitario_al_momento_venta: 7.00 } as PedidoItemEntity,
      { id: 'item-2', pedido_id: MOCK_PEDIDO_ID, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, precio_unitario_al_momento_venta: 20.00 } as PedidoItemEntity,
    ];
    jest.spyOn(productosService, 'findOne');
    const total = await (service as any).calcularTotalEstimado(items, MOCK_ESTABLECIMIENTO_ID);
    expect(total).toBe(7.00 * 3 + 20.00 * 1);
    expect(productosService.findOne).not.toHaveBeenCalled();
  });
  describe('create (establecimiento_id desde JWT)', () => {
    const mockProducto = { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', precio: 10.00, activo: true } as any;
    let expectedPedido: PedidoEntity;
    beforeEach(() => {
      jest.spyOn(productosService, 'findOne').mockResolvedValue(mockProducto);
      jest.spyOn(mesasService, 'findOne').mockResolvedValue({ id: MOCK_MESA_ID, estado: EstadoMesa.LIBRE } as any);
      expectedPedido = {
        id: MOCK_PEDIDO_ID,
        establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
        mesa_id: MOCK_MESA_ID,
        usuario_creador_id: MOCK_USUARIO_CREADOR_ID,
        tipo_pedido: TipoPedido.MESA,
        total_estimado: 10.00,
        cliente_nombre: null,
        cliente_telefono: null,
        cliente_direccion: null,
        estado: EstadoPedido.ABIERTO,
        usuario_domiciliario_id: null,
        usuario_cancelador_id: null,
        descuentos_aplicados: 0.00,
        notas: null,
        fecha_hora_pedido: expect.any(Date),
        fecha_hora_cierre: null,
        fecha_cancelacion: null,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        fecha_ultima_actualizacion_relevante_cocina: expect.any(Date),
        establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any,
        mesa: { id: MOCK_MESA_ID } as any,
        usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any,
        usuarioDomiciliario: null as any,
        usuarioCancelador: null as any,
        pedidoItems: [],
      } as PedidoEntity;
      jest.spyOn(service, 'findOne').mockResolvedValue(expectedPedido);
    });
    it('debería crear un pedido usando el establecimiento_id del parámetro (JWT)', async () => {
      const createPedidoDto: CreatePedidoDto = {
        mesa_id: MOCK_MESA_ID,
        tipo_pedido: TipoPedido.MESA,
        pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
      };
      const result = await service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID);
      expect(result).toEqual(expectedPedido);
      expect(establecimientosService.findOne).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({ establecimiento_id: MOCK_ESTABLECIMIENTO_ID }));
    });

    it('debería lanzar NotFoundException si el establecimientoId del parámetro no existe', async () => {
      const createPedidoDto: CreatePedidoDto = {
        mesa_id: MOCK_MESA_ID,
        tipo_pedido: TipoPedido.MESA,
        pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
      };
      jest.spyOn(establecimientosService, 'findOne').mockRejectedValue(new NotFoundException('Establecimiento no encontrado.'));

      await expect(service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, 'non-existent-establecimiento-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(establecimientosService.findOne).toHaveBeenCalledWith('non-existent-establecimiento-id');
      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });
    it('debería crear un pedido tipo MESA correctamente', async () => {
      const createPedidoDto: CreatePedidoDto = {
        mesa_id: MOCK_MESA_ID,
        tipo_pedido: TipoPedido.MESA,
        pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
      };
      const mockMesa = { id: MOCK_MESA_ID, numero: 5, estado: EstadoMesa.LIBRE } as any;
      const mockProducto = { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', precio: 10.00, activo: true } as any;
      jest.spyOn(mesasService, 'findOne').mockResolvedValue(mockMesa);
      jest.spyOn(productosService, 'findOne').mockResolvedValue(mockProducto);
      jest.spyOn(queryRunner.manager, 'save')
        .mockResolvedValueOnce({ ...expectedPedido, id: MOCK_PEDIDO_ID }) 
        .mockResolvedValueOnce(expectedPedido.pedidoItems); 
      const result = await service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        mesa_id: MOCK_MESA_ID,
        tipo_pedido: TipoPedido.MESA,
        total_estimado: 10.00,
      }));
      expect(queryRunner.manager.update).toHaveBeenCalledWith(MesaEntity, MOCK_MESA_ID, { estado: EstadoMesa.OCUPADA });
      expect(websocketEventsService.emitPedidoCreated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID);
      expect(result.mesa_id).toBe(MOCK_MESA_ID);
      expect(result.tipo_pedido).toBe(TipoPedido.MESA);
    });
    it('debería crear un pedido tipo PARA_LLEVAR correctamente', async () => {
      const createPedidoDto: CreatePedidoDto = {
        tipo_pedido: TipoPedido.PARA_LLEVAR,
        pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
      };
      const mockProducto = { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', precio: 10.00, activo: true } as any;
      const expectedParaLlevarPedido = {
        ...expectedPedido,
        mesa_id: null,
        tipo_pedido: TipoPedido.PARA_LLEVAR,
        cliente_nombre: null,
        cliente_telefono: null,
        cliente_direccion: null,
      };
      jest.spyOn(productosService, 'findOne').mockResolvedValue(mockProducto);
      jest.spyOn(queryRunner.manager, 'save')
        .mockResolvedValueOnce({ ...expectedParaLlevarPedido, id: MOCK_PEDIDO_ID })
        .mockResolvedValueOnce(expectedParaLlevarPedido.pedidoItems);
      jest.spyOn(service, 'findOne').mockResolvedValue(expectedParaLlevarPedido);
      const result = await service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        mesa_id: null,
        tipo_pedido: TipoPedido.PARA_LLEVAR,
        cliente_nombre: null,
      }));
      expect(mesasService.findOne).not.toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoCreated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID);
      expect(result.tipo_pedido).toBe(TipoPedido.PARA_LLEVAR);
    });
    it('no debería crear un pedido DOMICILIO sin teléfono de cliente', async () => {
      const createPedidoDto: CreatePedidoDto = {
        tipo_pedido: TipoPedido.DOMICILIO,
        cliente_nombre: 'Juan Perez',
        cliente_direccion: 'Calle Falsa 123',
        pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
      };
      jest.spyOn(productosService, 'findOne').mockResolvedValue({ id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', precio: 10.00, activo: true } as any);
      await expect(service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(
        new BadRequestException('Para pedidos a domicilio, el teléfono del cliente es obligatorio.'),
      );
      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });
    it('no debería crear un pedido DOMICILIO sin dirección de cliente', async () => {
      const createPedidoDto: CreatePedidoDto = {
        tipo_pedido: TipoPedido.DOMICILIO,
        cliente_nombre: 'Juan Perez',
        cliente_telefono: '123456789',
        pedidoItems: [{ producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 }],
      };
      jest.spyOn(productosService, 'findOne').mockResolvedValue({ id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', precio: 10.00, activo: true } as any);
      await expect(service.create(createPedidoDto, MOCK_USUARIO_CREADOR_ID, MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(
        new BadRequestException('Para pedidos a domicilio, la dirección del cliente es obligatoria.'),
      );
      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });
  });
  describe('update (Editar Pedido)', () => {
    const MOCK_PEDIDO_ID_UPDATE = 'pedido-update-uuid';
    const MOCK_ITEM_ID_1 = 'item-update-1';
    const MOCK_ITEM_ID_2 = 'item-update-2';
    let mockExistingPedido: PedidoEntity;
    let mockProductPizza: any;
    let mockProductCoca: any;
    let mockProductPapas: any;
    beforeEach(() => {
      (uuidv4 as jest.Mock).mockClear();
      (uuidv4 as jest.Mock).mockReturnValue('mock-new-item-uuid');
      mockProductPizza = { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', precio: 10.00, activo: true } as any;
      mockProductCoca = { id: MOCK_PRODUCTO_ID_COCA, nombre: 'Coca Cola', precio: 5.00, activo: true } as any;
      mockProductPapas = { id: MOCK_PRODUCTO_ID_PAPAS, nombre: 'Papas Fritas', precio: 7.50, activo: true } as any;
      mockExistingPedido = {
        id: MOCK_PEDIDO_ID_UPDATE,
        establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
        mesa_id: MOCK_MESA_ID,
        usuario_creador_id: MOCK_USUARIO_CREADOR_ID,
        usuario_domiciliario_id: null,
        usuario_cancelador_id: null,
        estado: EstadoPedido.ABIERTO,
        tipo_pedido: TipoPedido.MESA,
        cliente_nombre: null,
        cliente_telefono: null,
        cliente_direccion: null,
        total_estimado: 15.00,
        descuentos_aplicados: 0.00,
        notas: null,
        fecha_hora_pedido: new Date(Date.now() - 60 * 1000),
        fecha_hora_cierre: null,
        fecha_cancelacion: null,
        created_at: new Date(Date.now() - 60 * 1000),
        updated_at: new Date(Date.now() - 60 * 1000),
        fecha_ultima_actualizacion_relevante_cocina: new Date(Date.now() - 60 * 1000),
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, precio_unitario_al_momento_venta: 10.00, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: new Date() } as PedidoItemEntity,
          { id: MOCK_ITEM_ID_2, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, precio_unitario_al_momento_venta: 5.00, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: new Date() } as PedidoItemEntity,
        ],
        establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any,
        mesa: { id: MOCK_MESA_ID, numero: 5, estado: EstadoMesa.OCUPADA } as any,
        usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any,
        usuarioDomiciliario: null as any,
        usuarioCancelador: null as any,
      } as PedidoEntity;
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockImplementation(async (entity: any, options: any) => {
          if (entity === PedidoEntity && options.where.id === MOCK_PEDIDO_ID_UPDATE) {
            return Promise.resolve(JSON.parse(JSON.stringify(mockExistingPedido)));
          }
          if (entity === PedidoItemEntity && options.where) {
            const foundItem = mockExistingPedido.pedidoItems.find(item =>
              (options.where.id && item.id === options.where.id) ||
              (options.where.producto_id && item.producto_id === options.where.producto_id)
            );
            return Promise.resolve(foundItem ? JSON.parse(JSON.stringify(foundItem)) : null);
          }
          if (entity === MesaEntity && options.where.id === MOCK_MESA_ID_2) {
            return Promise.resolve({ id: MOCK_MESA_ID_2, numero: 6, estado: EstadoMesa.LIBRE } as any);
          }
          if (entity === MesaEntity && options.where.id === MOCK_MESA_ID) {
            return Promise.resolve({ id: MOCK_MESA_ID, numero: 5, estado: EstadoMesa.OCUPADA } as any);
          }
          return Promise.resolve(null);
        });
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValue(mockExistingPedido.pedidoItems);
      jest.spyOn(productosService, 'findOne')
        .mockImplementation((id: string) => {
          if (id === MOCK_PRODUCTO_ID_PIZZA) return Promise.resolve(mockProductPizza);
          if (id === MOCK_PRODUCTO_ID_COCA) return Promise.resolve(mockProductCoca);
          if (id === MOCK_PRODUCTO_ID_PAPAS) return Promise.resolve(mockProductPapas);
          if (id === MOCK_PRODUCTO_ID_BEBIDA) return Promise.resolve({ id: MOCK_PRODUCTO_ID_BEBIDA, nombre: 'Refresco', precio: 3.00, activo: true, categoria: { id: MOCK_CATEGORIA_BEBIDA_ID, nombre: 'Bebidas', es_bebida: true } } as any);
          return Promise.resolve(null);
        });
      jest.spyOn(mesasService, 'findOne').mockImplementation((id: string) => {
        if (id === MOCK_MESA_ID_2) return Promise.resolve({ id: MOCK_MESA_ID_2, numero: 6, estado: EstadoMesa.LIBRE } as any);
        if (id === MOCK_MESA_ID) return Promise.resolve({ id: MOCK_MESA_ID, numero: 5, estado: EstadoMesa.OCUPADA } as any);
        return Promise.resolve(null);
      });
      jest.spyOn(service, 'findOne').mockImplementation(async (id: string, establecimientoId: string) => {
        if (id === MOCK_PEDIDO_ID_UPDATE) {
          return Promise.resolve(JSON.parse(JSON.stringify(mockExistingPedido)));
        }
        return Promise.resolve(null);
      });
    });
    it('debería añadir un nuevo ítem a un pedido existente', async () => {
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
          { id: MOCK_ITEM_ID_2, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1 },
          { producto_id: MOCK_PRODUCTO_ID_PAPAS, cantidad: 2 }
        ]
      };
      const expectedTotal = (1 * mockProductPizza.precio) + (1 * mockProductCoca.precio) + (2 * mockProductPapas.precio);
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce([
        ...mockExistingPedido.pedidoItems,
        { id: 'mock-new-item-uuid', pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PAPAS, cantidad: 2, precio_unitario_al_momento_venta: 7.50, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date) } as PedidoItemEntity,
      ]);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        total_estimado: expectedTotal,
        pedidoItems: [
          ...mockExistingPedido.pedidoItems,
          { id: 'mock-new-item-uuid', pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PAPAS, cantidad: 2, precio_unitario_al_momento_venta: 7.50, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date) } as PedidoItemEntity,
        ]
      });
      const result = await service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoItemEntity, expect.arrayContaining([
        expect.objectContaining({ id: 'mock-new-item-uuid', producto_id: MOCK_PRODUCTO_ID_PAPAS, cantidad: 2, estado_cocina: EstadoCocina.PENDIENTE }),
      ]));
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({ total_estimado: expectedTotal }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoItemCreated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_UPDATE, expect.objectContaining({ id: 'mock-new-item-uuid' }));
      expect(result.total_estimado).toBe(expectedTotal);
    });
    it('debería remover un ítem de un pedido existente', async () => {
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
        ]
      };
      const expectedTotal = (1 * mockProductPizza.precio);
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce([
        { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, precio_unitario_al_momento_venta: 10.00 } as PedidoItemEntity,
      ]);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        total_estimado: expectedTotal,
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date) } as PedidoItemEntity,
        ]
      });
      const result = await service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(PedidoItemEntity, [MOCK_ITEM_ID_2]);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({ total_estimado: expectedTotal }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoItemRemoved).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_UPDATE, MOCK_ITEM_ID_2);
      expect(result.total_estimado).toBe(expectedTotal);
    });
    it('no debería editar un pedido si ya está CERRADO y lanzar BadRequestException', async () => {
      const updatePedidoDto: UpdatePedidoDto = { pedidoItems: [{ id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 3 }] };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockExistingPedido)), estado: EstadoPedido.CERRADO });
      await expect(service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
      expect(queryRunner.manager.update).not.toHaveBeenCalled();
    });
    it('no debería editar un pedido si no se proveen cambios válidos en los ítems', async () => {
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [],
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockExistingPedido)), estado: EstadoPedido.ABIERTO });

      await expect(service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
      expect(queryRunner.manager.delete).not.toHaveBeenCalled();
    });
    it('no debería permitir modificar una bebida si su estado de cocina es CERRADO (LISTO) y lanzar BadRequestException', async () => {
      const mockItemBebidaCerrada: PedidoItemEntity = {
        id: 'item-bebida-cerrada',
        pedido_id: MOCK_PEDIDO_ID_UPDATE,
        producto_id: MOCK_PRODUCTO_ID_COCA,
        cantidad: 1,
        precio_unitario_al_momento_venta: 5.00,
        notas_item: null,
        estado_cocina: EstadoCocina.LISTO,
        fecha_hora_estado_cocina_cambio: new Date(Date.now() - 12 * 60 * 1000),
        producto: { id: MOCK_PRODUCTO_ID_COCA, nombre: 'Coca Cola', precio: 5.00, activo: true, categoria: { id: MOCK_CATEGORIA_BEBIDA_ID, nombre: 'Bebidas', es_bebida: true } as any } as any,
      } as PedidoItemEntity;
      const localMockExistingPedido = {
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        pedidoItems: [...mockExistingPedido.pedidoItems, mockItemBebidaCerrada],
        total_estimado: mockExistingPedido.total_estimado + 5.00
      };
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
          { id: MOCK_ITEM_ID_2, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1 },
          { id: 'item-bebida-cerrada', producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 2 }
        ]
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(localMockExistingPedido)), estado: EstadoPedido.ABIERTO });
      await expect(service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
    });
    it('no debería transferir un pedido a una mesa OCUPADA', async () => {
      const updatePedidoDto: UpdatePedidoDto = {
        mesa_id: MOCK_MESA_ID_2,
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
        ]
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockExistingPedido)), estado: EstadoPedido.ABIERTO, tipo_pedido: TipoPedido.MESA, mesa_id: MOCK_MESA_ID });
      jest.spyOn(mesasService, 'findOne').mockResolvedValueOnce({ id: MOCK_MESA_ID_2, numero: 6, estado: EstadoMesa.OCUPADA } as any);
      await expect(service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
    });

    it('no debería añadir un nuevo ítem si la cantidad es <= 0', async () => {
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
          { producto_id: MOCK_PRODUCTO_ID_PAPAS, cantidad: 0 }
        ]
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockExistingPedido)), estado: EstadoPedido.ABIERTO });
      await expect(service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalledWith(PedidoItemEntity, expect.objectContaining({ producto_id: MOCK_PRODUCTO_ID_PAPAS }));
    });
    it('debería eliminar un ítem existente si su cantidad se actualiza a 0 o menos', async () => {
      mockExistingPedido.pedidoItems = [
        { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, precio_unitario_al_momento_venta: 10.00, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: new Date() } as PedidoItemEntity,
        { id: MOCK_ITEM_ID_2, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, precio_unitario_al_momento_venta: 5.00, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: new Date() } as PedidoItemEntity,
        { id: 'item-to-delete', pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PAPAS, cantidad: 1, precio_unitario_al_momento_venta: 7.50, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: new Date() } as PedidoItemEntity,
      ];
      mockExistingPedido.total_estimado = 22.50;
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
          { id: MOCK_ITEM_ID_2, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1 },
          { id: 'item-to-delete', producto_id: MOCK_PRODUCTO_ID_PAPAS, cantidad: 0 },
        ]
      };
      const expectedTotal = (1 * mockProductPizza.precio) + (1 * mockProductCoca.precio);
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockExistingPedido)), estado: EstadoPedido.ABIERTO });
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce([
        { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, precio_unitario_al_momento_venta: 10.00 } as PedidoItemEntity,
        { id: MOCK_ITEM_ID_2, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, precio_unitario_al_momento_venta: 5.00 } as PedidoItemEntity,
      ]);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        total_estimado: expectedTotal,
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date), precio_unitario_al_momento_venta: 10.00 } as PedidoItemEntity,
          { id: MOCK_ITEM_ID_2, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date), precio_unitario_al_momento_venta: 5.00 } as PedidoItemEntity,
        ],
      });
      const result = await service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(PedidoItemEntity, ['item-to-delete']);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({ total_estimado: expectedTotal }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoItemRemoved).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_UPDATE, 'item-to-delete');
      expect(result.total_estimado).toBe(expectedTotal);
    });

    it('no debería eliminar el último ítem de un pedido si el DTO resulta en 0 ítems', async () => {
      const singleItemPedido: PedidoEntity = {
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        pedidoItems: [{ id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, precio_unitario_al_momento_venta: 10.00, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: new Date() } as PedidoItemEntity],
        total_estimado: 10.00,
      };
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [],
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...singleItemPedido, estado: EstadoPedido.ABIERTO });
      await expect(service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.delete).not.toHaveBeenCalled();
    });

    it('debería permitir la edición de un pedido ENVIADO_A_COCINA dentro del tiempo límite si el usuario no es Admin/Supervisor', async () => {
      const now = new Date();
      const threeMinutesAgo = new Date(now.getTime() - (3 * 60 * 1000));
      mockExistingPedido.estado = EstadoPedido.ENVIADO_A_COCINA;
      mockExistingPedido.fecha_ultima_actualizacion_relevante_cocina = threeMinutesAgo;
      mockExistingPedido.pedidoItems[0].estado_cocina = EstadoCocina.EN_PREPARACION; 
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 2 }, 
          { id: MOCK_ITEM_ID_2, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1 },
        ]
      };
      const expectedTotal = (2 * mockProductPizza.precio) + (1 * mockProductCoca.precio);
      jest.spyOn(usuariosService, 'findOne').mockResolvedValueOnce({ id: MOCK_USUARIO_ACTUANTE_ID, nombre: 'Usuario Mesero', rol_id: MOCK_MESERO_ROLE.id } as any);
      jest.spyOn(rolesService, 'findOne').mockResolvedValueOnce(MOCK_MESERO_ROLE);
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockExistingPedido)) }); 
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce([
        { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 2, precio_unitario_al_momento_venta: 10.00 } as PedidoItemEntity,
        { id: MOCK_ITEM_ID_2, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, precio_unitario_al_momento_venta: 5.00 } as PedidoItemEntity,
      ]);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        total_estimado: expectedTotal,
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 2, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date), precio_unitario_al_momento_venta: 10.00 } as PedidoItemEntity,
          { id: MOCK_ITEM_ID_2, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date), precio_unitario_al_momento_venta: 5.00 } as PedidoItemEntity,
        ]
      });
      const result = await service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoItemEntity, expect.arrayContaining([
        expect.objectContaining({ id: MOCK_ITEM_ID_1, cantidad: 2 }),
      ]));
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({ total_estimado: expectedTotal }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_UPDATE, expect.any(Function));
      expect(result.total_estimado).toBe(expectedTotal);
    });
    it('debería denegar la edición de un pedido ENVIADO_A_COCINA fuera del tiempo límite si el usuario no es Admin/Supervisor', async () => {
      const now = new Date();
      const twentyMinutesAgo = new Date(now.getTime() - (20 * 60 * 1000)); 
      mockExistingPedido.estado = EstadoPedido.ENVIADO_A_COCINA;
      mockExistingPedido.fecha_ultima_actualizacion_relevante_cocina = twentyMinutesAgo;
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 2 },
        ]
      };
      jest.spyOn(usuariosService, 'findOne').mockResolvedValueOnce({ id: MOCK_USUARIO_ACTUANTE_ID, nombre: 'Usuario Mesero', rol_id: MOCK_MESERO_ROLE.id } as any);
      jest.spyOn(rolesService, 'findOne').mockResolvedValueOnce(MOCK_MESERO_ROLE);
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockExistingPedido)) });
      await expect(service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
      expect(queryRunner.manager.update).not.toHaveBeenCalled();
    });
    it('no debería permitir cambiar la cantidad de una bebida en estado LISTO y lanzar BadRequestException', async () => {
      const mockItemBebidaLista: PedidoItemEntity = {
        id: 'item-bebida-lista',
        pedido_id: MOCK_PEDIDO_ID_UPDATE,
        producto_id: MOCK_PRODUCTO_ID_BEBIDA, 
        cantidad: 1,
        precio_unitario_al_momento_venta: 3.00,
        notas_item: null,
        estado_cocina: EstadoCocina.LISTO, 
        fecha_hora_estado_cocina_cambio: new Date(),
        producto: { id: MOCK_PRODUCTO_ID_BEBIDA, nombre: 'Refresco', precio: 3.00, activo: true, categoria: { id: MOCK_CATEGORIA_BEBIDA_ID, nombre: 'Bebidas', es_bebida: true } } as any,
      } as PedidoItemEntity;
      const localMockExistingPedido = {
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        pedidoItems: [...mockExistingPedido.pedidoItems, mockItemBebidaLista],
        total_estimado: mockExistingPedido.total_estimado + mockItemBebidaLista.precio_unitario_al_momento_venta
      };
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
          { id: MOCK_ITEM_ID_2, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1 },
          { id: 'item-bebida-lista', producto_id: MOCK_PRODUCTO_ID_BEBIDA, cantidad: 2 } 
        ]
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(localMockExistingPedido)), estado: EstadoPedido.ABIERTO });
      await expect(service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
    });
    it('no debería permitir cambiar las notas de una bebida en estado LISTO y lanzar BadRequestException', async () => {
      const mockItemBebidaLista: PedidoItemEntity = {
        id: 'item-bebida-lista-notas',
        pedido_id: MOCK_PEDIDO_ID_UPDATE,
        producto_id: MOCK_PRODUCTO_ID_BEBIDA,
        cantidad: 1,
        precio_unitario_al_momento_venta: 3.00,
        notas_item: 'Notas originales',
        estado_cocina: EstadoCocina.LISTO,
        fecha_hora_estado_cocina_cambio: new Date(),
        producto: { id: MOCK_PRODUCTO_ID_BEBIDA, nombre: 'Refresco', precio: 3.00, activo: true, categoria: { id: MOCK_CATEGORIA_BEBIDA_ID, nombre: 'Bebidas', es_bebida: true } } as any,
      } as PedidoItemEntity;
      const localMockExistingPedido = {
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        pedidoItems: [...mockExistingPedido.pedidoItems, mockItemBebidaLista],
        total_estimado: mockExistingPedido.total_estimado + mockItemBebidaLista.precio_unitario_al_momento_venta
      };
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
          { id: MOCK_ITEM_ID_2, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1 },
          { id: 'item-bebida-lista-notas', producto_id: MOCK_PRODUCTO_ID_BEBIDA, cantidad: 1, notas_item: 'Nuevas notas' }
        ]
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(localMockExistingPedido)), estado: EstadoPedido.ABIERTO });
      await expect(service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
    });
    it('debería permitir cambiar el estado de cocina de una comida de LISTO a PENDIENTE si el usuario es Admin/Supervisor', async () => {
      const mockItemComidaLista: PedidoItemEntity = {
        id: 'item-comida-lista',
        pedido_id: MOCK_PEDIDO_ID_UPDATE,
        producto_id: MOCK_PRODUCTO_ID_PIZZA,
        cantidad: 1,
        precio_unitario_al_momento_venta: 10.00,
        notas_item: null,
        estado_cocina: EstadoCocina.LISTO,
        fecha_hora_estado_cocina_cambio: new Date(),
        producto: { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', precio: 10.00, activo: true, categoria: { id: MOCK_CATEGORIA_COMIDA_ID, nombre: 'Comidas', es_bebida: false } } as any,
      } as PedidoItemEntity;
      const localMockExistingPedido = {
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        pedidoItems: [...mockExistingPedido.pedidoItems, mockItemComidaLista],
        total_estimado: mockExistingPedido.total_estimado + mockItemComidaLista.precio_unitario_al_momento_venta
      };
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
          { id: MOCK_ITEM_ID_2, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1 },
          { id: 'item-comida-lista', producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, estado_cocina: EstadoCocina.PENDIENTE } 
        ]
      };
      const expectedTotal = (1 * mockProductPizza.precio) + (1 * mockProductCoca.precio) + (1 * mockProductPizza.precio);
      jest.spyOn(usuariosService, 'findOne').mockResolvedValueOnce({ id: MOCK_USUARIO_ACTUANTE_ID, nombre: 'Usuario Admin', rol_id: MOCK_ADMIN_ROLE.id } as any);
      jest.spyOn(rolesService, 'findOne').mockResolvedValueOnce(MOCK_ADMIN_ROLE);
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(localMockExistingPedido)), estado: EstadoPedido.ABIERTO });
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce([
        { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, precio_unitario_al_momento_venta: 10.00 } as PedidoItemEntity,
        { id: MOCK_ITEM_ID_2, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, precio_unitario_al_momento_venta: 5.00 } as PedidoItemEntity,
        { id: 'item-comida-lista', pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, precio_unitario_al_momento_venta: 10.00, estado_cocina: EstadoCocina.PENDIENTE } as PedidoItemEntity,
      ]);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(localMockExistingPedido)),
        total_estimado: expectedTotal,
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date), precio_unitario_al_momento_venta: 10.00 } as PedidoItemEntity,
          { id: MOCK_ITEM_ID_2, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date), precio_unitario_al_momento_venta: 5.00 } as PedidoItemEntity,
          { id: 'item-comida-lista', pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date), precio_unitario_al_momento_venta: 10.00 } as PedidoItemEntity,
        ]
      });
      await service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoItemEntity, expect.arrayContaining([
        expect.objectContaining({ id: 'item-comida-lista', estado_cocina: EstadoCocina.PENDIENTE }),
      ]));
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({ total_estimado: expectedTotal }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoItemUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_UPDATE, expect.objectContaining({ id: 'item-comida-lista', estado_cocina: EstadoCocina.PENDIENTE }));
    });
    it('debería permitir la edición de un pedido si la configuración de tiempo para edición no está definida', async () => {
      jest.spyOn(establecimientoConfiguracionPedidoService, 'findOneByEstablecimientoId').mockResolvedValue(undefined as any);
      mockExistingPedido.estado = EstadoPedido.EN_PREPARACION; 
      mockExistingPedido.fecha_ultima_actualizacion_relevante_cocina = new Date(Date.now() - (30 * 60 * 1000)); 
      const updatePedidoDto: UpdatePedidoDto = {
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 2 },
        ]
      };
      const expectedTotal = (2 * mockProductPizza.precio) + (1 * mockProductCoca.precio);
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockExistingPedido)) });
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce([
        { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 2, precio_unitario_al_momento_venta: 10.00 } as PedidoItemEntity,
        { id: MOCK_ITEM_ID_2, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, precio_unitario_al_momento_venta: 5.00 } as PedidoItemEntity,
      ]);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        total_estimado: expectedTotal,
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 2, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date), precio_unitario_al_momento_venta: 10.00 } as PedidoItemEntity,
          { id: MOCK_ITEM_ID_2, pedido_id: MOCK_PEDIDO_ID_UPDATE, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, notas_item: null, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date), precio_unitario_al_momento_venta: 5.00 } as PedidoItemEntity,
        ]
      });
      const result = await service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoItemEntity, expect.arrayContaining([
        expect.objectContaining({ id: MOCK_ITEM_ID_1, cantidad: 2 }),
      ]));
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({ total_estimado: expectedTotal }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_UPDATE, expect.any(Function));
      expect(result.total_estimado).toBe(expectedTotal);
    });

    it('debería actualizar campos generales del pedido sin afectar ítems, tipo o mesa', async () => {
      const updatePedidoDto: UpdatePedidoDto = {
        notas: 'Nuevas notas para el pedido',
        cliente_nombre: 'Nuevo Cliente',
      };
      const localMockExistingPedido = {
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        estado: EstadoPedido.ABIERTO,
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(localMockExistingPedido);
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce(localMockExistingPedido.pedidoItems);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...localMockExistingPedido,
        notas: updatePedidoDto.notas,
        cliente_nombre: updatePedidoDto.cliente_nombre,
        updated_at: expect.any(Date),
      });
      const result = await service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        id: MOCK_PEDIDO_ID_UPDATE,
        notas: 'Nuevas notas para el pedido',
        cliente_nombre: 'Nuevo Cliente',
        updated_at: expect.any(Date),
      }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_UPDATE, expect.any(Function));
      expect(result.notas).toBe('Nuevas notas para el pedido');
      expect(result.cliente_nombre).toBe('Nuevo Cliente');
    });

    
    it('debería cambiar tipo de pedido de DOMICILIO a MESA', async () => {
      const updatePedidoDto: UpdatePedidoDto = {
        tipo_pedido: TipoPedido.MESA,
        mesa_id: MOCK_MESA_ID_2,
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
          { id: MOCK_ITEM_ID_2, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1 },
        ]
      };
      const localMockExistingPedido = {
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        tipo_pedido: TipoPedido.DOMICILIO,
        mesa_id: null,
        cliente_nombre: 'Cliente Domicilio',
        cliente_telefono: '123',
        cliente_direccion: 'Dir Domicilio',
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(localMockExistingPedido);
      jest.spyOn(mesasService, 'findOne').mockResolvedValueOnce({ id: MOCK_MESA_ID_2, numero: 6, estado: EstadoMesa.LIBRE } as any);
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce(localMockExistingPedido.pedidoItems);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...localMockExistingPedido,
        tipo_pedido: TipoPedido.MESA,
        mesa_id: MOCK_MESA_ID_2,
        cliente_nombre: null,
        cliente_telefono: null,
        cliente_direccion: null,
        updated_at: expect.any(Date),
      });
      const result = await service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        tipo_pedido: TipoPedido.MESA,
        mesa_id: MOCK_MESA_ID_2,
        cliente_nombre: null,
        cliente_telefono: null,
        cliente_direccion: null,
      }));
      expect(queryRunner.manager.update).toHaveBeenCalledWith(MesaEntity, MOCK_MESA_ID_2, { estado: EstadoMesa.OCUPADA });
      expect(websocketEventsService.emitMesaStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_MESA_ID_2, EstadoMesa.OCUPADA);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.tipo_pedido).toBe(TipoPedido.MESA);
      expect(result.mesa_id).toBe(MOCK_MESA_ID_2);
      expect(result.cliente_nombre).toBeNull();
    });
    it('debería cambiar tipo de pedido de MESA a DOMICILIO', async () => {
      const updatePedidoDto: UpdatePedidoDto = {
        tipo_pedido: TipoPedido.DOMICILIO,
        cliente_nombre: 'Nuevo Cliente Domicilio',
        cliente_telefono: '987654321',
        cliente_direccion: 'Nueva Calle 456',
        pedidoItems: [
          { id: MOCK_ITEM_ID_1, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1 },
          { id: MOCK_ITEM_ID_2, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1 },
        ]
      };
      const localMockExistingPedido = {
        ...JSON.parse(JSON.stringify(mockExistingPedido)),
        tipo_pedido: TipoPedido.MESA,
        mesa_id: MOCK_MESA_ID,
        cliente_nombre: null,
        cliente_telefono: null,
        cliente_direccion: null,
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(localMockExistingPedido);
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce(localMockExistingPedido.pedidoItems);
      jest.spyOn(queryRunner.manager, 'count').mockResolvedValueOnce(0); 
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...localMockExistingPedido,
        tipo_pedido: TipoPedido.DOMICILIO,
        mesa_id: null,
        cliente_nombre: updatePedidoDto.cliente_nombre,
        cliente_telefono: updatePedidoDto.cliente_telefono,
        cliente_direccion: updatePedidoDto.cliente_direccion,
        updated_at: expect.any(Date),
      });
      const result = await service.update(MOCK_PEDIDO_ID_UPDATE, updatePedidoDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.update).toHaveBeenCalledWith(MesaEntity, MOCK_MESA_ID, { estado: EstadoMesa.LIBRE });
      expect(websocketEventsService.emitMesaStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_MESA_ID, EstadoMesa.LIBRE);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        tipo_pedido: TipoPedido.DOMICILIO,
        mesa_id: null,
        cliente_nombre: 'Nuevo Cliente Domicilio',
        cliente_telefono: '987654321',
        cliente_direccion: 'Nueva Calle 456',
      }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.tipo_pedido).toBe(TipoPedido.DOMICILIO);
      expect(result.mesa_id).toBeNull();
      expect(result.cliente_nombre).toBe('Nuevo Cliente Domicilio');
    });
  }); 
  describe('updatePedidoStatus (Cerrar Pedido)', () => {
    const MOCK_PEDIDO_ID_STATUS = 'pedido-status-uuid';
    let mockPedidoToClose: PedidoEntity;
    beforeEach(() => {
      mockPedidoToClose = {
        id: MOCK_PEDIDO_ID_STATUS,
        establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
        mesa_id: MOCK_MESA_ID,
        usuario_creador_id: MOCK_USUARIO_CREADOR_ID,
        usuario_domiciliario_id: null,
        usuario_cancelador_id: null,
        estado: EstadoPedido.EN_PREPARACION,
        tipo_pedido: TipoPedido.MESA,
        cliente_nombre: null,
        cliente_telefono: null,
        cliente_direccion: null,
        total_estimado: 50.00,
        descuentos_aplicados: 0.00,
        notas: null,
        fecha_hora_pedido: new Date(),
        fecha_hora_cierre: null,
        fecha_cancelacion: null,
        created_at: new Date(),
        updated_at: new Date(),
        fecha_ultima_actualizacion_relevante_cocina: new Date(),
        pedidoItems: [
          { id: 'item-close-1', pedido_id: MOCK_PEDIDO_ID_STATUS, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, precio_unitario_al_momento_venta: 10.00, estado_cocina: EstadoCocina.LISTO, notas_item: null, fecha_hora_estado_cocina_cambio: new Date(), producto: { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', categoria: { es_bebida: false } } as any } as PedidoItemEntity,
          { id: 'item-close-2', pedido_id: MOCK_PEDIDO_ID_STATUS, producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, precio_unitario_al_momento_venta: 5.00, estado_cocina: EstadoCocina.LISTO, notas_item: null, fecha_hora_estado_cocina_cambio: new Date(), producto: { id: MOCK_PRODUCTO_ID_COCA, nombre: 'Coca', categoria: { es_bebida: true } } as any } as PedidoItemEntity,
        ],
        establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any,
        mesa: { id: MOCK_MESA_ID, numero: 5, estado: EstadoMesa.OCUPADA } as any,
        usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any,
        usuarioDomiciliario: null as any,
        usuarioCancelador: null as any,
      } as PedidoEntity;
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockImplementation(async (entity: any, options: any) => {
          if (entity === PedidoEntity && options.where.id === MOCK_PEDIDO_ID_STATUS) {
            return Promise.resolve(JSON.parse(JSON.stringify(mockPedidoToClose)));
          }
          return Promise.resolve(null);
        });
      jest.spyOn(productosService, 'consumeProductIngredients').mockResolvedValue(true as any);
    });
    it('debería cerrar un pedido válido que está en preparación si todos los ítems están LISTO', async () => {
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.EN_PREPARACION });
      jest.spyOn(queryRunner.manager, 'count').mockResolvedValueOnce(0);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockPedidoToClose)),
        estado: EstadoPedido.CERRADO,
        fecha_hora_cierre: expect.any(Date),
      });
      const result = await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CERRADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        estado: EstadoPedido.CERRADO,
        fecha_hora_cierre: expect.any(Date),
      }));
      expect(productosService.consumeProductIngredients).toHaveBeenCalledTimes(mockPedidoToClose.pedidoItems.length);
      expect(queryRunner.manager.update).toHaveBeenCalledWith(MesaEntity, MOCK_MESA_ID, { estado: EstadoMesa.LIBRE });
      expect(websocketEventsService.emitMesaStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_MESA_ID, EstadoMesa.LIBRE);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_STATUS, EstadoPedido.CERRADO);
      expect(result.estado).toBe(EstadoPedido.CERRADO);
      expect(result.fecha_hora_cierre).toBeInstanceOf(Date);
    });
    it('no debería cerrar un pedido con ítems pendientes de entrega (no LISTO) y lanzar BadRequestException', async () => {
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({
          ...JSON.parse(JSON.stringify(mockPedidoToClose)),
          estado: EstadoPedido.EN_PREPARACION,
          pedidoItems: [
            { id: 'item-close-1', estado_cocina: EstadoCocina.EN_PREPARACION } as PedidoItemEntity,
            { id: 'item-close-2', estado_cocina: EstadoCocina.LISTO } as PedidoItemEntity,
          ]
        });
      await expect(service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CERRADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('debería cancelar un pedido en estado ABIERTO (nuevo)', async () => {
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.ABIERTO });
      jest.spyOn(queryRunner.manager, 'count').mockResolvedValueOnce(0);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockPedidoToClose)),
        estado: EstadoPedido.CANCELADO,
        fecha_cancelacion: expect.any(Date),
      });
      const result = await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CANCELADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        estado: EstadoPedido.CANCELADO,
        fecha_cancelacion: expect.any(Date),
        usuario_cancelador_id: MOCK_USUARIO_ACTUANTE_ID,
      }));
      expect(queryRunner.manager.update).toHaveBeenCalledWith(MesaEntity, MOCK_MESA_ID, { estado: EstadoMesa.LIBRE });
      expect(websocketEventsService.emitMesaStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_MESA_ID, EstadoMesa.LIBRE);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_STATUS, EstadoPedido.CANCELADO);
      expect(result.estado).toBe(EstadoPedido.CANCELADO);
      expect(result.fecha_cancelacion).toBeInstanceOf(Date);
    });
    it('debería cancelar un pedido "enviado a cocina" dentro del tiempo límite si el usuario es Admin/Supervisor', async () => {
      const now = new Date();
      const threeMinutesAgo = new Date(now.getTime() - (3 * 60 * 1000));
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({
          ...JSON.parse(JSON.stringify(mockPedidoToClose)),
          estado: EstadoPedido.ENVIADO_A_COCINA,
          fecha_ultima_actualizacion_relevante_cocina: threeMinutesAgo,
        });
      jest.spyOn(usuariosService, 'findOne').mockResolvedValueOnce({ id: MOCK_USUARIO_ACTUANTE_ID, nombre: 'Usuario Supervisor', rol_id: MOCK_ADMIN_ROLE.id } as any);
      jest.spyOn(rolesService, 'findOne').mockResolvedValueOnce(MOCK_ADMIN_ROLE);
      jest.spyOn(queryRunner.manager, 'count').mockResolvedValueOnce(0);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockPedidoToClose)),
        estado: EstadoPedido.CANCELADO,
        fecha_cancelacion: expect.any(Date),
      });
      const result = await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CANCELADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.estado).toBe(EstadoPedido.CANCELADO);
    });
    it('no debería cancelar un pedido "en preparación" fuera del tiempo límite si el usuario no es Admin/Supervisor', async () => {
      const now = new Date();
      const twentyMinutesAgo = new Date(now.getTime() - (20 * 60 * 1000));
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({
          ...JSON.parse(JSON.stringify(mockPedidoToClose)),
          estado: EstadoPedido.EN_PREPARACION,
          fecha_ultima_actualizacion_relevante_cocina: twentyMinutesAgo,
        });
      jest.spyOn(usuariosService, 'findOne').mockResolvedValueOnce({ id: MOCK_USUARIO_ACTUANTE_ID, nombre: 'Usuario Mesero', rol_id: MOCK_MESERO_ROLE.id } as any);
      jest.spyOn(rolesService, 'findOne').mockResolvedValueOnce(MOCK_MESERO_ROLE);
      await expect(service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CANCELADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
    it('debería permitir a un Admin/Supervisor cancelar un pedido fuera de tiempo límite', async () => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - (15 * 60 * 1000));
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({
          ...JSON.parse(JSON.stringify(mockPedidoToClose)),
          estado: EstadoPedido.EN_PREPARACION,
          fecha_ultima_actualizacion_relevante_cocina: fifteenMinutesAgo,
        });
      jest.spyOn(usuariosService, 'findOne').mockResolvedValueOnce({ id: MOCK_USUARIO_ACTUANTE_ID, nombre: 'Usuario Admin', rol_id: MOCK_ADMIN_ROLE.id } as any);
      jest.spyOn(rolesService, 'findOne').mockResolvedValueOnce(MOCK_ADMIN_ROLE);
      jest.spyOn(queryRunner.manager, 'count').mockResolvedValueOnce(0);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockPedidoToClose)),
        estado: EstadoPedido.CANCELADO,
        fecha_cancelacion: expect.any(Date),
      });
      const result = await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CANCELADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.estado).toBe(EstadoPedido.CANCELADO);
    });
    it('debería marcar un pedido como PAGADO si está CERRADO', async () => {
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.CERRADO });
      jest.spyOn(queryRunner.manager, 'count').mockResolvedValueOnce(0);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockPedidoToClose)),
        estado: EstadoPedido.PAGADO,
        fecha_hora_cierre: expect.any(Date),
      });
      const result = await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.PAGADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        estado: EstadoPedido.PAGADO,
        fecha_hora_cierre: expect.any(Date),
      }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_STATUS, EstadoPedido.PAGADO);
      expect(result.estado).toBe(EstadoPedido.PAGADO);
    });
    it('no debería marcar un pedido como PAGADO si no está CERRADO', async () => {
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.EN_PREPARACION });
      await expect(service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.PAGADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
    it('no debería cerrar un pedido si hay stock insuficiente de ingredientes y lanzar BadRequestException', async () => {
      const mockPedidoConItems: PedidoEntity = {
        ...JSON.parse(JSON.stringify(mockPedidoToClose)),
        estado: EstadoPedido.EN_PREPARACION,
        pedidoItems: [
          { id: 'item-pizza', producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, precio_unitario_al_momento_venta: 10.00, estado_cocina: EstadoCocina.LISTO } as PedidoItemEntity,
          { id: 'item-coca', producto_id: MOCK_PRODUCTO_ID_COCA, cantidad: 1, precio_unitario_al_momento_venta: 5.00, estado_cocina: EstadoCocina.LISTO } as PedidoItemEntity,
        ],
      };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...mockPedidoConItems, estado: EstadoPedido.EN_PREPARACION });
      jest.spyOn(productosService, 'consumeProductIngredients')
        .mockRejectedValueOnce(new BadRequestException('Stock insuficiente para "Harina". Requerido: 500 gramos, Disponible: 200 gramos.'));
      await expect(service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CERRADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(productosService.consumeProductIngredients).toHaveBeenCalledWith(
        MOCK_PRODUCTO_ID_PIZZA, MOCK_ESTABLECIMIENTO_ID
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoStatusUpdated).not.toHaveBeenCalled();
      expect(websocketEventsService.emitMesaStatusUpdated).not.toHaveBeenCalled();
    });
    it('no debería cambiar el estado de un pedido que ya está PAGADO y lanzar BadRequestException', async () => {
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.PAGADO }); 
      await expect(service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CERRADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
    });
    it('no debería cambiar el estado de un pedido que ya está ENTREGADO y lanzar BadRequestException', async () => {
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({ ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.ENTREGADO }); 
      await expect(service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CERRADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).not.toHaveBeenCalled();
    });
    it('debería cambiar el estado de ABIERTO a EN_PREPARACION', async () => {
      const localMockPedido = { ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.ABIERTO };
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(localMockPedido);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ ...localMockPedido, estado: EstadoPedido.EN_PREPARACION });
      const result = await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.EN_PREPARACION, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        estado: EstadoPedido.EN_PREPARACION,
        fecha_ultima_actualizacion_relevante_cocina: expect.any(Date),
      }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_STATUS, EstadoPedido.EN_PREPARACION);
      expect(result.estado).toBe(EstadoPedido.EN_PREPARACION);
    });
    it('debería cambiar el estado de EN_PREPARACION a ENVIADO_A_COCINA', async () => {
      const localMockPedido = { ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.EN_PREPARACION };
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(localMockPedido);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ ...localMockPedido, estado: EstadoPedido.ENVIADO_A_COCINA });
      const result = await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.ENVIADO_A_COCINA, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        estado: EstadoPedido.ENVIADO_A_COCINA,
        fecha_ultima_actualizacion_relevante_cocina: expect.any(Date),
      }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_STATUS, EstadoPedido.ENVIADO_A_COCINA);
      expect(result.estado).toBe(EstadoPedido.ENVIADO_A_COCINA);
    });
    it('debería cambiar el estado de ENVIADO_A_COCINA a LISTO_PARA_ENTREGAR', async () => {
      const localMockPedido = { ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.ENVIADO_A_COCINA };
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(localMockPedido);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ ...localMockPedido, estado: EstadoPedido.LISTO_PARA_ENTREGAR });
      const result = await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.LISTO_PARA_ENTREGAR, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        estado: EstadoPedido.LISTO_PARA_ENTREGAR,
      }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_STATUS, EstadoPedido.LISTO_PARA_ENTREGAR);
      expect(result.estado).toBe(EstadoPedido.LISTO_PARA_ENTREGAR);
    });
    it('debería cambiar el estado de LISTO_PARA_ENTREGAR a ENTREGADO', async () => {
      const localMockPedido = { ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.LISTO_PARA_ENTREGAR };
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(localMockPedido);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ ...localMockPedido, estado: EstadoPedido.ENTREGADO });
      const result = await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.ENTREGADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        estado: EstadoPedido.ENTREGADO,
      }));
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_STATUS, EstadoPedido.ENTREGADO);
      expect(result.estado).toBe(EstadoPedido.ENTREGADO);
    });
    it('debería permitir la cancelación si la configuración de límites no está definida (usa Infinity)', async () => {
      jest.spyOn(establecimientoConfiguracionPedidoService, 'findOneByEstablecimientoId').mockResolvedValue(undefined as any);
      const now = new Date();
      const twentyMinutesAgo = new Date(now.getTime() - (20 * 60 * 1000)); // Fuera de cualquier límite "normal"
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce({
          ...JSON.parse(JSON.stringify(mockPedidoToClose)),
          estado: EstadoPedido.EN_PREPARACION,
          fecha_ultima_actualizacion_relevante_cocina: twentyMinutesAgo,
        });
      jest.spyOn(usuariosService, 'findOne').mockResolvedValueOnce({ id: MOCK_USUARIO_ACTUANTE_ID, nombre: 'Usuario Mesero', rol_id: MOCK_MESERO_ROLE.id } as any);
      jest.spyOn(rolesService, 'findOne').mockResolvedValueOnce(MOCK_MESERO_ROLE);
      jest.spyOn(queryRunner.manager, 'count').mockResolvedValueOnce(0);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...JSON.parse(JSON.stringify(mockPedidoToClose)),
        estado: EstadoPedido.CANCELADO,
        fecha_cancelacion: expect.any(Date),
      });
      const result = await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CANCELADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result.estado).toBe(EstadoPedido.CANCELADO);
    });
    it('debería liberar la mesa si no hay otros pedidos activos en ella al cerrar/pagar el pedido', async () => {
      const localMockPedido = { ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.EN_PREPARACION };
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(localMockPedido);
      jest.spyOn(queryRunner.manager, 'count').mockResolvedValueOnce(0); 
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ ...localMockPedido, estado: EstadoPedido.CERRADO });
      await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CERRADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.update).toHaveBeenCalledWith(MesaEntity, MOCK_MESA_ID, { estado: EstadoMesa.LIBRE });
      expect(websocketEventsService.emitMesaStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_MESA_ID, EstadoMesa.LIBRE);
    });
    it('no debería liberar la mesa si hay otros pedidos activos en ella al cerrar/pagar el pedido', async () => {
      const localMockPedido = { ...JSON.parse(JSON.stringify(mockPedidoToClose)), estado: EstadoPedido.EN_PREPARACION };
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(localMockPedido);
      jest.spyOn(queryRunner.manager, 'count').mockResolvedValueOnce(1); 
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({ ...localMockPedido, estado: EstadoPedido.CERRADO });
      await service.updatePedidoStatus(MOCK_PEDIDO_ID_STATUS, EstadoPedido.CERRADO, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.update).not.toHaveBeenCalledWith(MesaEntity, MOCK_MESA_ID, { estado: EstadoMesa.LIBRE });
      expect(websocketEventsService.emitMesaStatusUpdated).not.toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_MESA_ID, EstadoMesa.LIBRE);
    });
  });
  describe('addOrUpdatePedidoItem', () => {
    const MOCK_PEDIDO_ID_ADD_UPDATE = 'pedido-add-update-uuid';
    const MOCK_ITEM_ID_EXISTING = 'item-existing-uuid';
    let mockExistingPedido: PedidoEntity;
    let mockProductNew: any;
    beforeEach(() => {
      mockExistingPedido = {
        id: MOCK_PEDIDO_ID_ADD_UPDATE,
        establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
        estado: EstadoPedido.ABIERTO,
        total_estimado: 10.00,
        pedidoItems: [
          { id: MOCK_ITEM_ID_EXISTING, pedido_id: MOCK_PEDIDO_ID_ADD_UPDATE, producto_id: MOCK_PRODUCTO_ID_PIZZA, cantidad: 1, precio_unitario_al_momento_venta: 10.00, notas_item: 'sin cebolla', estado_cocina: EstadoCocina.EN_PREPARACION, fecha_hora_estado_cocina_cambio: new Date() } as PedidoItemEntity,
        ],
      } as PedidoEntity;
      mockProductNew = { id: MOCK_PRODUCTO_ID_PAPAS, nombre: 'Papas Fritas', precio: 7.50, activo: true } as any;
      jest.spyOn(service, 'findOne').mockResolvedValue(JSON.parse(JSON.stringify(mockExistingPedido)));
      jest.spyOn(productosService, 'findOne').mockResolvedValue(mockProductNew);
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(null); 
      jest.spyOn(queryRunner.manager, 'save').mockImplementation((entity: any) => Promise.resolve(entity));
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValue([]);
    });


    it('debería actualizar las notas de un ítem existente sin cambiar la cantidad', async () => {
      const updateDto: CreatePedidoItemDto = {
        producto_id: MOCK_PRODUCTO_ID_PIZZA,
        cantidad: 1,
        notas_item: 'con extra queso',
      };
      const existingItem: PedidoItemEntity = {
        id: MOCK_ITEM_ID_EXISTING,
        pedido_id: MOCK_PEDIDO_ID_ADD_UPDATE,
        producto_id: MOCK_PRODUCTO_ID_PIZZA,
        cantidad: 1,
        precio_unitario_al_momento_venta: 10.00,
        notas_item: 'sin cebolla',
        estado_cocina: EstadoCocina.EN_PREPARACION, 
        fecha_hora_estado_cocina_cambio: new Date(),
      } as PedidoItemEntity;
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(existingItem);
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce([
        { ...existingItem, notas_item: updateDto.notas_item, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date) }
      ]);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...mockExistingPedido,
        pedidoItems: [{ ...existingItem, notas_item: updateDto.notas_item, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date) }],
        total_estimado: 10.00,
      });
      const result = await service.addOrUpdatePedidoItem(MOCK_PEDIDO_ID_ADD_UPDATE, updateDto, MOCK_ESTABLECIMIENTO_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoItemEntity, expect.objectContaining({
        id: MOCK_ITEM_ID_EXISTING,
        notas_item: 'con extra queso',
        estado_cocina: EstadoCocina.PENDIENTE,
      }));
      expect(result.notas_item).toBe('con extra queso');
      expect(result.estado_cocina).toBe(EstadoCocina.PENDIENTE);
    });
    it('debería actualizar la cantidad de un ítem existente sin cambiar las notas', async () => {
      const updateDto: CreatePedidoItemDto = {
        producto_id: MOCK_PRODUCTO_ID_PIZZA,
        cantidad: 2, 
        notas_item: 'sin cebolla', 
      };
      const existingItem: PedidoItemEntity = {
        id: MOCK_ITEM_ID_EXISTING,
        pedido_id: MOCK_PEDIDO_ID_ADD_UPDATE,
        producto_id: MOCK_PRODUCTO_ID_PIZZA,
        cantidad: 1,
        precio_unitario_al_momento_venta: 10.00,
        notas_item: 'sin cebolla',
        estado_cocina: EstadoCocina.LISTO, 
        fecha_hora_estado_cocina_cambio: new Date(),
      } as PedidoItemEntity;
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(existingItem);
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValueOnce([
        { ...existingItem, cantidad: updateDto.cantidad, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date) }
      ]);
      jest.spyOn(service, 'findOne').mockResolvedValueOnce({
        ...mockExistingPedido,
        pedidoItems: [{ ...existingItem, cantidad: updateDto.cantidad, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: expect.any(Date) }],
        total_estimado: 20.00, 
      });
      const result = await service.addOrUpdatePedidoItem(MOCK_PEDIDO_ID_ADD_UPDATE, updateDto, MOCK_ESTABLECIMIENTO_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoItemEntity, expect.objectContaining({
        id: MOCK_ITEM_ID_EXISTING,
        cantidad: 2,
        estado_cocina: EstadoCocina.PENDIENTE,
      }));
      expect(result.cantidad).toBe(2);
      expect(result.estado_cocina).toBe(EstadoCocina.PENDIENTE);
    });
  });



  describe('updatePedidoItem', () => {
    const MOCK_PEDIDO_ID_ITEM_UPDATE = 'pedido-item-update-uuid';
    const MOCK_ITEM_ID_UPDATE = 'item-to-update-uuid';
    const MOCK_PRODUCTO_ID_PIZZA = 'producto-pizza-uuid'; // Asegúrate de que esta mock exista
    const MOCK_PRODUCTO_ID_BEBIDA = 'producto-bebida-uuid'; // Asegúrate de que esta mock exista
    const MOCK_CATEGORIA_COMIDA_ID = 'categoria-comida-uuid'; // Asegúrate de que esta mock exista
    const MOCK_CATEGORIA_BEBIDA_ID = 'categoria-bebida-uuid'; // Asegúrate de que esta mock exista
    const MOCK_USUARIO_ACTUANTE_ID = 'usuario-actuante-uuid'; // Asegúrate de que esta mock exista
    const MOCK_ESTABLECIMIENTO_ID = 'establecimiento-uuid'; // Asegúrate de que esta mock exista
    const MOCK_COCINERO_ROLE = {id: 'cocinero-role-id',nombre: 'COCINERO',created_at: new Date(), updated_at: new Date(),} as any; 
    let mockExistingPedido: PedidoEntity;
    let mockExistingItem: PedidoItemEntity;

    beforeEach(() => {
      mockExistingItem = {
        id: MOCK_ITEM_ID_UPDATE,
        pedido_id: MOCK_PEDIDO_ID_ITEM_UPDATE,
        producto_id: MOCK_PRODUCTO_ID_PIZZA,
        cantidad: 1,
        precio_unitario_al_momento_venta: 10.00,
        notas_item: 'original notes',
        estado_cocina: EstadoCocina.PENDIENTE,
        fecha_hora_estado_cocina_cambio: new Date(),
        producto: { id: MOCK_PRODUCTO_ID_PIZZA, nombre: 'Pizza', categoria: { id: MOCK_CATEGORIA_COMIDA_ID, nombre: 'Comidas', es_bebida: false } } as any,
      } as PedidoItemEntity;

      mockExistingPedido = {
        id: MOCK_PEDIDO_ID_ITEM_UPDATE,
        establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
        estado: EstadoPedido.ABIERTO,
        total_estimado: 10.00,
        pedidoItems: [mockExistingItem],
      } as PedidoEntity;

      jest.spyOn(queryRunner.manager, 'findOne')
        .mockImplementation(async (entity: any, options: any) => {
          if (entity === PedidoEntity && options.where.id === MOCK_PEDIDO_ID_ITEM_UPDATE) {
            return Promise.resolve(JSON.parse(JSON.stringify(mockExistingPedido)));
          }
          return Promise.resolve(null);
        });
      jest.spyOn(queryRunner.manager, 'find').mockResolvedValue([mockExistingItem]);
      // Mocks adicionales que podrías necesitar para el servicio, como usuariosService y rolesService
      jest.spyOn(usuariosService, 'findOne').mockResolvedValue({ id: MOCK_USUARIO_ACTUANTE_ID, rol_id: MOCK_COCINERO_ROLE.id } as any);
      jest.spyOn(rolesService, 'findOne').mockResolvedValue(MOCK_COCINERO_ROLE);
    });

    it('debería actualizar las notas de un ítem de comida', async () => {
      // Ahora incluye producto_id y cantidad
      const updateDto: UpdatePedidoItemDto = {
        producto_id: mockExistingItem.producto_id,
        cantidad: mockExistingItem.cantidad,
        notas_item: 'nuevas notas para la pizza'
      };
      const result = await service.updatePedidoItem(MOCK_PEDIDO_ID_ITEM_UPDATE, MOCK_ITEM_ID_UPDATE, updateDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoItemEntity, expect.objectContaining({
        id: MOCK_ITEM_ID_UPDATE,
        notas_item: 'nuevas notas para la pizza',
      }));
      expect(result.notas_item).toBe('nuevas notas para la pizza');
    });

    it('debería actualizar la cantidad de un ítem de comida', async () => {
      // Ahora incluye producto_id
      const updateDto: UpdatePedidoItemDto = {
        producto_id: mockExistingItem.producto_id,
        cantidad: 2
      };
      const result = await service.updatePedidoItem(MOCK_PEDIDO_ID_ITEM_UPDATE, MOCK_ITEM_ID_UPDATE, updateDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoItemEntity, expect.objectContaining({
        id: MOCK_ITEM_ID_UPDATE,
        cantidad: 2,
        estado_cocina: EstadoCocina.PENDIENTE,
      }));
      expect(result.cantidad).toBe(2);
      expect(result.estado_cocina).toBe(EstadoCocina.PENDIENTE);
    });

    it('debería permitir cambiar el estado de cocina de PENDIENTE a EN_PREPARACION para comida', async () => {
      // Ahora incluye producto_id y cantidad
      const updateDto: UpdatePedidoItemDto = {
        producto_id: mockExistingItem.producto_id,
        cantidad: mockExistingItem.cantidad,
        estado_cocina: EstadoCocina.EN_PREPARACION
      };
      jest.spyOn(usuariosService, 'findOne').mockResolvedValueOnce({ id: MOCK_USUARIO_ACTUANTE_ID, rol_id: MOCK_COCINERO_ROLE.id } as any);
      jest.spyOn(rolesService, 'findOne').mockResolvedValueOnce(MOCK_COCINERO_ROLE);
      const result = await service.updatePedidoItem(MOCK_PEDIDO_ID_ITEM_UPDATE, MOCK_ITEM_ID_UPDATE, updateDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoItemEntity, expect.objectContaining({
        id: MOCK_ITEM_ID_UPDATE,
        estado_cocina: EstadoCocina.EN_PREPARACION,
        fecha_hora_estado_cocina_cambio: expect.any(Date),
      }));
      expect(result.estado_cocina).toBe(EstadoCocina.EN_PREPARACION);
    });

    it('debería permitir cambiar el estado de cocina de PENDIENTE a LISTO para bebida', async () => {
      const mockItemBebida: PedidoItemEntity = {
        ...mockExistingItem,
        id: 'item-bebida-id',
        producto_id: MOCK_PRODUCTO_ID_BEBIDA,
        producto: { id: MOCK_PRODUCTO_ID_BEBIDA, nombre: 'Refresco', categoria: { id: MOCK_CATEGORIA_BEBIDA_ID, nombre: 'Bebidas', es_bebida: true } } as any,
      };
      const mockPedidoConBebida = { ...mockExistingPedido, pedidoItems: [mockItemBebida] };
      jest.spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockPedidoConBebida);
      jest.spyOn(usuariosService, 'findOne').mockResolvedValueOnce({ id: MOCK_USUARIO_ACTUANTE_ID, rol_id: MOCK_COCINERO_ROLE.id } as any);
      jest.spyOn(rolesService, 'findOne').mockResolvedValueOnce(MOCK_COCINERO_ROLE);
      // Ahora incluye producto_id y cantidad
      const updateDto: UpdatePedidoItemDto = {
        producto_id: mockItemBebida.producto_id,
        cantidad: mockItemBebida.cantidad,
        estado_cocina: EstadoCocina.LISTO
      };
      const result = await service.updatePedidoItem(MOCK_PEDIDO_ID_ITEM_UPDATE, mockItemBebida.id, updateDto, MOCK_ESTABLECIMIENTO_ID, MOCK_USUARIO_ACTUANTE_ID);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoItemEntity, expect.objectContaining({
        id: 'item-bebida-id',
        estado_cocina: EstadoCocina.LISTO,
        fecha_hora_estado_cocina_cambio: expect.any(Date),
      }));
      expect(result.estado_cocina).toBe(EstadoCocina.LISTO);
    });
  });



  describe('transferPedidoTable', () => {
    const MOCK_PEDIDO_ID_TRANSFER = 'pedido-transfer-uuid';
    const MOCK_OLD_MESA_ID = 'old-mesa-uuid';
    const MOCK_NEW_MESA_ID = 'new-mesa-uuid';
    let mockPedido: PedidoEntity;
    beforeEach(() => {
      mockPedido = {
        id: MOCK_PEDIDO_ID_TRANSFER,
        establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
        mesa_id: MOCK_OLD_MESA_ID,
        tipo_pedido: TipoPedido.MESA,
        estado: EstadoPedido.ABIERTO,
      } as PedidoEntity;
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(JSON.parse(JSON.stringify(mockPedido)));
      jest.spyOn(mesasService, 'findOne')
        .mockImplementation((id: string) => {
          if (id === MOCK_NEW_MESA_ID) return Promise.resolve({ id: MOCK_NEW_MESA_ID, numero: 7, estado: EstadoMesa.LIBRE } as any);
          return Promise.resolve(null);
        });
      jest.spyOn(queryRunner.manager, 'save').mockImplementation((entity: any) => Promise.resolve(entity));
      jest.spyOn(queryRunner.manager, 'update').mockResolvedValue({ affected: 1, raw: [] } as UpdateResult);
    });
    it('debería transferir un pedido a una nueva mesa y no liberar la mesa antigua si tiene otros pedidos activos', async () => {
      jest.spyOn(queryRunner.manager, 'count').mockResolvedValueOnce(1); 
      const result = await service.transferPedidoTable(MOCK_PEDIDO_ID_TRANSFER, MOCK_NEW_MESA_ID, MOCK_ESTABLECIMIENTO_ID);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(PedidoEntity, expect.objectContaining({
        id: MOCK_PEDIDO_ID_TRANSFER,
        mesa_id: MOCK_NEW_MESA_ID,
        updated_at: expect.any(Date),
      }));
      expect(queryRunner.manager.update).toHaveBeenCalledWith(MesaEntity, MOCK_NEW_MESA_ID, { estado: EstadoMesa.OCUPADA });
      expect(websocketEventsService.emitMesaStatusUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_NEW_MESA_ID, EstadoMesa.OCUPADA);
      expect(queryRunner.manager.update).not.toHaveBeenCalledWith(MesaEntity, MOCK_OLD_MESA_ID, { estado: EstadoMesa.LIBRE }); 
      expect(websocketEventsService.emitMesaStatusUpdated).not.toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_OLD_MESA_ID, EstadoMesa.LIBRE);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(websocketEventsService.emitPedidoUpdated).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, MOCK_PEDIDO_ID_TRANSFER, expect.any(Object));
      expect(result.mesa_id).toBe(MOCK_NEW_MESA_ID);
    });
  });
  describe('findActiveOrdersSummary', () => {
    const mockActivePedidos: PedidoEntity[] = [
      {
        id: 'active-p1', establecimiento_id: MOCK_ESTABLECIMIENTO_ID, mesa_id: MOCK_MESA_ID, usuario_creador_id: MOCK_USUARIO_CREADOR_ID, 
        usuario_domiciliario_id: null, usuario_cancelador_id: null, 
        estado: EstadoPedido.ABIERTO, tipo_pedido: TipoPedido.MESA,
        cliente_nombre: null, cliente_telefono: null, cliente_direccion: null,
        total_estimado: 10, descuentos_aplicados: 0, notas: 'Notas P1', 
        fecha_hora_pedido: new Date(), fecha_hora_cierre: null, fecha_cancelacion: null, 
        created_at: new Date(), updated_at: new Date(), fecha_ultima_actualizacion_relevante_cocina: new Date(), 
        establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any, mesa: { id: MOCK_MESA_ID } as any, 
        usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any, usuarioDomiciliario: null as any, usuarioCancelador: null as any, 
        pedidoItems: [{ cantidad: 1, producto: { nombre: 'Item A' } as any, notas_item: 'Nota A', 
        id: 'item-1', pedido_id: 'active-p1', producto_id: 'prod-A', precio_unitario: 10, total_item: 10, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: new Date()
      }] as any[] 
      } as PedidoEntity,
      {
        id: 'active-p2', establecimiento_id: MOCK_ESTABLECIMIENTO_ID, cliente_nombre: 'Cliente X', usuario_creador_id: 'another-user-id', 
        mesa_id: null, usuario_domiciliario_id: null, usuario_cancelador_id: null, 
        estado: EstadoPedido.EN_PREPARACION, tipo_pedido: TipoPedido.DOMICILIO,
        cliente_telefono: null, cliente_direccion: null, 
        total_estimado: 20, descuentos_aplicados: 0, notas: 'Notas P2', 
        fecha_hora_pedido: new Date(), fecha_hora_cierre: null, fecha_cancelacion: null, 
        created_at: new Date(), updated_at: new Date(), fecha_ultima_actualizacion_relevante_cocina: new Date(), 
        establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any, mesa: null, 
        usuarioCreador: { id: 'another-user-id' } as any, usuarioDomiciliario: null as any, usuarioCancelador: null as any,
        pedidoItems: [{ cantidad: 2, producto: { nombre: 'Item B' } as any, notas_item: 'Nota B',
        id: 'item-2', pedido_id: 'active-p2', producto_id: 'prod-B', precio_unitario: 10, total_item: 20, estado_cocina: EstadoCocina.PENDIENTE, fecha_hora_estado_cocina_cambio: new Date()
      }] as any[]
      } as PedidoEntity,
    ];
    const mockInactivePedidos: PedidoEntity[] = [
      {
        id: 'inactive-p1', establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
        mesa_id: null,
        usuario_creador_id: MOCK_USUARIO_CREADOR_ID, 
        usuario_domiciliario_id: null, 
        usuario_cancelador_id: null, 
        estado: EstadoPedido.CERRADO, tipo_pedido: TipoPedido.MESA,
        cliente_nombre: null, cliente_telefono: null, cliente_direccion: null, 
        total_estimado: 10, descuentos_aplicados: 0, notas: 'Notas P1', 
        fecha_hora_pedido: new Date(), fecha_hora_cierre: new Date(), fecha_cancelacion: null,
        created_at: new Date(), updated_at: new Date(), fecha_ultima_actualizacion_relevante_cocina: new Date(), 
        establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any,
        mesa: null, usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any,
        usuarioDomiciliario: null as any, usuarioCancelador: null as any, 
        pedidoItems: [], 
      } as PedidoEntity,
      {
        id: 'inactive-p2', establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
        mesa_id: null, 
        usuario_creador_id: MOCK_USUARIO_CREADOR_ID, 
        usuario_domiciliario_id: null, 
        usuario_cancelador_id: null,
        estado: EstadoPedido.CANCELADO, tipo_pedido: TipoPedido.DOMICILIO,
        cliente_nombre: null, cliente_telefono: null, cliente_direccion: null, 
        total_estimado: 20, descuentos_aplicados: 0, notas: 'Notas P2', 
        fecha_hora_pedido: new Date(), fecha_hora_cierre: null, fecha_cancelacion: new Date(), 
        created_at: new Date(), updated_at: new Date(), fecha_ultima_actualizacion_relevante_cocina: new Date(), 
        establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any, 
        mesa: null, usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any, 
        usuarioDomiciliario: null as any, usuarioCancelador: null as any, 
        pedidoItems: [],
      } as PedidoEntity,
    ];
    beforeEach(() => {
      jest.spyOn(pedidoRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      } as any);
    });
    it('debería retornar un array vacío si no hay pedidos activos', async () => {
      jest.spyOn(pedidoRepository.createQueryBuilder('pedido'), 'getRawMany').mockResolvedValue([]);
      const result = await service.findActiveOrdersSummary(MOCK_ESTABLECIMIENTO_ID);
      expect(result).toEqual([]);
      expect(pedidoRepository.createQueryBuilder).toHaveBeenCalledWith('pedido');
    });
    it('debería retornar un resumen de pedidos activos', async () => {
      const mockRawData = [
        {
          pedido_id: 'active-p1',
          pedido_mesa_id: MOCK_MESA_ID,
          pedido_usuario_domiciliario_id: null,
          pedido_estado: EstadoPedido.ABIERTO,
          pedido_tipo_pedido: TipoPedido.MESA,
          pedido_cliente_nombre: null,
          pedido_cliente_telefono: null,
          pedido_cliente_direccion: null,
          pedido_total_estimado: 10,
          pedido_descuentos_aplicados: 0,
          pedido_notas: 'Notas P1',
          pedidoItem_cantidad: 1,
          pedidoItem_notas_item: 'Nota A',
          producto_nombre: 'Item A',
        },
        {
          pedido_id: 'active-p2',
          pedido_mesa_id: null,
          pedido_usuario_domiciliario_id: null,
          pedido_estado: EstadoPedido.EN_PREPARACION,
          pedido_tipo_pedido: TipoPedido.DOMICILIO,
          pedido_cliente_nombre: 'Cliente X',
          pedido_cliente_telefono: null,
          pedido_cliente_direccion: null,
          pedido_total_estimado: 20,
          pedido_descuentos_aplicados: 0,
          pedido_notas: 'Notas P2',
          pedidoItem_cantidad: 2,
          pedidoItem_notas_item: 'Nota B',
          producto_nombre: 'Item B',
        },
      ];
      jest.spyOn(pedidoRepository.createQueryBuilder('pedido'), 'getRawMany').mockResolvedValue(mockRawData);
      const result = await service.findActiveOrdersSummary(MOCK_ESTABLECIMIENTO_ID);
      expect(result).toEqual([
        {
          id: 'active-p1',
          mesa_id: MOCK_MESA_ID,
          usuario_domiciliario_id: null,
          estado: EstadoPedido.ABIERTO,
          tipo_pedido: TipoPedido.MESA,
          cliente_nombre: null,
          cliente_telefono: null,
          cliente_direccion: null,
          total_estimado: 10,
          descuentos_aplicados: 0,
          notas: 'Notas P1',
          pedidoItems: [
            { nombre: 'Item A', cantidad: 1, notas: 'Nota A' },
          ],
        },
        {
          id: 'active-p2',
          mesa_id: null,
          usuario_domiciliario_id: null,
          estado: EstadoPedido.EN_PREPARACION,
          tipo_pedido: TipoPedido.DOMICILIO,
          cliente_nombre: 'Cliente X',
          cliente_telefono: null,
          cliente_direccion: null,
          total_estimado: 20,
          descuentos_aplicados: 0,
          notas: 'Notas P2',
          pedidoItems: [
            { nombre: 'Item B', cantidad: 2, notas: 'Nota B' },
          ],
        },
      ]);
    });
  });
  describe('findAll (Leer Pedidos)', () => {
    const mockPedidos: PedidoEntity[] = [
      {
        id: 'p1', establecimiento_id: MOCK_ESTABLECIMIENTO_ID, mesa_id: MOCK_MESA_ID, usuario_creador_id: MOCK_USUARIO_CREADOR_ID,
        usuario_domiciliario_id: null, usuario_cancelador_id: null, estado: EstadoPedido.ABIERTO, tipo_pedido: TipoPedido.MESA,
        cliente_nombre: null, cliente_telefono: null, cliente_direccion: null, total_estimado: 10, descuentos_aplicados: 0, notas: null,
        fecha_hora_pedido: new Date(), fecha_hora_cierre: null, fecha_cancelacion: null, created_at: new Date(), updated_at: new Date(),
        fecha_ultima_actualizacion_relevante_cocina: new Date(), establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any, mesa: { id: MOCK_MESA_ID } as any, usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any,
        usuarioDomiciliario: null as any, usuarioCancelador: null as any, pedidoItems: []
      } as PedidoEntity,
      {
        id: 'p2', establecimiento_id: MOCK_ESTABLECIMIENTO_ID, mesa_id: null, usuario_creador_id: 'another-user-id',
        usuario_domiciliario_id: null, usuario_cancelador_id: null, estado: EstadoPedido.CERRADO, tipo_pedido: TipoPedido.DOMICILIO,
        cliente_nombre: 'Ana', cliente_telefono: '111', cliente_direccion: 'Calle Falsa', total_estimado: 20, descuentos_aplicados: 0, notas: null,
        fecha_hora_pedido: new Date(), fecha_hora_cierre: new Date(), fecha_cancelacion: null, created_at: new Date(), updated_at: new Date(),
        fecha_ultima_actualizacion_relevante_cocina: new Date(), establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any, mesa: null, usuarioCreador: { id: 'another-user-id' } as any,
        usuarioDomiciliario: null as any, usuarioCancelador: null as any, pedidoItems: []
      } as PedidoEntity,
      {
        id: 'p3', establecimiento_id: MOCK_ESTABLECIMIENTO_ID, mesa_id: null, usuario_creador_id: MOCK_USUARIO_CREADOR_ID,
        usuario_domiciliario_id: null, usuario_cancelador_id: null, estado: EstadoPedido.CANCELADO, tipo_pedido: TipoPedido.PARA_LLEVAR,
        cliente_nombre: null, cliente_telefono: null, cliente_direccion: null, total_estimado: 5, descuentos_aplicados: 0, notas: null,
        fecha_hora_pedido: new Date(), fecha_hora_cierre: null, fecha_cancelacion: new Date(), created_at: new Date(), updated_at: new Date(),
        fecha_ultima_actualizacion_relevante_cocina: new Date(), establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any, mesa: null, usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any,
        usuarioDomiciliario: null as any, usuarioCancelador: null as any, pedidoItems: []
      } as PedidoEntity,
      {
        id: 'p4', establecimiento_id: MOCK_ESTABLECIMIENTO_ID, mesa_id: MOCK_MESA_ID_2, usuario_creador_id: MOCK_USUARIO_CREADOR_ID,
        usuario_domiciliario_id: null, usuario_cancelador_id: null, estado: EstadoPedido.EN_PREPARACION, tipo_pedido: TipoPedido.MESA,
        cliente_nombre: null, cliente_telefono: null, cliente_direccion: null, total_estimado: 15, descuentos_aplicados: 0, notas: null,
        fecha_hora_pedido: new Date(), fecha_hora_cierre: null, fecha_cancelacion: null, created_at: new Date(), updated_at: new Date(),
        fecha_ultima_actualizacion_relevante_cocina: new Date(), establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any, mesa: { id: MOCK_MESA_ID_2 } as any, usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any,
        usuarioDomiciliario: null as any, usuarioCancelador: null as any, pedidoItems: []
      } as PedidoEntity,
      {
        id: 'p5', establecimiento_id: MOCK_ESTABLECIMIENTO_ID, mesa_id: MOCK_MESA_ID, usuario_creador_id: MOCK_USUARIO_CREADOR_ID,
        usuario_domiciliario_id: null, usuario_cancelador_id: null, estado: EstadoPedido.PAGADO, tipo_pedido: TipoPedido.MESA,
        cliente_nombre: null, cliente_telefono: null, cliente_direccion: null, total_estimado: 25, descuentos_aplicados: 0, notas: null,
        fecha_hora_pedido: new Date(), fecha_hora_cierre: new Date(), fecha_cancelacion: null, created_at: new Date(), updated_at: new Date(),
        fecha_ultima_actualizacion_relevante_cocina: new Date(), establecimiento: { id: MOCK_ESTABLECIMIENTO_ID } as any, mesa: { id: MOCK_MESA_ID } as any, usuarioCreador: { id: MOCK_USUARIO_CREADOR_ID } as any,
        usuarioDomiciliario: null as any, usuarioCancelador: null as any, pedidoItems: []
      } as PedidoEntity,
    ];

    beforeEach(() => {
      jest.spyOn(pedidoRepository, 'find').mockImplementation(async (options?: any) => {
        let filteredPedidos = mockPedidos.filter(p => p.establecimiento_id === MOCK_ESTABLECIMIENTO_ID);

        if (options && options.where) {
          if (options.where.estado) {
            if (options.where.estado.hasOwnProperty('type') && options.where.estado.type === 'In') {
              const statesToFilter = options.where.estado.values;
              filteredPedidos = filteredPedidos.filter(p => statesToFilter.includes(p.estado));
            } else {
              filteredPedidos = filteredPedidos.filter(p => p.estado === options.where.estado);
            }
          }
          if (options.where.tipo_pedido) {
            filteredPedidos = filteredPedidos.filter(p => p.tipo_pedido === options.where.tipo_pedido);
          }
          if (options.where.mesa_id) {
            filteredPedidos = filteredPedidos.filter(p => p.mesa_id === options.where.mesa_id);
          }
          if (options.where.usuario_creador_id) {
            filteredPedidos = filteredPedidos.filter(p => p.usuario_creador_id === options.where.usuario_creador_id);
          }
        }
        return Promise.resolve(filteredPedidos);
      });
    });
    it('debería retornar todos los pedidos sin importar su estado cuando no se aplican filtros', async () => {
      const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID);
      expect(result).toEqual(mockPedidos);
      expect(pedidoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { establecimiento_id: MOCK_ESTABLECIMIENTO_ID },
        relations: expect.any(Array),
        order: { created_at: 'DESC' },
      }));
    });
    it('debería retornar solo los pedidos pendientes (ABIERTO, EN_PREPARACION, ENVIADO_A_COCINA, LISTO_PARA_ENTREGAR)', async () => {
      const pendingStates = [
        EstadoPedido.ABIERTO,
        EstadoPedido.EN_PREPARACION,
        EstadoPedido.ENVIADO_A_COCINA,
        EstadoPedido.LISTO_PARA_ENTREGAR
      ];
      const pendingPedidos = mockPedidos.filter(p => pendingStates.includes(p.estado));
      const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID, EstadoPedido.ABIERTO);
      expect(result).toEqual(mockPedidos.filter(p => p.estado === EstadoPedido.ABIERTO));
      expect(pedidoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
          estado: EstadoPedido.ABIERTO,
        },
      }));
    });
    it('debería retornar solo los pedidos cancelados', async () => {
      const cancelledPedidos = mockPedidos.filter(p => p.estado === EstadoPedido.CANCELADO);
      jest.spyOn(pedidoRepository, 'find').mockResolvedValueOnce(cancelledPedidos);
      const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID, EstadoPedido.CANCELADO);
      expect(result).toEqual(cancelledPedidos);
      expect(pedidoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
          estado: EstadoPedido.CANCELADO,
        },
      }));
    });
    it('debería retornar solo los pedidos cerrados', async () => {
      const closedPedidos = mockPedidos.filter(p => p.estado === EstadoPedido.CERRADO);
      jest.spyOn(pedidoRepository, 'find').mockResolvedValueOnce(closedPedidos);
      const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID, EstadoPedido.CERRADO);
      expect(result).toEqual(closedPedidos);
      expect(pedidoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
          estado: EstadoPedido.CERRADO,
        },
      }));
    });
    it('debería retornar pedidos filtrados por tipo_pedido', async () => {
      const mesaPedidos = mockPedidos.filter(p => p.tipo_pedido === TipoPedido.MESA);
      jest.spyOn(pedidoRepository, 'find').mockResolvedValueOnce(mesaPedidos);
      const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID, undefined, TipoPedido.MESA);
      expect(result).toEqual(mesaPedidos);
      expect(pedidoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
          tipo_pedido: TipoPedido.MESA,
        },
      }));
    });
    it('debería retornar pedidos filtrados por mesa_id', async () => {
      const pedidosMesa1 = mockPedidos.filter(p => p.mesa_id === MOCK_MESA_ID);
      jest.spyOn(pedidoRepository, 'find').mockResolvedValueOnce(pedidosMesa1);
      const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID, undefined, undefined, MOCK_MESA_ID);
      expect(result).toEqual(pedidosMesa1);
      expect(pedidoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
          mesa_id: MOCK_MESA_ID,
        },
      }));
    });
    it('debería retornar un pedido específico por ID', async () => {
      const expectedPedido = mockPedidos[0];
      jest.spyOn(pedidoRepository, 'findOne').mockResolvedValueOnce(expectedPedido);
      const result = await service.findOne(expectedPedido.id, MOCK_ESTABLECIMIENTO_ID);
      expect(result).toEqual(expectedPedido);
      expect(pedidoRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: expectedPedido.id, establecimiento_id: MOCK_ESTABLECIMIENTO_ID },
      }));
    });
    it('debería lanzar NotFoundException si el pedido no se encuentra en findOne', async () => {
      jest.spyOn(pedidoRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne('non-existent-id', MOCK_ESTABLECIMIENTO_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('debería retornar solo los pedidos creados por un usuario específico', async () => {
      const userPedidos = mockPedidos.filter(p => p.usuario_creador_id === 'another-user-id');
      jest.spyOn(pedidoRepository, 'find').mockResolvedValueOnce(userPedidos);
      const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID, undefined, undefined, undefined, 'another-user-id');
      expect(result).toEqual(userPedidos);
      expect(pedidoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
          usuario_creador_id: 'another-user-id',
        },
      }));
    });
    it('debería retornar pedidos filtrados por combinación de criterios (estado y tipo_pedido)', async () => {
      const filtered = mockPedidos.filter(p => p.estado === EstadoPedido.ABIERTO && p.tipo_pedido === TipoPedido.MESA);
      jest.spyOn(pedidoRepository, 'find').mockResolvedValueOnce(filtered);
      const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID, EstadoPedido.ABIERTO, TipoPedido.MESA);
      expect(result).toEqual(filtered);
      expect(pedidoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
          estado: EstadoPedido.ABIERTO,
          tipo_pedido: TipoPedido.MESA,
        },
      }));
    });
    it('debería retornar un array vacío si no hay pedidos para los filtros', async () => {
      jest.spyOn(pedidoRepository, 'find').mockResolvedValueOnce([]);
      const result = await service.findAll(MOCK_ESTABLECIMIENTO_ID, EstadoPedido.ENTREGADO, TipoPedido.DOMICILIO, 'non-existent-mesa');
      expect(result).toEqual([]);
      expect(pedidoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
          estado: EstadoPedido.ENTREGADO,
          tipo_pedido: TipoPedido.DOMICILIO,
          mesa_id: 'non-existent-mesa',
        },
      }));
    });
  });
});