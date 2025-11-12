import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as request from 'supertest';
import { RoleName } from '../../../common/constants/app.constants';
import { EstablecimientoConfiguracionPedidoEntity } from '../entities/configuracion-pedidos.entity';
import { EstablecimientoConfiguracionPedidoService } from '../configuracion-pedidos.service';
import { EstablecimientoConfiguracionPedidoController } from '../configuracion-pedidos.controller';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateEstablecimientoConfiguracionPedidoDto } from '../dto/create-configuracion-pedidos.dto';
import { UpdateEstablecimientoConfiguracionPedidoDto } from '../dto/update-configuracion-pedidos.dto';
import { AuthGuard } from '@nestjs/passport';
import { EstablecimientoEntity } from '../entities/establecimiento.entity';

import { ClassSerializerInterceptor} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const MOCK_ESTABLECIMIENTO_ID = 'establecimiento-uuid-123';

const mockAdminUser = { userId: 'admin-uuid', establecimientoId: MOCK_ESTABLECIMIENTO_ID, role: RoleName.ADMIN };
const mockSupervisorUser = { userId: 'supervisor-uuid', establecimientoId: MOCK_ESTABLECIMIENTO_ID, role: RoleName.SUPERVISOR };
const mockMeseroUser = { userId: 'mesero-uuid', establecimientoId: MOCK_ESTABLECIMIENTO_ID, role: RoleName.MESERO };
const mockCocineroUser = { userId: 'cocinero-uuid', establecimientoId: MOCK_ESTABLECIMIENTO_ID, role: RoleName.COCINERO };
const mockUnauthorizedUser = { userId: 'unauth-uuid', establecimientoId: MOCK_ESTABLECIMIENTO_ID, role: 'UNKNOWN' };
const baseConfiguracionEntityData = { 
  id: 'config-uuid-abc',
  establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
  limite_cancelacion_preparacion_minutos: 10,
  limite_cancelacion_enviado_cocina_minutos: 5,
  limite_edicion_pedido_minutos: 15,
  created_at: new Date('2025-07-15T12:00:00.000Z'),
  updated_at: new Date('2025-07-15T12:00:00.000Z'),
};

const baseEstablecimientoEntityData = {
  id: MOCK_ESTABLECIMIENTO_ID,
  nombre: 'Establecimiento de Prueba',
  direccion: 'Calle Falsa 123',
  telefono: '555-1234',
  activo: true,
  impuesto_porcentaje: 10.00,
  created_at: new Date('2025-07-15T12:00:00.000Z'),
  updated_at: new Date('2025-07-15T12:00:00.000Z'),
};

const mockEstablecimientoServiceReturn = Object.assign(new EstablecimientoEntity(), baseEstablecimientoEntityData);
const mockConfiguracionServiceReturn = Object.assign(new EstablecimientoConfiguracionPedidoEntity(), baseConfiguracionEntityData);
mockConfiguracionServiceReturn.establecimiento = mockEstablecimientoServiceReturn;
mockEstablecimientoServiceReturn.configuracionPedido = mockConfiguracionServiceReturn;
const mockConfiguracionResponse = {
  id: baseConfiguracionEntityData.id,
  establecimiento_id: baseConfiguracionEntityData.establecimiento_id,
  limite_cancelacion_preparacion_minutos: baseConfiguracionEntityData.limite_cancelacion_preparacion_minutos,
  limite_cancelacion_enviado_cocina_minutos: baseConfiguracionEntityData.limite_cancelacion_enviado_cocina_minutos,
  limite_edicion_pedido_minutos: baseConfiguracionEntityData.limite_edicion_pedido_minutos,
  created_at: baseConfiguracionEntityData.created_at.toISOString(),
  updated_at: baseConfiguracionEntityData.updated_at.toISOString(),
};

