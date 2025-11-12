import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, EntityManager, In, Not, Repository } from 'typeorm';
import { PedidoEntity } from './entities/pedido.entity';
import { EstadoPedido } from './entities/pedido.entity';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PedidoItemEntity, TipoProductoPedido } from './entities/pedido-item.entity';
import { EstadoCocina } from './entities/pedido-item.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MesaEntity } from '../mesas/entities/mesa.entity';
import { EstadoMesa } from '../mesas/entities/mesa.entity';
import { TipoPedido } from './entities/pedido.entity';
import { RoleName } from 'src/common/constants/app.constants';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfDay } from 'date-fns';
import { UpdatePedidoItemDto, } from './dto/update-pedido-item.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RolesService } from '../roles/roles.service';
import { ProductosService } from '../productos/productos.service';
import { EstablecimientosService } from '../establecimientos/establecimientos.service';
import { WebSocketEventsService } from 'src/websocket/services/websocket-events.service';
import { EstablecimientoConfiguracionPedidoService } from '../establecimientos/configuracion-pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { IngredientesService } from '../ingredientes/ingredientes.service';
import { CreatePedidoItemDto } from './dto/create-pedido-item.dto';
import { MesasService } from '../mesas/mesas.service';
import { FacturaPedidoEntity } from '../facturas/entities/factura-pedido.entity';
import { ImpresionService } from '../impresion/impresion.service';
import { instanceToPlain } from 'class-transformer'; 
const EPSILON = 0.01;
@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(PedidoEntity)
    private readonly pedidoRepository: Repository<PedidoEntity>,
    @InjectRepository(PedidoItemEntity)
    private readonly pedidoItemRepository: Repository<PedidoItemEntity>,
    private readonly establecimientosService: EstablecimientosService,
    @Inject(forwardRef(() => MesasService))
    private readonly mesasService: MesasService,
    private readonly productosService: ProductosService,
    private readonly usuariosService: UsuariosService,
    private readonly websocketEventsService: WebSocketEventsService,
    private readonly rolesService: RolesService,
    private readonly establecimientoConfiguracionPedidoService: EstablecimientoConfiguracionPedidoService,
    private readonly ingredientesService: IngredientesService,
    @InjectRepository(FacturaPedidoEntity)
    private readonly facturaPedidoRepository: Repository<FacturaPedidoEntity>,
    private readonly impresionService: ImpresionService,
    private dataSource: DataSource,
  ) { }
  private async calcularTotalEstimado(
    items: (CreatePedidoItemDto | PedidoItemEntity)[],
    establecimientoId: string,
  ): Promise<number> {
    let total = 0;
    for (const item of items) {
      if ((item as PedidoItemEntity).precio_unitario_al_momento_venta !== undefined) {
        total += (item as PedidoItemEntity).precio_unitario_al_momento_venta * item.cantidad;
        continue;
      }
      const itemDto = item as CreatePedidoItemDto;
      let precioUnitario: number;
      if (itemDto.tipo_producto === TipoProductoPedido.SIMPLE) {
        const productoSimple = await this.productosService.findOne(itemDto.producto_id!, establecimientoId);
        if (!productoSimple || !productoSimple.activo) {
          throw new BadRequestException(`Producto simple "${itemDto.producto_id}" no encontrado o no disponible.`);
        }
        precioUnitario = Number(productoSimple.precio);
      } else if (itemDto.tipo_producto === TipoProductoPedido.CONFIGURABLE) {
        const productoConfigurableInfo = await this.productosService.resolveConfigurableProductInfo(
          itemDto.producto_configurable_id!,
          establecimientoId,
          itemDto.configuracion_json!,
        );
        precioUnitario = productoConfigurableInfo.precio;
      } else {
        throw new BadRequestException('Tipo de producto no válido.');
      }

      total += precioUnitario * itemDto.cantidad;
    }
    return total;
  }


  public async create(
    createPedidoDto: CreatePedidoDto,
    usuarioCreadorId: string,
    establecimientoId: string,
  ): Promise<PedidoEntity> {
    const {
      mesa_id,
      tipo_pedido,
      pedidoItems,
      cliente_nombre,
      cliente_telefono,
      cliente_direccion,
      notas,
    } = createPedidoDto;
    if (!pedidoItems || pedidoItems.length === 0) {
      throw new BadRequestException('El pedido debe contener al menos un ítem.');
    }
    try {
      await this.establecimientosService.findOne(establecimientoId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Establecimiento con ID "${establecimientoId}" no encontrado para crear el pedido.`);
      }
      throw error;
    }
    await this.usuariosService.findOne(usuarioCreadorId, establecimientoId);
    if (tipo_pedido === TipoPedido.MESA) {
      if (!mesa_id) {
        throw new BadRequestException('Para pedidos de mesa, el ID de la mesa es obligatorio.');
      }
      const mesa = await this.mesasService.findOne(mesa_id, establecimientoId);
      if (!mesa) {
        throw new NotFoundException(`Mesa con ID "${mesa_id}" no encontrada.`);
      }
      if (mesa.estado === EstadoMesa.OCUPADA) {
        throw new ConflictException(`La mesa ${mesa.numero} ya está ocupada.`);
      }
      if (cliente_nombre || cliente_telefono || cliente_direccion) {
        throw new BadRequestException('Los datos de cliente (nombre, teléfono, dirección) no son aplicables para pedidos de mesa.');
      }
    } else if (tipo_pedido === TipoPedido.DOMICILIO) {
      if (!cliente_nombre || !cliente_telefono || !cliente_direccion) {
        throw new BadRequestException('Para pedidos a domicilio, el nombre, teléfono y dirección del cliente son obligatorios.');
      }
    }
    const preprocessedItems: {
      producto_id?: string | null;
      producto_configurable_id?: string | null;
      configuracion_json?: any;
      cantidad: number;
      precio_unitario_al_momento_venta: number;
      notas_item?: string;
      tipo_producto: TipoProductoPedido;
    }[] = [];
    for (const itemDto of pedidoItems) {
      if (itemDto.cantidad <= 0) {
        throw new BadRequestException('La cantidad mínima para un ítem de pedido es 1.');
      }
      let precioUnitario: number;
      if (itemDto.tipo_producto === TipoProductoPedido.SIMPLE) {
        const productoSimple = await this.productosService.findOne(itemDto.producto_id!, establecimientoId);
        if (!productoSimple || !productoSimple.activo) {
          throw new BadRequestException(`El producto "${itemDto.producto_id}" no está disponible.`);
        }
        precioUnitario = Number(productoSimple.precio);
      } else if (itemDto.tipo_producto === TipoProductoPedido.CONFIGURABLE) {
        const productoConfigurableInfo = await this.productosService.resolveConfigurableProductInfo(
          itemDto.producto_configurable_id!,
          establecimientoId,
          itemDto.configuracion_json!,
        );
        precioUnitario = productoConfigurableInfo.precio;
      } else {
        throw new BadRequestException('Tipo de producto no válido.');
      }
      preprocessedItems.push({
        tipo_producto: itemDto.tipo_producto,
        producto_id: itemDto.tipo_producto === TipoProductoPedido.SIMPLE ? itemDto.producto_id : null,
        producto_configurable_id: itemDto.tipo_producto === TipoProductoPedido.CONFIGURABLE ? itemDto.producto_configurable_id : null,
        configuracion_json: itemDto.configuracion_json || null,
        cantidad: itemDto.cantidad,
        precio_unitario_al_momento_venta: precioUnitario,
        notas_item: itemDto.notas_item,
      });
    }
    const totalEstimado = await this.calcularTotalEstimado(preprocessedItems, establecimientoId);
    const MAX_RETRIES = 3;
    let retries = 0;
    while (retries < MAX_RETRIES) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const now = new Date();
        const startOfToday = startOfDay(now);
        const ultimoPedidoHoy = await queryRunner.manager
          .createQueryBuilder(PedidoEntity, 'pedido')
          .where('pedido.created_at >= :startOfToday', { startOfToday })
          .andWhere('pedido.establecimiento_id = :establecimientoId', { establecimientoId })
          .orderBy('pedido.created_at', 'DESC')
          .getOne();
        let nextNumero = 1;
        if (ultimoPedidoHoy && ultimoPedidoHoy.numero_secuencial_diario) {
          nextNumero = ultimoPedidoHoy.numero_secuencial_diario + 1;
        }
        const codigoPedido = `PED-${format(now, 'yyyyMMdd')}-${String(nextNumero).padStart(3, '0')}`;
        const pedido: PedidoEntity = this.pedidoRepository.create({
          establecimiento_id: establecimientoId,
          mesa_id: mesa_id || null,
          usuario_creador_id: usuarioCreadorId,
          tipo_pedido,
          total_estimado: totalEstimado,
          cliente_nombre: cliente_nombre || null,
          cliente_telefono: cliente_telefono || null,
          cliente_direccion: cliente_direccion || null,
          notas: notas || null,
          fecha_ultima_actualizacion_relevante_cocina: now,
          numero_secuencial_diario: nextNumero,
          codigo_pedido: codigoPedido,
        });
        const savedPedido: PedidoEntity = await queryRunner.manager.save(PedidoEntity, pedido);
        const pedidoItemsEntities = preprocessedItems.map((item) =>
          this.pedidoItemRepository.create({
            id: uuidv4(),
            pedido_id: savedPedido.id,
            producto_id: item.producto_id || null,
            producto_configurable_id: item.producto_configurable_id || null,
            configuracion_json: item.configuracion_json || null,
            cantidad: item.cantidad,
            precio_unitario_al_momento_venta: item.precio_unitario_al_momento_venta,
            notas_item: item.notas_item,
            estado_cocina: EstadoCocina.PENDIENTE,
            fecha_hora_estado_cocina_cambio: now,
          }),
        );
        await queryRunner.manager.save(PedidoItemEntity, pedidoItemsEntities);
        for (const itemDto of preprocessedItems) {
          let recetaConsolidada: { [ingredienteId: string]: number } = {};

          if (itemDto.tipo_producto === TipoProductoPedido.SIMPLE) {
            recetaConsolidada = await this.productosService.obtenerRecetaDeProductoSimple(
              itemDto.producto_id!,
              establecimientoId
            );
          } else if (itemDto.tipo_producto === TipoProductoPedido.CONFIGURABLE) {
            const info = await this.productosService.resolveConfigurableProductInfo(
              itemDto.producto_configurable_id!,
              establecimientoId,
              itemDto.configuracion_json!,
            );
            recetaConsolidada = info.receta;
          }
          if (Object.keys(recetaConsolidada).length > 0) {
            await this.ingredientesService.reducirStockPorReceta(
              recetaConsolidada,
              itemDto.cantidad,
              queryRunner.manager,
              establecimientoId
            );
          }
        }
        if (savedPedido.mesa_id) {
          await queryRunner.manager.update(MesaEntity, savedPedido.mesa_id, {
            estado: EstadoMesa.OCUPADA,
          });
        }
        await queryRunner.commitTransaction();
        this.websocketEventsService.emitPedidoCreated(establecimientoId, savedPedido.id);
        const pedidoCompleto = await this.findOne(savedPedido.id, establecimientoId);
        if (pedidoCompleto) {
          //     const pedidoLimpio = instanceToPlain(pedidoCompleto); 
          // (async () => {
          //   try {
          //     await this.impresionService.enviarComandaAImpresora(pedidoCompleto);
          //   } catch (error) {
          //     console.error(
          //       `Error al imprimir comanda del pedido ${pedidoCompleto.id}:`,
          //       error,
          //     );
          //   }
          // })();
        }
        return pedidoCompleto as PedidoEntity;

      } catch (err: any) {
        await queryRunner.rollbackTransaction();
        if (err.code === 'ER_LOCK_WAIT_TIMEOUT' && retries < MAX_RETRIES - 1) {
          console.warn(`Se excedió el tiempo de espera de bloqueo, reintentando la transacción...  (${retries + 1}/${MAX_RETRIES})`);
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 100 * retries));
        } else {
          throw err;
        }
      } finally {
        await queryRunner.release();
      }
    }
    throw new Error('Fallo al crear el pedido después de múltiples reintentos debido a un tiempo de espera de bloqueo.');
  }





  public async findAll(
    establecimientoId: string,
    estados?: EstadoPedido[],
    tipoPedido?: TipoPedido,
    mesaId?: string,
    usuarioCreadorId?: string,
    usuarioDomiciliarioId?: string,
  ): Promise<PedidoEntity[]> {
    const establecimiento = await this.establecimientosService.findOne(
      establecimientoId,
    );
    if (!establecimiento) {
      throw new NotFoundException(
        `Establecimiento con ID "${establecimientoId}" no encontrado.`,
      );
    }
    const whereCondition: any = { establecimiento_id: establecimientoId };
    if (estados && estados.length > 0) {
      whereCondition.estado = In(estados);
    } else if (estados !== undefined) {
      whereCondition.estado = null;
    }
    if (tipoPedido) whereCondition.tipo_pedido = tipoPedido;
    if (mesaId) whereCondition.mesa_id = mesaId;
    if (usuarioCreadorId) whereCondition.usuario_creador_id = usuarioCreadorId;
    if (usuarioDomiciliarioId) whereCondition.usuario_domiciliario_id = usuarioDomiciliarioId;
    return await this.pedidoRepository.find({
      where: whereCondition,
      relations: [
        'establecimiento',
        'mesa',
        'usuarioCreador',
        'usuarioDomiciliario',
        'usuarioCancelador',
        'pedidoItems',
        'pedidoItems.producto',
      ],
      order: { created_at: 'DESC' },
    });
  }


public async findOne(
    id: string,
    establecimientoId: string,
): Promise<PedidoEntity | null> {
    const pedido = await this.pedidoRepository.findOne({
        where: { id, establecimiento_id: establecimientoId },
        relations: [
            'establecimiento', 
            'mesa', 
            'usuarioCreador',
            'usuarioDomiciliario',
            'usuarioCancelador',
            'pedidoItems', 
            'pedidoItems.producto',
            'pedidoItems.productoConfigurable', 
            'pedidoItems.producto.categoria', 
        ],
    });
    return pedido;
}








  public async findAllWithOR(whereCondition: { establecimiento_id: string; tipo_pedido: TipoPedido; or: any[] }): Promise<PedidoEntity[]> {
    const queryBuilder = this.pedidoRepository.createQueryBuilder("pedido")
      .where("pedido.establecimiento_id = :establecimientoId", { establecimientoId: whereCondition.establecimiento_id })
      .andWhere("pedido.tipo_pedido = :tipoPedido", { tipoPedido: whereCondition.tipo_pedido });
    const orConditions = whereCondition.or.map(condition => {
      if (condition.estado) return "pedido.estado = :estado";
      if (condition.usuario_domiciliario_id) return "pedido.usuario_domiciliario_id = :usuarioId";
    }).join(" OR ");
    queryBuilder.andWhere(`(${orConditions})`, {
      estado: whereCondition.or.find(c => c.estado)?.estado,
      usuarioId: whereCondition.or.find(c => c.usuario_domiciliario_id)?.usuario_domiciliario_id
    });
    queryBuilder.leftJoinAndSelect("pedido.establecimiento", "establecimiento")
      .leftJoinAndSelect("pedido.mesa", "mesa")
      .leftJoinAndSelect("pedido.usuarioCreador", "usuarioCreador")
      .leftJoinAndSelect("pedido.usuarioDomiciliario", "usuarioDomiciliario")
      .leftJoinAndSelect("pedido.usuarioCancelador", "usuarioCancelador")
      .leftJoinAndSelect("pedido.pedidoItems", "pedidoItems")
      .leftJoinAndSelect("pedidoItems.producto", "producto");
    return queryBuilder.orderBy("pedido.created_at", "DESC").getMany();
  }
  public async findPedidoByFacturaId(facturaId: string): Promise<PedidoEntity | null> {
    const facturaPedido = await this.facturaPedidoRepository.findOne({
      where: { factura_id: facturaId },
    });

    if (!facturaPedido) {
      return null;
    }
    return this.pedidoRepository.findOne({
      where: { id: facturaPedido.pedido_id },
      relations: ['pedidoItems', 'pedidoItems.producto'],
    });
  }




  public async update(
    id: string,
    updatePedidoDto: UpdatePedidoDto,
    establecimientoId: string,
    usuarioActuanteId: string,
  ): Promise<PedidoEntity> {
    const { pedidoItems, mesa_id, tipo_pedido, ...rest } = updatePedidoDto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const now = new Date();
      const pedido = await queryRunner.manager.findOne(PedidoEntity, {
        where: { id, establecimiento_id: establecimientoId },
        relations: [
          'pedidoItems',
          'pedidoItems.producto',
          'pedidoItems.producto.categoria',
          'pedidoItems.productoConfigurable',
        ],
      });
      if (!pedido) {
        throw new NotFoundException(`Pedido con ID "${id}" no encontrado en el establecimiento "${establecimientoId}".`);
      }
      if (pedidoItems && pedidoItems.length > 0) {
        const itemsToDelete = pedido.pedidoItems.filter(
          existingItem => !pedidoItems.some(dto => dto.id === existingItem.id)
        );
        if ((pedido.pedidoItems.length - itemsToDelete.length) === 0 && pedidoItems.length === 0) {
          throw new BadRequestException('Un pedido debe contener al menos un producto. No se puede eliminar el último ítem.');
        }
      } else if (pedido.pedidoItems.length > 0) {
        throw new BadRequestException('Un pedido debe contener al menos un producto. No se puede eliminar el último ítem.');
      }
      const configPedido = await this.establecimientoConfiguracionPedidoService.findOneByEstablecimientoId(establecimientoId);
      const LIMITE_EDICION_PEDIDO_MIN = configPedido?.limite_edicion_pedido_minutos ?? Infinity;
      const usuarioActuante = await this.usuariosService.findOne(usuarioActuanteId, establecimientoId);
      if (!usuarioActuante || !usuarioActuante.rol_id) {
        throw new NotFoundException('Usuario actuante no encontrado o sin rol asignado.');
      }
      const userRole = await this.rolesService.findOne(usuarioActuante.rol_id);
      if (!userRole) {
        throw new NotFoundException(`Rol con ID "${usuarioActuante.rol_id}" no encontrado.`);
      }
      const esAdminSupervisor = userRole.nombre === RoleName.ADMIN || userRole.nombre === RoleName.SUPERVISOR;
      if (
        pedido.estado !== EstadoPedido.ABIERTO &&
        pedido.estado !== EstadoPedido.EN_PREPARACION &&
        pedido.estado !== EstadoPedido.ENVIADO_A_COCINA &&
        pedido.estado !== EstadoPedido.LISTO_PARA_ENTREGAR
      ) {
        throw new BadRequestException(`No se puede actualizar un pedido en estado "${pedido.estado}". Solo se pueden editar pedidos 'ABIERTO', 'EN_PREPARACION', 'LISTO_PARA_ENTREGAR' o 'ENVIADO_A_COCINA'.`);
      }
      if (pedido.estado === EstadoPedido.EN_PREPARACION || pedido.estado === EstadoPedido.ENVIADO_A_COCINA) {
        const lastRelevantTime = pedido.fecha_ultima_actualizacion_relevante_cocina || pedido.created_at;
        const diffMinutes = (now.getTime() - new Date(lastRelevantTime).getTime()) / (1000 * 60);
        if (diffMinutes > LIMITE_EDICION_PEDIDO_MIN && !esAdminSupervisor) {
          throw new BadRequestException(`El tiempo para editar este pedido ha expirado para tu rol. Límite: ${LIMITE_EDICION_PEDIDO_MIN} minutos.`);
        }
      }
      if (tipo_pedido && tipo_pedido !== pedido.tipo_pedido) {
        const oldTipoPedido = pedido.tipo_pedido;
        pedido.tipo_pedido = tipo_pedido;
        if (oldTipoPedido === TipoPedido.MESA && pedido.mesa_id) {
          await queryRunner.manager.update(MesaEntity, pedido.mesa_id, { estado: EstadoMesa.LIBRE });
          this.websocketEventsService.emitMesaStatusUpdated(establecimientoId, pedido.mesa_id, EstadoMesa.LIBRE);
          pedido.mesa_id = null;
        } else if (tipo_pedido === TipoPedido.MESA) {
          if (!mesa_id) {
            throw new BadRequestException('Para cambiar el tipo de pedido a MESA, el ID de la mesa es obligatorio.');
          }
          const newMesa = await this.mesasService.findOne(mesa_id, establecimientoId);
          if (!newMesa) {
            throw new NotFoundException(`Nueva mesa con ID "${mesa_id}" no encontrada.`);
          }
          if (newMesa.estado === EstadoMesa.OCUPADA) {
            throw new ConflictException(`La nueva mesa ${newMesa.numero} ya está ocupada.`);
          }
          pedido.mesa_id = mesa_id;
          await queryRunner.manager.update(MesaEntity, newMesa.id, { estado: EstadoMesa.OCUPADA });
          this.websocketEventsService.emitMesaStatusUpdated(establecimientoId, newMesa.id, EstadoMesa.OCUPADA);
        } else {
          pedido.mesa_id = null;
        }
        if (tipo_pedido === TipoPedido.DOMICILIO) {
          if (!updatePedidoDto.cliente_nombre || !updatePedidoDto.cliente_telefono || !updatePedidoDto.cliente_direccion) {
            throw new BadRequestException('Para cambiar el tipo de pedido a DOMICILIO, el nombre, teléfono y dirección del cliente son obligatorios.');
          }
          pedido.cliente_nombre = updatePedidoDto.cliente_nombre;
          pedido.cliente_telefono = updatePedidoDto.cliente_telefono;
          pedido.cliente_direccion = updatePedidoDto.cliente_direccion;
        } else {
          pedido.cliente_nombre = null;
          pedido.cliente_telefono = null;
          pedido.cliente_direccion = null;
        }
      } else if (mesa_id && pedido.tipo_pedido === TipoPedido.MESA && pedido.mesa_id !== mesa_id) {
        const oldMesaId = pedido.mesa_id;
        const newMesa = await this.mesasService.findOne(mesa_id, establecimientoId);
        if (!newMesa) {
          throw new NotFoundException(`Nueva mesa con ID "${mesa_id}" no encontrada.`);
        }
        if (newMesa.estado === EstadoMesa.OCUPADA) {
          throw new ConflictException(`La nueva mesa ${newMesa.numero} ya está ocupada.`);
        }
        pedido.mesa_id = mesa_id;
        await queryRunner.manager.update(MesaEntity, newMesa.id, { estado: EstadoMesa.OCUPADA });
        if (oldMesaId) {
          const otherActiveOrdersOnOldTable = await queryRunner.manager.count(PedidoEntity, {
            where: {
              mesa_id: oldMesaId,
              establecimiento_id: establecimientoId,
              estado: Not(In([EstadoPedido.CERRADO, EstadoPedido.PAGADO, EstadoPedido.CANCELADO])),
              id: Not(pedido.id),
            },
          });
          if (otherActiveOrdersOnOldTable === 0) {
            await queryRunner.manager.update(MesaEntity, oldMesaId, { estado: EstadoMesa.LIBRE });
          }
        }
      }
      Object.assign(pedido, rest);
      pedido.updated_at = now;
      const itemsToSave: PedidoItemEntity[] = [];
      const newItemsIds: string[] = [];
      const itemsToDeleteIds: string[] = [];
      if (pedidoItems) {
        for (const existingItem of pedido.pedidoItems) {
          const isPresentInUpdate = pedidoItems.some(itemDto => itemDto.id === existingItem.id);
          if (!isPresentInUpdate) {
            itemsToDeleteIds.push(existingItem.id);
          }
        }
        if (itemsToDeleteIds.length > 0) {
          await queryRunner.manager.delete(PedidoItemEntity, itemsToDeleteIds);
        }
        for (const itemDto of pedidoItems) {
          if (itemDto.id) {
            const existingItem = pedido.pedidoItems.find(i => i.id === itemDto.id);
            if (!existingItem) {
              throw new NotFoundException(`Ítem de pedido con ID "${itemDto.id}" no encontrado en este pedido.`);
            }
            const esBebida = existingItem.producto?.categoria?.es_bebida || existingItem.productoConfigurable?.categoria?.es_bebida;
            const isBeverageAndReady = esBebida && existingItem.estado_cocina === EstadoCocina.LISTO;
            const quantityChanged = itemDto.cantidad !== undefined && itemDto.cantidad !== existingItem.cantidad;
            const notesChanged = itemDto.notas_item !== undefined && itemDto.notas_item !== existingItem.notas_item;
            if (isBeverageAndReady && (quantityChanged || notesChanged)) {
              throw new BadRequestException('Las bebidas en estado LISTO no pueden ser modificadas (cantidad o notas).');
            }
            if (itemDto.estado_cocina !== undefined && itemDto.estado_cocina !== existingItem.estado_cocina) {
              const usuario = await this.usuariosService.findOne(usuarioActuanteId, establecimientoId);
              if (!usuario || !usuario.rol_id) throw new NotFoundException('Usuario actuante no encontrado o sin rol asignado.');
              const userRole = await this.rolesService.findOne(usuario.rol_id);
              if (!userRole) throw new NotFoundException(`Rol con ID "${usuario.rol_id}" no encontrado.`);
              if (userRole.nombre !== RoleName.COCINERO && userRole.nombre !== RoleName.ADMIN && userRole.nombre !== RoleName.SUPERVISOR) {
                throw new ForbiddenException('Solo cocineros, supervisores o administradores pueden cambiar el estado de cocina.');
              }
              if (esBebida) {
                if (existingItem.estado_cocina === EstadoCocina.LISTO && itemDto.estado_cocina === EstadoCocina.PENDIENTE) throw new BadRequestException('Las bebidas en estado LISTO no pueden volver a PENDIENTE.');
                if (existingItem.estado_cocina === EstadoCocina.PENDIENTE && itemDto.estado_cocina === EstadoCocina.EN_PREPARACION) throw new BadRequestException('Las bebidas no pasan por el estado EN_PREPARACION.');
                if (existingItem.estado_cocina === EstadoCocina.PENDIENTE && itemDto.estado_cocina === EstadoCocina.ENVIADO_A_COCINA) throw new BadRequestException('Las bebidas no pasan por el estado ENVIADO_A_COCINA.');
              }
            }
            const updatedProperties: any = { updated_at: now };
            let hasChanged = false;
            if (itemDto.cantidad !== undefined) {
              updatedProperties.cantidad = itemDto.cantidad;
              if (itemDto.estado_cocina === undefined) {
                updatedProperties.estado_cocina = EstadoCocina.PENDIENTE;
                updatedProperties.fecha_hora_estado_cocina_cambio = now;
              }
              hasChanged = true;
            }
            if (itemDto.notas_item !== undefined) {
              updatedProperties.notas_item = itemDto.notas_item;
              hasChanged = true;
            }
            if (itemDto.estado_cocina !== undefined) {
              updatedProperties.estado_cocina = itemDto.estado_cocina;
              updatedProperties.fecha_hora_estado_cocina_cambio = now;
              hasChanged = true;
            }
            if (hasChanged) {
              await queryRunner.manager.update(PedidoItemEntity, { id: existingItem.id }, updatedProperties);
              Object.assign(existingItem, updatedProperties);
              itemsToSave.push(existingItem);
            }
          } else {
            if (itemDto.cantidad <= 0) {
              throw new BadRequestException(`La cantidad del nuevo ítem debe ser al menos 1.`);
            }
            let precioUnitario: number;
            if (itemDto.tipo_producto === TipoProductoPedido.SIMPLE) {
              const producto = await this.productosService.findOne(itemDto.producto_id!, establecimientoId);
              if (!producto || !producto.activo) {
                throw new NotFoundException(`Producto con ID "${itemDto.producto_id}" no encontrado o no disponible para el nuevo ítem.`);
              }
              precioUnitario = Number(producto.precio);
            } else if (itemDto.tipo_producto === TipoProductoPedido.CONFIGURABLE) {
              const productoConfigurableInfo = await this.productosService.resolveConfigurableProductInfo(
                itemDto.producto_configurable_id!,
                establecimientoId,
                itemDto.configuracion_json!,
              );
              precioUnitario = productoConfigurableInfo.precio;
            } else {
              throw new BadRequestException('Tipo de producto no válido para el nuevo ítem.');
            }
            const newItem = this.pedidoItemRepository.create({
              id: uuidv4(),
              pedido_id: pedido.id,
              producto_id: itemDto.tipo_producto === TipoProductoPedido.SIMPLE ? itemDto.producto_id : null,
              producto_configurable_id: itemDto.tipo_producto === TipoProductoPedido.CONFIGURABLE ? itemDto.producto_configurable_id : null,
              configuracion_json: itemDto.configuracion_json,
              cantidad: itemDto.cantidad,
              precio_unitario_al_momento_venta: precioUnitario,
              notas_item: itemDto.notas_item,
              estado_cocina: EstadoCocina.PENDIENTE,
              fecha_hora_estado_cocina_cambio: now,
            });
            await queryRunner.manager.save(PedidoItemEntity, newItem);
            itemsToSave.push(newItem);
            newItemsIds.push(newItem.id);
            pedido.pedidoItems.push(newItem);
          }
        }
      }
      pedido.pedidoItems = pedido.pedidoItems.filter(item => !itemsToDeleteIds.includes(item.id));
      pedido.pedidoItems = [...pedido.pedidoItems, ...itemsToSave];
      const updatedPedidoItems = await queryRunner.manager.find(
        PedidoItemEntity,
        { where: { pedido_id: pedido.id } },
      );

      pedido.total_estimado = await this.calcularTotalEstimado(
        updatedPedidoItems as (CreatePedidoItemDto | PedidoItemEntity)[],
        establecimientoId,
      );
      pedido.fecha_ultima_actualizacion_relevante_cocina = now;
      const savedPedido = await queryRunner.manager.save(PedidoEntity, pedido);
      await queryRunner.commitTransaction();
      const pedidoFinal = await this.findOne(savedPedido.id, establecimientoId);
      if (!pedidoFinal) {
        throw new NotFoundException('El pedido no fue encontrado después de la actualización.');
      }

      this.websocketEventsService.emitPedidoUpdated(
        establecimientoId,
        id,
        pedidoFinal,
      );
      if (pedidoItems) {
        for (const item of itemsToSave) {
          if (newItemsIds.includes(item.id)) {
            this.websocketEventsService.emitPedidoItemCreated(
              establecimientoId,
              id,
              item,
            );
          } else {
            this.websocketEventsService.emitPedidoItemUpdated(
              establecimientoId,
              id,
              item,
            );
          }
        }
      }

      return pedidoFinal;

    } catch (err) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }
  public async updatePedidoStatus(
    id: string,
    newStatus: EstadoPedido,
    establecimientoId: string,
    usuarioActuanteId: string,
    manager?: EntityManager,
  ): Promise<PedidoEntity> {
    const isExternalTransaction = !!manager;
    const finalManager = manager || this.dataSource.manager;
    const queryRunner = !isExternalTransaction ? this.dataSource.createQueryRunner() : null;
    if (queryRunner) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }
    try {
      const pedido = await finalManager.findOne(PedidoEntity, {
        where: { id, establecimiento_id: establecimientoId },
        relations: ['pedidoItems', 'pedidoItems.producto', 'pedidoItems.producto.categoria'],
      });

      if (!pedido) {
        throw new NotFoundException(
          `Pedido con ID "${id}" no encontrado en el establecimiento "${establecimientoId}".`,
        );
      }
      if (
        [EstadoPedido.CANCELADO, EstadoPedido.PAGADO].includes(
          pedido.estado,
        )
      ) {
        throw new BadRequestException(
          `No se puede cambiar el estado de un pedido que ya está en estado "${pedido.estado}".`,
        );
      }

      const usuarioActuante = await this.usuariosService.findOne(
        usuarioActuanteId,
        establecimientoId,
      );
      if (!usuarioActuante || !usuarioActuante.rol_id) {
        throw new NotFoundException('Usuario actuante no encontrado o sin rol asignado.');
      }
      const userRole = await this.rolesService.findOne(usuarioActuante.rol_id);
      if (!userRole) {
        throw new NotFoundException(`Rol con ID "${usuarioActuante.rol_id}" no encontrado.`);
      }

      const esAdminSupervisor =
        userRole.nombre === RoleName.ADMIN || userRole.nombre === RoleName.SUPERVISOR;
      const now = new Date();
      const lastRelevantTime =
        pedido.fecha_ultima_actualizacion_relevante_cocina || pedido.created_at;
      const diffMinutes =
        (now.getTime() - new Date(lastRelevantTime).getTime()) / (1000 * 60);

      const configPedido = await this.establecimientoConfiguracionPedidoService.findOneByEstablecimientoId(
        establecimientoId,
      );
      const LIMITE_CANCELACION_PREPARACION_MIN =
        configPedido?.limite_cancelacion_preparacion_minutos ?? Infinity;
      const LIMITE_CANCELACION_ENVIADO_COCINA_MIN =
        configPedido?.limite_cancelacion_enviado_cocina_minutos ?? Infinity;


      if (newStatus === EstadoPedido.CANCELADO) {
        if (!esAdminSupervisor) {
          if (
            (pedido.estado === EstadoPedido.EN_PREPARACION &&
              diffMinutes > LIMITE_CANCELACION_PREPARACION_MIN) ||
            (pedido.estado === EstadoPedido.ENVIADO_A_COCINA &&
              diffMinutes > LIMITE_CANCELACION_ENVIADO_COCINA_MIN)
          ) {
            throw new BadRequestException(
              'El tiempo para cancelar el pedido ha expirado para tu rol.',
            );
          }
        }
        for (const item of pedido.pedidoItems) {
          let recetaConsolidada: { [ingredienteId: string]: number } = {};
          if (item.producto) {
            recetaConsolidada = await this.productosService.obtenerRecetaDeProductoSimple(
              item.producto.id,
              establecimientoId
            );
          } else if (item.producto_configurable_id) {
            const info = await this.productosService.resolveConfigurableProductInfo(
              item.producto_configurable_id,
              establecimientoId,
              item.configuracion_json!,
            );
            recetaConsolidada = info.receta;
          }
          if (Object.keys(recetaConsolidada).length > 0) {
            await this.ingredientesService.revertirStockPorReceta(
              recetaConsolidada,
              item.cantidad,
              finalManager,
              establecimientoId
            );
          }
        }
        pedido.estado = EstadoPedido.CANCELADO;
        pedido.fecha_cancelacion = now;
        pedido.usuario_cancelador_id = usuarioActuanteId;
        if (pedido.mesa_id) {
          await finalManager.update(MesaEntity, pedido.mesa_id, {
            estado: EstadoMesa.LIBRE,
          });
          this.websocketEventsService.emitMesaStatusUpdated(
            establecimientoId,
            pedido.mesa_id,
            EstadoMesa.LIBRE,
          );
        }
        await finalManager.save(PedidoEntity, pedido);
        if (queryRunner) {
          await queryRunner.commitTransaction();
        }
        this.websocketEventsService.emitPedidoStatusUpdated(
          establecimientoId,
          id,
          newStatus,
        );
        return pedido;
      }

      if (newStatus === EstadoPedido.LISTO_PARA_ENTREGAR) {
        if (pedido.pedidoItems && pedido.pedidoItems.length > 0) {
          for (const item of pedido.pedidoItems) {
            item.estado_cocina = EstadoCocina.LISTO;
          }
          if (queryRunner) {
            await queryRunner.manager.save(pedido.pedidoItems);
          } else {
            await finalManager.save(pedido.pedidoItems);
          }
        }
      }
      if (newStatus === EstadoPedido.CERRADO) {
        const allItemsReady = pedido.pedidoItems.every(
          (item) => item.estado_cocina === EstadoCocina.LISTO,
        );
        if (!allItemsReady) {
          throw new BadRequestException(
            'No se puede cerrar el pedido, aún hay ítems pendientes en cocina.',
          );
        }
        for (const item of pedido.pedidoItems) {
          if (!item.producto) {
            throw new NotFoundException(
              `Producto no encontrado para el ítem de pedido "${item.id}".`,
            );
          }
          await this.productosService.obtenerRecetaDeProductoSimple(
            item.producto.id,
            establecimientoId,
          );
        }
      }

      pedido.estado = newStatus;
      if ([EstadoPedido.CERRADO, EstadoPedido.PAGADO].includes(newStatus)) {
        pedido.fecha_hora_cierre = now;
      }
      pedido.updated_at = now;
      if (
        [EstadoPedido.EN_PREPARACION, EstadoPedido.ENVIADO_A_COCINA].includes(
          newStatus,
        )
      ) {
        pedido.fecha_ultima_actualizacion_relevante_cocina = now;
      }
      if (queryRunner) {
        await queryRunner.manager.save(PedidoEntity, pedido);
      } else {
        await finalManager.save(PedidoEntity, pedido);
      }

      if (
        [EstadoPedido.CERRADO, EstadoPedido.PAGADO].includes(newStatus) &&
        pedido.mesa_id
      ) {
        const activeOrdersOnTable = await finalManager.count(PedidoEntity, {
          where: {
            mesa_id: pedido.mesa_id,
            establecimiento_id: establecimientoId,
            estado: Not(
              In([
                EstadoPedido.CERRADO,
                EstadoPedido.PAGADO,
                EstadoPedido.CANCELADO,
              ]),
            ),
          },
        });

        if (activeOrdersOnTable === 0) {
          await finalManager.update(MesaEntity, pedido.mesa_id, {
            estado: EstadoMesa.LIBRE,
          });
          this.websocketEventsService.emitMesaStatusUpdated(
            establecimientoId,
            pedido.mesa_id,
            EstadoMesa.LIBRE,
          );
        }
      }

      if (queryRunner) {
        await queryRunner.commitTransaction();
      }
      this.websocketEventsService.emitPedidoStatusUpdated(
        establecimientoId,
        id,
        newStatus,
      );
      return pedido;
    } catch (error) {
      if (queryRunner) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }




  public async addPedidoItem(
    pedidoId: string,
    createItemDto: CreatePedidoItemDto,
    establecimientoId: string,
  ): Promise<PedidoItemEntity> {
    const {
      tipo_producto,
      producto_id,
      producto_configurable_id,
      configuracion_json,
      cantidad,
      notas_item,
      estado_cocina,
    } = createItemDto;

    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId, establecimiento_id: establecimientoId },
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID "${pedidoId}" no encontrado en el establecimiento "${establecimientoId}".`);
    }
    if (pedido.estado !== EstadoPedido.ABIERTO) {
      throw new BadRequestException(`No se pueden añadir ítems a un pedido en estado "${pedido.estado}".`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let precioUnitario: number;
      let recetaConsolidada: { ingrediente_id: string; cantidad_necesaria: number }[];
      const now = new Date();

      if (tipo_producto === TipoProductoPedido.SIMPLE) {
        const productoSimple = await this.productosService.findOne(producto_id!, establecimientoId);
        if (!productoSimple) {
          throw new NotFoundException(`Producto con ID "${producto_id}" no encontrado en el establecimiento del pedido.`);
        }
        if (!productoSimple.activo) {
          throw new BadRequestException(`El producto "${productoSimple.nombre}" no está disponible.`);
        }
        precioUnitario = Number(productoSimple.precio);
        recetaConsolidada = productoSimple.receta.map(recetaItem => ({
          ingrediente_id: recetaItem.ingrediente_id,
          cantidad_necesaria: Number(recetaItem.cantidad_necesaria),
        }));
      } else if (tipo_producto === TipoProductoPedido.CONFIGURABLE) {
        const productoConfigurableInfo = await this.productosService.resolveConfigurableProductInfo(
          producto_configurable_id!,
          establecimientoId,
          configuracion_json!,
        );
        precioUnitario = productoConfigurableInfo.precio;
        recetaConsolidada = Object.entries(productoConfigurableInfo.receta).map(([ingredienteId, cantidad]) => ({
          ingrediente_id: ingredienteId,
          cantidad_necesaria: cantidad,
        }));
      } else {
        throw new BadRequestException('Tipo de producto no válido.');
      }

      const pedidoItem = queryRunner.manager.create(PedidoItemEntity, {
        pedido_id: pedido.id,
        producto_id: tipo_producto === TipoProductoPedido.SIMPLE ? producto_id : null,
        producto_configurable_id: tipo_producto === TipoProductoPedido.CONFIGURABLE ? producto_configurable_id : null,
        configuracion_json,
        cantidad,
        precio_unitario_al_momento_venta: precioUnitario,
        notas_item: notas_item || null,
        estado_cocina: estado_cocina || EstadoCocina.PENDIENTE,
        fecha_hora_estado_cocina_cambio: now,
      });
      const savedItem = await queryRunner.manager.save(PedidoItemEntity, pedidoItem);
      const updatedPedido = await queryRunner.manager.findOne(PedidoEntity, {
        where: { id: pedido.id },
        relations: ['pedidoItems'],
      });

      if (!updatedPedido) {
        throw new NotFoundException(`Pedido con ID "${pedido.id}" no encontrado al intentar actualizar ítems.`);
      }
      updatedPedido.total_estimado = await this.calcularTotalEstimado(updatedPedido.pedidoItems, establecimientoId);
      updatedPedido.fecha_ultima_actualizacion_relevante_cocina = now;
      await queryRunner.manager.save(PedidoEntity, updatedPedido);
      await queryRunner.commitTransaction();
      this.websocketEventsService.emitPedidoItemCreated(establecimientoId, pedidoId, savedItem);
      this.websocketEventsService.emitPedidoUpdated(establecimientoId, pedidoId, updatedPedido);
      return savedItem;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  public async updatePedidoItem(
    pedidoId: string,
    itemId: string,
    updatePedidoItemDto: UpdatePedidoItemDto,
    establecimientoId: string,
    usuarioActuanteId: string,
  ): Promise<PedidoItemEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const now = new Date();
      const pedido = await queryRunner.manager.findOne(PedidoEntity, {
        where: { id: pedidoId, establecimiento_id: establecimientoId },
        relations: ['pedidoItems', 'pedidoItems.producto', 'pedidoItems.producto.categoria'],
      });
      if (!pedido) {
        throw new NotFoundException(
          `Pedido con ID "${pedidoId}" no encontrado en el establecimiento "${establecimientoId}".`,
        );
      }
      let pedidoItem = pedido.pedidoItems.find((item) => item.id === itemId);
      if (!pedidoItem) {
        throw new NotFoundException(
          `Ítem de pedido con ID "${itemId}" no encontrado en el pedido "${pedidoId}".`,
        );
      }
      const { cantidad, notas_item, estado_cocina } = updatePedidoItemDto;
      let changesMade = false;
      const isBeverageAndReady =
        pedidoItem.producto &&
        pedidoItem.producto.categoria &&
        pedidoItem.producto.categoria.es_bebida &&
        pedidoItem.estado_cocina === EstadoCocina.LISTO;
      const quantityChanged = cantidad !== undefined && cantidad !== pedidoItem.cantidad;
      const notesChanged = notas_item !== undefined && notas_item !== pedidoItem.notas_item;
      if (isBeverageAndReady && (quantityChanged || notesChanged)) {
        throw new BadRequestException(
          'Las bebidas en estado LISTO no pueden ser modificadas (cantidad o notas).',
        );
      }
      if (estado_cocina !== undefined && estado_cocina !== pedidoItem.estado_cocina) {
        const usuario = await this.usuariosService.findOne(
          usuarioActuanteId,
          establecimientoId,
        );
        if (!usuario || !usuario.rol_id) {
          throw new NotFoundException(
            'Usuario actuante no encontrado o sin rol asignado.',
          );
        }
        const userRole = await this.rolesService.findOne(usuario.rol_id);
        if (!userRole) {
          throw new NotFoundException(
            `Rol con ID "${usuario.rol_id}" no encontrado.`,
          );
        }
        if (
          userRole.nombre !== RoleName.COCINERO &&
          userRole.nombre !== RoleName.ADMIN &&
          userRole.nombre !== RoleName.SUPERVISOR
        ) {
          throw new ForbiddenException(
            'Solo cocineros, supervisores o administradores pueden cambiar el estado de cocina.',
          );
        }
        if (
          pedidoItem.producto &&
          pedidoItem.producto.categoria &&
          pedidoItem.producto.categoria.es_bebida
        ) {
          if (
            pedidoItem.estado_cocina === EstadoCocina.LISTO &&
            estado_cocina === EstadoCocina.PENDIENTE
          ) {
            throw new BadRequestException(
              'Las bebidas en estado LISTO no pueden volver a PENDIENTE.',
            );
          }
          if (
            pedidoItem.estado_cocina === EstadoCocina.PENDIENTE &&
            estado_cocina === EstadoCocina.EN_PREPARACION
          ) {
            throw new BadRequestException(
              'Las bebidas no pasan por el estado EN_PREPARACION.',
            );
          }
          if (
            pedidoItem.estado_cocina === EstadoCocina.PENDIENTE &&
            estado_cocina === EstadoCocina.ENVIADO_A_COCINA
          ) {
            throw new BadRequestException(
              'Las bebidas no pasan por el estado ENVIADO_A_COCINA.',
            );
          }
        }
        pedidoItem.estado_cocina = estado_cocina;
        pedidoItem.fecha_hora_estado_cocina_cambio = now;
        changesMade = true;
      }
      if (cantidad !== undefined && cantidad !== pedidoItem.cantidad) {
        if (cantidad <= 0) {
          throw new BadRequestException(
            'La cantidad del ítem debe ser al menos 1 para una actualización. Para eliminar, use el endpoint de eliminación.',
          );
        }
        pedidoItem.cantidad = cantidad;
        pedidoItem.estado_cocina = EstadoCocina.PENDIENTE;
        pedidoItem.fecha_hora_estado_cocina_cambio = now;
        changesMade = true;
      }
      if (notas_item !== undefined && notas_item !== pedidoItem.notas_item) {
        pedidoItem.notas_item = notas_item;
        changesMade = true;
      }
      if (!changesMade) {
        throw new BadRequestException(
          'No hay cambios válidos para aplicar al ítem del pedido.',
        );
      }
      const savedItem = await queryRunner.manager.save(
        PedidoItemEntity,
        pedidoItem,
      );
      const updatedPedido = await queryRunner.manager.findOne(PedidoEntity, {
        where: { id: pedido.id },
        relations: ['pedidoItems'],
      });
      if (!updatedPedido) {
        throw new NotFoundException(
          `Pedido con ID "${pedido.id}" no encontrado al intentar actualizar ítems.`,
        );
      }
      updatedPedido.total_estimado = await this.calcularTotalEstimado(
        updatedPedido.pedidoItems,
        establecimientoId,
      );
      updatedPedido.fecha_ultima_actualizacion_relevante_cocina = now;
      updatedPedido.updated_at = now;
      await queryRunner.manager.save(PedidoEntity, updatedPedido);
      await queryRunner.commitTransaction();
      this.websocketEventsService.emitPedidoItemUpdated(
        establecimientoId,
        pedidoId,
        savedItem,
      );
      this.websocketEventsService.emitPedidoUpdated(
        establecimientoId,
        pedidoId,
        updatedPedido,
      );
      return savedItem;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  public async findActiveOrdersSummary(establecimientoId: string): Promise<any[]> {
    const establecimiento = await this.establecimientosService.findOne(
      establecimientoId,
    );
    if (!establecimiento) {
      throw new NotFoundException(
        `Establecimiento con ID "${establecimientoId}" no encontrado.`,
      );
    }
    const excludedStates: EstadoPedido[] = [
      EstadoPedido.CANCELADO,
      EstadoPedido.CERRADO,
      EstadoPedido.PAGADO,
      EstadoPedido.ENTREGADO,
    ];
    const pedidos = await this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.pedidoItems', 'pedidoItem')
      .leftJoinAndSelect('pedidoItem.producto', 'producto')
      .leftJoinAndSelect('pedido.mesa', 'mesa')
      .where('pedido.establecimiento_id = :establecimientoId', {
        establecimientoId,
      })
      .andWhere('pedido.estado NOT IN (:...excludedStates)', {
        excludedStates,
      })
      .orderBy('pedido.created_at', 'ASC')
      .getMany();
    return pedidos.map((pedido) => ({
      ...pedido,
      codigo_pedido: pedido.codigo_pedido,
      numero_secuencial_diario: pedido.numero_secuencial_diario,
      pedidoItems: pedido.pedidoItems.map((item) => ({
        id: item.id,
        nombre_producto: item.producto?.nombre,
        cantidad: item.cantidad,
        notas: item.notas_item,
        estado_cocina: item.estado_cocina,
      })),
      mesa_numero: pedido.mesa ? pedido.mesa.numero : null,
    }));
  }

  public async removePedidoItem(
    pedidoId: string,
    itemId: string,
    establecimientoId: string,
  ): Promise<DeleteResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const now = new Date();
      const pedido = await queryRunner.manager.findOne(PedidoEntity, {
        where: { id: pedidoId, establecimiento_id: establecimientoId },
        relations: ['pedidoItems'],
      });
      if (!pedido) {
        throw new NotFoundException(`Pedido con ID "${pedidoId}" no encontrado.`);
      }
      if (pedido.estado !== EstadoPedido.ABIERTO) {
        throw new BadRequestException(
          `No se pueden eliminar ítems de un pedido que no esté en estado "ABIERTO". Estado actual: ${pedido.estado}.`,
        );
      }
      const pedidoItem = pedido.pedidoItems.find((item) => item.id === itemId);
      if (!pedidoItem) {
        throw new NotFoundException(
          `Ítem de pedido con ID "${itemId}" no encontrado en el pedido "${pedidoId}".`,
        );
      }
      if (pedido.pedidoItems.length === 1) {
        throw new BadRequestException(
          'No se puede eliminar el último ítem de un pedido. Si desea, cancele el pedido.',
        );
      }
      const result = await queryRunner.manager.delete(PedidoItemEntity, itemId);
      pedido.pedidoItems = pedido.pedidoItems.filter((item) => item.id !== itemId);
      pedido.total_estimado = await this.calcularTotalEstimado(
        pedido.pedidoItems,
        establecimientoId,
      );
      pedido.fecha_ultima_actualizacion_relevante_cocina = now;
      pedido.updated_at = now;
      await queryRunner.manager.save(PedidoEntity, pedido);
      await queryRunner.commitTransaction();
      this.websocketEventsService.emitPedidoItemRemoved(
        establecimientoId,
        pedidoId,
        itemId,
      );
      this.websocketEventsService.emitPedidoUpdated(
        establecimientoId,
        pedidoId,
        pedido,
      );
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  public async asignarDomiciliario(
    pedidoId: string,
    usuarioDomiciliarioId: string,
    establecimientoId: string,
  ): Promise<PedidoEntity> {
    const pedido = await this.pedidoRepository.findOne({ where: { id: pedidoId, establecimiento_id: establecimientoId } });
    if (!pedido) {
      throw new NotFoundException(`Pedido con ID "${pedidoId}" no encontrado en este establecimiento.`);
    }
    if (pedido.tipo_pedido !== TipoPedido.DOMICILIO || pedido.estado !== EstadoPedido.LISTO_PARA_ENTREGAR) {
      throw new BadRequestException('El pedido no puede ser asignado. Debe ser un pedido de domicilio y estar en estado LISTO_PARA_ENTREGAR.');
    }
    pedido.usuario_domiciliario_id = usuarioDomiciliarioId;
    pedido.estado = EstadoPedido.EN_REPARTO;
    return this.pedidoRepository.save(pedido);
  }
  public async transferPedidoTable(
    pedidoId: string,
    newMesaId: string,
    establecimientoId: string,
  ): Promise<PedidoEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const pedido = await queryRunner.manager.findOne(PedidoEntity, {
        where: { id: pedidoId, establecimiento_id: establecimientoId },
      });
      if (!pedido) {
        throw new NotFoundException(`Pedido con ID "${pedidoId}" no encontrado.`);
      }
      if (pedido.tipo_pedido !== TipoPedido.MESA) {
        throw new BadRequestException(
          'Solo se pueden transferir pedidos de tipo "MESA".',
        );
      }
      const oldMesaId = pedido.mesa_id;
      if (oldMesaId === newMesaId) {
        throw new BadRequestException('La nueva mesa es la misma que la actual.');
      }
      const newMesa = await this.mesasService.findOne(
        newMesaId,
        establecimientoId,
      );
      if (!newMesa) {
        throw new NotFoundException(
          `Nueva mesa con ID "${newMesaId}" no encontrada.`,
        );
      }
      if (newMesa.estado === EstadoMesa.OCUPADA) {
        throw new ConflictException(
          `La nueva mesa ${newMesa.numero} ya está ocupada.`,
        );
      }
      pedido.mesa_id = newMesaId;
      pedido.updated_at = new Date();
      await queryRunner.manager.save(PedidoEntity, pedido);
      await queryRunner.manager.update(MesaEntity, newMesa.id, {
        estado: EstadoMesa.OCUPADA,
      });
      this.websocketEventsService.emitMesaStatusUpdated(
        establecimientoId,
        newMesa.id,
        EstadoMesa.OCUPADA,
      );
      if (oldMesaId) {
        const otherActiveOrdersOnOldTable = await queryRunner.manager.count(
          PedidoEntity,
          {
            where: {
              mesa_id: oldMesaId,
              establecimiento_id: establecimientoId,
              estado: Not(
                In([
                  EstadoPedido.CERRADO,
                  EstadoPedido.PAGADO,
                  EstadoPedido.CANCELADO,
                ]),
              ),
              id: Not(pedido.id),
            },
          },
        );
        if (otherActiveOrdersOnOldTable === 0) {
          await queryRunner.manager.update(MesaEntity, oldMesaId, {
            estado: EstadoMesa.LIBRE,
          });
          this.websocketEventsService.emitMesaStatusUpdated(
            establecimientoId,
            oldMesaId,
            EstadoMesa.LIBRE,
          );
        }
      }
      await queryRunner.commitTransaction();
      this.websocketEventsService.emitPedidoUpdated(
        establecimientoId,
        pedidoId,
        pedido,
      );
      return pedido;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  @Cron(CronExpression.EVERY_MINUTE)
  async handlePendingToPreparingTransition() {
    const pedidos = await this.pedidoRepository.find({
      where: {
        estado: In([EstadoPedido.ABIERTO, EstadoPedido.EN_PREPARACION]),
      },
      relations: ['establecimiento', 'pedidoItems'],
    });
    for (const pedido of pedidos) {
      const config = await this.establecimientoConfiguracionPedidoService.findOneByEstablecimientoId(
        pedido.establecimiento_id,
      );
      const delayMinutes =
        config?.limite_cancelacion_preparacion_minutos || 0;
      if (delayMinutes <= 0) {
        continue;
      }
      for (const item of pedido.pedidoItems) {
        if (item.estado_cocina === EstadoCocina.PENDIENTE) {
          const timeElapsed =
            (new Date().getTime() -
              new Date(item.fecha_hora_estado_cocina_cambio).getTime()) /
            (1000 * 60);
          if (timeElapsed >= delayMinutes) {
            item.estado_cocina = EstadoCocina.EN_PREPARACION;
            item.fecha_hora_estado_cocina_cambio = new Date();
            await this.pedidoItemRepository.save(item);
          }
        }
      }
    }
  }


  /**
    * Encuentra información de cliente (nombre, teléfono, dirección) 
    * a partir de pedidos de domicilio.
    * @param establecimientoId El ID del establecimiento.
    * @param query El término de búsqueda.
    * @returns Una lista de objetos con la información del cliente.
    */
  async findClientesByInfo(
    establecimientoId: string,
    query: string,
  ): Promise<any[]> {
    const likeQuery = `%${query.toLowerCase()}%`;

    const resultadosCrudos = await this.pedidoRepository.createQueryBuilder('pedido')
      .select([
        'pedido.cliente_nombre',
        'pedido.cliente_telefono',
        'pedido.cliente_direccion',
      ])
      .where('pedido.establecimiento_id = :establecimientoId', { establecimientoId })
      .andWhere(
        '(LOWER(pedido.cliente_nombre) LIKE :query OR LOWER(pedido.cliente_telefono) LIKE :query OR LOWER(pedido.cliente_direccion) LIKE :query)',
        { query: likeQuery },
      )
      .andWhere('pedido.tipo_pedido = :tipoDomicilio', { tipoDomicilio: TipoPedido.DOMICILIO })
      .orderBy('pedido.updated_at', 'DESC')
      .limit(50)
      .getMany();
    const clientesMap = new Map();
    for (const pedido of resultadosCrudos) {
      const clienteKey = pedido.cliente_telefono || `${pedido.cliente_nombre}-${pedido.cliente_direccion}`;
      if (!clientesMap.has(clienteKey)) {
        clientesMap.set(clienteKey, {
          cliente_nombre: pedido.cliente_nombre,
          cliente_telefono: pedido.cliente_telefono,
          cliente_direccion: pedido.cliente_direccion,
        });
      }
    }
    return Array.from(clientesMap.values());
  }
  public async findPaginatedAndFiltered(
    establecimientoId: string,
    page: number = 1,
    limit: number = 25,
    estado?: EstadoPedido,
    tipoPedido?: TipoPedido,
    mesaId?: string,
    usuarioCreadorId?: string,
    usuarioDomiciliarioId?: string
  ): Promise<{ data: PedidoEntity[], total: number }> {
    const whereCondition: any = { establecimiento_id: establecimientoId };

    if (estado) whereCondition.estado = estado;
    if (tipoPedido) whereCondition.tipo_pedido = tipoPedido;
    if (mesaId) whereCondition.mesa_id = mesaId;
    if (usuarioCreadorId) whereCondition.usuario_creador_id = usuarioCreadorId;
    if (usuarioDomiciliarioId) whereCondition.usuario_domiciliario_id = usuarioDomiciliarioId;

    const [pedidos, total] = await this.pedidoRepository.findAndCount({
      where: whereCondition,
      relations: [
        'establecimiento',
        'mesa',
        'usuarioCreador',
        'usuarioDomiciliario',
        'usuarioCancelador',
        'pedidoItems',
        'pedidoItems.producto',
      ],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: pedidos, total };
  }
}