describe('EstablecimientoConfiguracionPedidoController (E2E)', () => {
  let app: INestApplication;
  let establecimientoConfiguracionPedidoService: EstablecimientoConfiguracionPedidoService;

  const mockEstablecimientoConfiguracionPedidoService = {
    create: jest.fn(),
    findOneByEstablecimientoId: jest.fn(),
    update: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EstablecimientoConfiguracionPedidoController],
      providers: [
        {
          provide: EstablecimientoConfiguracionPedidoService,
          useValue: mockEstablecimientoConfiguracionPedidoService,
        },
        Reflector,
        {
          provide: 'APP_INTERCEPTOR',
          useClass: ClassSerializerInterceptor,
        },
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue({
        canActivate: (context) => {
            const req = context.switchToHttp().getRequest();
            switch (req.headers['x-user-role']) {
                case RoleName.ADMIN: req.user = mockAdminUser; break;
                case RoleName.SUPERVISOR: req.user = mockSupervisorUser; break;
                case RoleName.MESERO: req.user = mockMeseroUser; break;
                case RoleName.COCINERO: req.user = mockCocineroUser; break;
                default: req.user = mockUnauthorizedUser; break;
            }
            return true;
        },
    })
    .overrideGuard(RolesGuard)
    .useValue({
        canActivate: (context) => {
            const req = context.switchToHttp().getRequest();
            const handler = context.getHandler();
            const requiredRoles = Reflect.getMetadata('roles', handler);
            if (!requiredRoles || requiredRoles.length === 0) {
                return true;
            }
            if (!req.user || !requiredRoles.includes(req.user.role)) {
                return false;
            }
            return true;
        },
    })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    app.useGlobalPipes(new (require('@nestjs/common').ValidationPipe)({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    await app.init();

    establecimientoConfiguracionPedidoService = moduleFixture.get<EstablecimientoConfiguracionPedidoService>(
      EstablecimientoConfiguracionPedidoService,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /establecimientos/:establecimientoId/configuracion-pedidos', () => {
    const createDto: CreateEstablecimientoConfiguracionPedidoDto = {
      limite_cancelacion_preparacion_minutos: 20,
      limite_cancelacion_enviado_cocina_minutos: 10,
      limite_edicion_pedido_minutos: 30,
    };

    it('debería permitir a un ADMIN crear una configuración', async () => {
      const createdEntityMock = Object.assign(new EstablecimientoConfiguracionPedidoEntity(), {
          ...baseConfiguracionEntityData,
          ...createDto, 
          id: 'new-config-uuid',
          created_at: new Date('2025-07-15T12:01:00.000Z'),
          updated_at: new Date('2025-07-15T12:01:00.000Z'),
          establecimiento_id: MOCK_ESTABLECIMIENTO_ID, 
          establecimiento: Object.assign(new EstablecimientoEntity(), { 
              ...baseEstablecimientoEntityData,
              configuracionPedido: undefined,
          }),
      });
      mockEstablecimientoConfiguracionPedidoService.create.mockResolvedValueOnce(createdEntityMock);

      const response = await request(app.getHttpServer())
        .post(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.ADMIN)
        .send(createDto) 
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id', 'new-config-uuid');
      expect(response.body.establecimiento_id).toBe(MOCK_ESTABLECIMIENTO_ID);
      expect(response.body.establecimiento).toBeUndefined(); 
      expect(mockEstablecimientoConfiguracionPedidoService.create).toHaveBeenCalledWith(
        expect.objectContaining({
            establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
            limite_cancelacion_preparacion_minutos: 20,
        }),
      );
      expect(response.body.created_at).toEqual(createdEntityMock.created_at.toISOString());
      expect(response.body.updated_at).toEqual(createdEntityMock.updated_at.toISOString());
    });

    it('debería permitir a un SUPERVISOR crear una configuración', async () => {
      const createdEntityMock = Object.assign(new EstablecimientoConfiguracionPedidoEntity(), {
          ...baseConfiguracionEntityData,
          ...createDto,
          id: 'new-config-uuid-sup',
          created_at: new Date('2025-07-15T12:02:00.000Z'),
          updated_at: new Date('2025-07-15T12:02:00.000Z'),
          establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
          establecimiento: Object.assign(new EstablecimientoEntity(), { ...baseEstablecimientoEntityData, configuracionPedido: undefined }),
      });
      mockEstablecimientoConfiguracionPedidoService.create.mockResolvedValueOnce(createdEntityMock);

      const response = await request(app.getHttpServer())
        .post(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.SUPERVISOR)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id', 'new-config-uuid-sup');
      expect(response.body.establecimiento).toBeUndefined();
      expect(mockEstablecimientoConfiguracionPedidoService.create).toHaveBeenCalled();
      expect(response.body.created_at).toEqual(createdEntityMock.created_at.toISOString());
      expect(response.body.updated_at).toEqual(createdEntityMock.updated_at.toISOString());
    });

    it('no debería permitir a un MESERO crear una configuración y retornar 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.MESERO)
        .send(createDto)
        .expect(HttpStatus.FORBIDDEN);
      expect(mockEstablecimientoConfiguracionPedidoService.create).not.toHaveBeenCalled();
    });

    it('no debería permitir a un usuario sin rol autorizado crear una configuración y retornar 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', mockUnauthorizedUser.role)
        .send(createDto)
        .expect(HttpStatus.FORBIDDEN);
      expect(mockEstablecimientoConfiguracionPedidoService.create).not.toHaveBeenCalled();
    });

    it('debería usar el establecimientoId de la URL incluso si el DTO difiere', async () => {
        const dtoWithWrongId: CreateEstablecimientoConfiguracionPedidoDto = {
            limite_cancelacion_preparacion_minutos: 20,
            limite_cancelacion_enviado_cocina_minutos: 10,
            limite_edicion_pedido_minutos: 30,
        };
        const createdEntityMock = Object.assign(new EstablecimientoConfiguracionPedidoEntity(), {
            ...baseConfiguracionEntityData,
            ...dtoWithWrongId, 
            establecimiento_id: MOCK_ESTABLECIMIENTO_ID, 
            id: 'new-config-corrected',
            created_at: new Date('2025-07-15T12:03:00.000Z'),
            updated_at: new Date('2025-07-15T12:03:00.000Z'),
            establecimiento: Object.assign(new EstablecimientoEntity(), { ...baseEstablecimientoEntityData, configuracionPedido: undefined }),
        });
        mockEstablecimientoConfiguracionPedidoService.create.mockResolvedValueOnce(createdEntityMock);

        const response = await request(app.getHttpServer())
            .post(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
            .set('x-user-role', RoleName.ADMIN)
            .send(dtoWithWrongId) // Envía el DTO sin 'establecimiento_id'
            .expect(HttpStatus.CREATED);

        expect(response.body.establecimiento_id).toBe(MOCK_ESTABLECIMIENTO_ID);
        expect(response.body.establecimiento).toBeUndefined();
        expect(mockEstablecimientoConfiguracionPedidoService.create).toHaveBeenCalledWith(
            expect.objectContaining({ establecimiento_id: MOCK_ESTABLECIMIENTO_ID })
        );
        expect(response.body.created_at).toEqual(createdEntityMock.created_at.toISOString());
        expect(response.body.updated_at).toEqual(createdEntityMock.updated_at.toISOString());
    });
  });

  describe('GET /establecimientos/:establecimientoId/configuracion-pedidos', () => {
    it('debería permitir a un ADMIN obtener la configuración', async () => {
      mockEstablecimientoConfiguracionPedidoService.findOneByEstablecimientoId.mockResolvedValueOnce(mockConfiguracionServiceReturn);

      const response = await request(app.getHttpServer())
        .get(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.ADMIN)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockConfiguracionResponse);
      expect(response.body.establecimiento).toBeUndefined();
      expect(mockEstablecimientoConfiguracionPedidoService.findOneByEstablecimientoId).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID);
    });

    it('debería permitir a un MESERO obtener la configuración', async () => {
      mockEstablecimientoConfiguracionPedidoService.findOneByEstablecimientoId.mockResolvedValueOnce(mockConfiguracionServiceReturn);
      const response = await request(app.getHttpServer())
        .get(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.MESERO)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual(mockConfiguracionResponse);
      expect(response.body.establecimiento).toBeUndefined();
      expect(mockEstablecimientoConfiguracionPedidoService.findOneByEstablecimientoId).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID);
    });

    it('debería permitir a un COCINERO obtener la configuración', async () => {
      mockEstablecimientoConfiguracionPedidoService.findOneByEstablecimientoId.mockResolvedValueOnce(mockConfiguracionServiceReturn);

      const response = await request(app.getHttpServer())
        .get(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.COCINERO)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual(mockConfiguracionResponse);
      expect(response.body.establecimiento).toBeUndefined();
      expect(mockEstablecimientoConfiguracionPedidoService.findOneByEstablecimientoId).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID);
    });

    it('debería retornar 404 NotFoundException si la configuración no existe', async () => {
      mockEstablecimientoConfiguracionPedidoService.findOneByEstablecimientoId.mockRejectedValueOnce(
        new NotFoundException(`Configuración de pedido para el establecimiento ${MOCK_ESTABLECIMIENTO_ID} no encontrada.`),
      );

      await request(app.getHttpServer())
        .get(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.ADMIN)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Configuración de pedido para el establecimiento ${MOCK_ESTABLECIMIENTO_ID} no encontrada.`,
          error: 'Not Found',
        });
    });
  });

  describe('PUT /establecimientos/:establecimientoId/configuracion-pedidos', () => {
    const updateDto: UpdateEstablecimientoConfiguracionPedidoDto = {
      limite_cancelacion_preparacion_minutos: 25,
      limite_edicion_pedido_minutos: 40,
    };
    const updatedEntityServiceReturn = Object.assign(new EstablecimientoConfiguracionPedidoEntity(), {
        ...baseConfiguracionEntityData,
        ...updateDto,
        updated_at: new Date('2025-07-15T12:04:00.000Z'),
        establecimiento_id: MOCK_ESTABLECIMIENTO_ID,
        establecimiento: Object.assign(new EstablecimientoEntity(), { ...baseEstablecimientoEntityData, configuracionPedido: undefined }),
    });

    const updatedConfigResponse = {
      ...mockConfiguracionResponse,
      ...updateDto,
      updated_at: updatedEntityServiceReturn.updated_at.toISOString(),
    };


    it('debería permitir a un ADMIN actualizar una configuración', async () => {
      mockEstablecimientoConfiguracionPedidoService.update.mockResolvedValueOnce(updatedEntityServiceReturn);

      const response = await request(app.getHttpServer())
        .put(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.ADMIN)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(updatedConfigResponse);
      expect(response.body.establecimiento).toBeUndefined();
      expect(mockEstablecimientoConfiguracionPedidoService.update).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, updateDto);
    });

    it('debería permitir a un SUPERVISOR actualizar una configuración', async () => {
      mockEstablecimientoConfiguracionPedidoService.update.mockResolvedValueOnce(updatedEntityServiceReturn);
      const response = await request(app.getHttpServer())
        .put(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.SUPERVISOR)
        .send(updateDto)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual(updatedConfigResponse);
      expect(response.body.establecimiento).toBeUndefined();
      expect(mockEstablecimientoConfiguracionPedidoService.update).toHaveBeenCalledWith(MOCK_ESTABLECIMIENTO_ID, updateDto);
    });

    it('no debería permitir a un MESERO actualizar una configuración y retornar 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .put(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.MESERO)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN);

      expect(mockEstablecimientoConfiguracionPedidoService.update).not.toHaveBeenCalled();
    });

    it('debería retornar 404 NotFoundException si la configuración a actualizar no existe', async () => {
      mockEstablecimientoConfiguracionPedidoService.update.mockRejectedValueOnce(
        new NotFoundException(`Configuración de pedido para el establecimiento ${MOCK_ESTABLECIMIENTO_ID} no encontrada.`),
      );
      await request(app.getHttpServer())
        .put(`/establecimientos/${MOCK_ESTABLECIMIENTO_ID}/configuracion-pedidos`)
        .set('x-user-role', RoleName.ADMIN)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Configuración de pedido para el establecimiento ${MOCK_ESTABLECIMIENTO_ID} no encontrada.`,
          error: 'Not Found',
        });
    });
  });
});
