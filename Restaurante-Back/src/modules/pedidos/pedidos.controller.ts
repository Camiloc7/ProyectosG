import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth, ApiQuery, } from "@nestjs/swagger";
import { PedidosService } from "./pedidos.service";
import { CreatePedidoDto } from "./dto/create-pedido.dto";
import { UpdatePedidoDto } from "./dto/update-pedido.dto";
import { PedidoEntity, EstadoPedido, TipoPedido, } from "./entities/pedido.entity";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RoleName } from "../../common/constants/app.constants";
import { AuthenticatedRequest } from "../../common/interfaces/authenticated-request.interface";
import { RolesService } from "../roles/roles.service";
import { CreatePedidoItemDto } from "./dto/create-pedido-item.dto";
import { UpdatePedidoItemDto } from "./dto/update-pedido-item.dto";
import { PedidoItemEntity, TipoProductoPedido } from "./entities/pedido-item.entity";
@ApiTags("Pedidos")
@ApiBearerAuth("JWT-auth")
@UseGuards(AuthGuard, RolesGuard)
@Controller("pedidos")
export class PedidosController {
  constructor(
    private readonly pedidosService: PedidosService,
    private readonly rolesService: RolesService
  ) { }
  @Get('lista-pedidos')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO, RoleName.COCINERO, RoleName.DOMICILIARIO)
  @ApiOperation({ summary: 'Obtener un resumen de pedidos activos (no cancelados, cerrados, pagados o entregados)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos activos con campos específicos',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          codigo_pedido: { type: 'string' },
          numero_secuencial_diario: { type: 'number' },
          mesa_id: { type: 'string', format: 'uuid', nullable: true },
          usuario_domiciliario_id: { type: 'string', format: 'uuid', nullable: true },
          estado: { type: 'string', enum: ['ABIERTO', 'ENVIADO_A_COCINA', 'EN_PREPARACION', 'LISTO_PARA_ENTREGAR', 'ENTREGADO', 'EN_REPARTO', 'LISTO'] },
          tipo_pedido: { type: 'string', enum: Object.values(TipoPedido) },
          cliente_nombre: { type: 'string', nullable: true },
          cliente_telefono: { type: 'string', nullable: true },
          cliente_direccion: { type: 'string', nullable: true },
          total_estimado: { type: 'string', format: 'float' },
          descuentos_aplicados: { type: 'string', format: 'float' },
          notas: { type: 'string', nullable: true },
          pedidoItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nombre: { type: 'string' },
                cantidad: { type: 'number' },
                nota: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
  })
  async getActiveOrdersSummary(@Req() req: AuthenticatedRequest): Promise<any[]> {
    return this.pedidosService.findActiveOrdersSummary(req.user.establecimiento_id);
  }
@Get('historial')
@HttpCode(HttpStatus.OK)
@Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
@ApiOperation({
  summary: "Obtener pedidos con paginación y filtros para el historial.",
})
@ApiResponse({
  status: 200,
  description: "Lista de pedidos con información de paginación",
})
@ApiQuery({ name: "page", type: "number", required: false, description: "Número de página (por defecto: 1)" })
@ApiQuery({ name: "limit", type: "number", required: false, description: "Número de elementos por página (por defecto: 25)" })
@ApiQuery({ name: "estado", enum: EstadoPedido, required: false, description: "Filtrar por estado del pedido" })
@ApiQuery({ name: "tipoPedido", enum: TipoPedido, required: false, description: "Filtrar por tipo de pedido" })
@ApiQuery({ name: "mesaId", type: "string", required: false, description: "Filtrar por ID de mesa" })
@ApiQuery({ name: "usuarioCreadorId", type: "string", required: false, description: "Filtrar por ID de usuario creador" })
async getPaginatedOrders(
  @Req() req: AuthenticatedRequest,
  @Query('page') page: number,
  @Query('limit') limit: number,
  @Query('estado') estado?: EstadoPedido,
  @Query('tipoPedido') tipoPedido?: TipoPedido,
  @Query('mesaId') mesaId?: string,
  @Query('usuarioCreadorId') usuarioCreadorId?: string,
): Promise<{ data: PedidoEntity[], total: number }> {
  const userRole = await this.rolesService.findOne(req.user.rol_id);
  if (!userRole) {
    throw new NotFoundException(`Rol con ID "${req.user.rol_id}" no encontrado.`);
  }
  let estadosParaFiltrar: EstadoPedido | undefined = estado;
  let tipoPedidoParaFiltrar: TipoPedido | undefined = tipoPedido;
  let mesaIdParaFiltrar: string | undefined = mesaId;
  let usuarioCreadorIdParaFiltrar: string | undefined = usuarioCreadorId;
  return this.pedidosService.findPaginatedAndFiltered(
    req.user.establecimiento_id,
    page,
    limit,
    estadosParaFiltrar,
    tipoPedidoParaFiltrar,
    mesaIdParaFiltrar,
    usuarioCreadorIdParaFiltrar
  );
}
  @Get('buscar-cliente')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO, RoleName.DOMICILIARIO)
  @ApiOperation({
    summary: 'Buscar clientes por su información (nombre, teléfono o dirección)',
    description: 'Busca los clientes más recientes que coincidan con un término de búsqueda y devuelve solo su nombre, teléfono y dirección, sin el resto de los datos del pedido.'
  })
  @ApiQuery({
    name: "query",
    type: "string",
    required: true,
    description: "Término de búsqueda para el nombre, teléfono o dirección del cliente",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de clientes encontrados con sus datos de contacto",
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          cliente_nombre: { type: 'string', nullable: true },
          cliente_telefono: { type: 'string', nullable: true },
          cliente_direccion: { type: 'string', nullable: true },
        },
      },
    },
  })
  async findByClienteInfo(
    @Req() req: AuthenticatedRequest,
    @Query('query') query: string,
  ): Promise<any[]> {
    if (!query || query.trim().length < 3) {
      throw new BadRequestException('El término de búsqueda debe tener al menos 3 caracteres.');
    }
    const establecimientoId = req.user.establecimiento_id;
    return this.pedidosService.findClientesByInfo(establecimientoId, query.trim());
  }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
  @ApiOperation({
    summary:
      "Crear un nuevo pedido para el establecimiento del usuario autenticado.",
    description:
      "El ID del establecimiento se toma automáticamente del token JWT del usuario. No es necesario enviarlo en el cuerpo de la solicitud.",
  })
  @ApiResponse({
    status: 201,
    description: "Pedido creado exitosamente",
    type: PedidoEntity,
  })
  @ApiResponse({ status: 400, description: "Datos de entrada inválidos" })
  @ApiResponse({ status: 403, description: "Acceso prohibido" })
  @ApiResponse({ status: 404, description: "Mesa o productos no encontrados" })
  @ApiResponse({ status: 409, description: "La mesa ya está ocupada" })
  @ApiBody({ type: CreatePedidoDto })
  async create(
    @Body() createPedidoDto: CreatePedidoDto,
    @Req() req: AuthenticatedRequest
  ): Promise<PedidoEntity> {
    const establecimientoId = req.user.establecimiento_id;
    const usuarioCreadorId = req.user.id;
    if (!establecimientoId) {
      throw new BadRequestException(
        "El ID del establecimiento no pudo ser determinado desde el token de autenticación."
      );
    }
    return this.pedidosService.create(
      createPedidoDto,
      usuarioCreadorId,
      establecimientoId
    );
  }
  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO, RoleName.COCINERO, RoleName.DOMICILIARIO)
  @ApiOperation({
    summary: "Obtener todos los pedidos de un establecimiento con filtros",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de pedidos",
    type: [PedidoEntity],
  })
  @ApiQuery({
    name: "estado",
    enum: EstadoPedido,
    required: false,
    description: "Filtrar por estado del pedido",
  })
  @ApiQuery({
    name: "tipoPedido",
    enum: TipoPedido,
    required: false,
    description: "Filtrar por tipo de pedido",
  })
  @ApiQuery({
    name: "mesaId",
    type: "string",
    required: false,
    description: "Filtrar por ID de mesa",
  })
  @ApiQuery({
    name: "usuarioCreadorId",
    type: "string",
    required: false,
    description: "Filtrar por ID de usuario creador",
  })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query("estado") estado?: EstadoPedido,
    @Query("tipoPedido") tipoPedido?: TipoPedido,
    @Query("mesaId") mesaId?: string,
    @Query("usuarioCreadorId") usuarioCreadorId?: string
  ): Promise<PedidoEntity[]> {
    const userRole = await this.rolesService.findOne(req.user.rol_id);
    if (!userRole) {
      throw new NotFoundException(`Rol con ID "${req.user.rol_id}" no encontrado.`);
    }
    const userRoleName = userRole.nombre;
    let estadosParaFiltrar: EstadoPedido[] | undefined = estado ? [estado] : undefined;
    let tipoPedidoParaFiltrar: TipoPedido | undefined = tipoPedido;
    let usuarioCreadorIdParaFiltrar: string | undefined = usuarioCreadorId;
    let usuarioDomiciliarioIdParaFiltrar: string | undefined = undefined;
    let mesaIdParaFiltrar: string | undefined = mesaId;
    switch (userRoleName) {
      case RoleName.MESERO:
      case RoleName.CAJERO:
        if (!estadosParaFiltrar) {
          estadosParaFiltrar = [
            EstadoPedido.ABIERTO,
            EstadoPedido.ENVIADO_A_COCINA,
            EstadoPedido.EN_PREPARACION,
            EstadoPedido.LISTO_PARA_ENTREGAR,
            EstadoPedido.EN_REPARTO,
            EstadoPedido.ENTREGADO,
          ];
        }
        break;
      case RoleName.DOMICILIARIO:
        tipoPedidoParaFiltrar = TipoPedido.DOMICILIO;
        usuarioDomiciliarioIdParaFiltrar = req.user.id;
        if (!estadosParaFiltrar) {
          estadosParaFiltrar = [
            EstadoPedido.ABIERTO,
            EstadoPedido.ENVIADO_A_COCINA,
            EstadoPedido.EN_PREPARACION,
            EstadoPedido.LISTO_PARA_ENTREGAR,
            EstadoPedido.EN_REPARTO,
            EstadoPedido.ENTREGADO,
          ];
        }
        break;
      case RoleName.COCINERO:
        if (!estadosParaFiltrar) {
          estadosParaFiltrar = [EstadoPedido.ABIERTO, EstadoPedido.ENVIADO_A_COCINA, EstadoPedido.EN_PREPARACION, EstadoPedido.LISTO_PARA_ENTREGAR];
        }
        break;

      default:
        break;
    }
    return this.pedidosService.findAll(
      req.user.establecimiento_id,
      estadosParaFiltrar,
      tipoPedidoParaFiltrar,
      mesaIdParaFiltrar,
      usuarioCreadorIdParaFiltrar,
      usuarioDomiciliarioIdParaFiltrar
    );
  }
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO, RoleName.COCINERO, RoleName.DOMICILIARIO)
  @ApiOperation({ summary: "Obtener un pedido por ID" })
  @ApiResponse({
    status: 200,
    description: "Pedido encontrado",
    type: PedidoEntity,
  })
  @ApiResponse({ status: 403, description: "Acceso prohibido" })
  @ApiResponse({ status: 404, description: "Pedido no encontrado" })
  @ApiParam({ name: "id", description: "ID del pedido (UUID)", type: "string" })
  async findOne(
    @Param("id") id: string,
    @Req() req: AuthenticatedRequest
  ): Promise<PedidoEntity> {
    const pedido = await this.pedidosService.findOne(
      id,
      req.user.establecimiento_id
    );

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID "${id}" no encontrado.`);
    }
    const userRole = await this.rolesService.findOne(req.user.rol_id);
    if (!userRole) {
      throw new NotFoundException(`Rol con ID "${req.user.rol_id}" no encontrado.`);
    }
    const userRoleName = userRole.nombre;
    if (userRoleName === RoleName.DOMICILIARIO) {
      if (pedido.usuario_domiciliario_id !== req.user.id) {
        throw new ForbiddenException(
          "Un domiciliario solo puede ver los pedidos que tiene asignados."
        );
      }
    }
    return pedido;
  }
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO,  RoleName.CAJERO)
  @ApiOperation({
    summary: "Actualizar un pedido existente (incluyendo ítems)",
  })
  @ApiResponse({
    status: 200,
    description: "Pedido actualizado exitosamente",
    type: PedidoEntity,
  })
  @ApiResponse({
    status: 400,
    description: "Datos de entrada inválidos o pedido no editable",
  })
  @ApiResponse({ status: 403, description: "Acceso prohibido" })
  @ApiResponse({
    status: 404,
    description: "Pedido, mesa o producto no encontrado",
  })
  @ApiResponse({ status: 409, description: "La nueva mesa ya está ocupada" })
  @ApiParam({ name: "id", description: "ID del pedido (UUID)", type: "string" })
  @ApiBody({ type: UpdatePedidoDto })
  async update(
    @Param("id") id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
    @Req() req: AuthenticatedRequest
  ): Promise<PedidoEntity> {
    return this.pedidosService.update(
      id,
      updatePedidoDto,
      req.user.establecimiento_id,
      req.user.id
    );
  }
  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO, RoleName.COCINERO, RoleName.DOMICILIARIO)
  @ApiOperation({ summary: "Actualizar el estado de un pedido" })
  @ApiResponse({
    status: 200,
    description: "Estado del pedido actualizado",
    type: PedidoEntity,
  })
  @ApiResponse({
    status: 400,
    description: "Cambio de estado inválido o ítems pendientes",
  })
  @ApiResponse({
    status: 403,
    description: "Acceso prohibido para este cambio de estado o rol",
  })
  @ApiResponse({ status: 404, description: "Pedido no encontrado" })
  @ApiParam({ name: "id", description: "ID del pedido (UUID)", type: "string" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        estado: {
          type: "string",
          enum: Object.values(EstadoPedido),
          description: "Nuevo estado del pedido",
        },

         razon: {
                type: "string",
                description: "Nota opcional para el pedido",
                nullable: true, 
            },
      },
    },
  })
  async updateStatus(
    @Param("id") id: string,
    @Body("estado") estado: EstadoPedido,
    @Req() req: AuthenticatedRequest
  ): Promise<PedidoEntity> {
    if (!Object.values(EstadoPedido).includes(estado)) {
      throw new BadRequestException("El estado proporcionado no es válido.");
    }
    const userRole = await this.rolesService.findOne(req.user.rol_id);
    if (!userRole) {
      throw new NotFoundException(`Rol con ID "${req.user.rol_id}" no encontrado.`);
    }
    const userRoleName = userRole.nombre as RoleName;
    switch (estado) {
      case EstadoPedido.CANCELADO:
      case EstadoPedido.CERRADO:
      case EstadoPedido.PAGADO:
        if (
          ![
            RoleName.ADMIN,
            RoleName.CAJERO,
            RoleName.SUPERVISOR,
            RoleName.MESERO,
          ].includes(userRoleName)
        ) {
          throw new ForbiddenException(
            `Solo Administradores, Supervisores, Cajeros o Meseros pueden cambiar el estado a ${estado}.`
          );
        }
        break;
      case EstadoPedido.EN_PREPARACION:
      case EstadoPedido.ENVIADO_A_COCINA:
      case EstadoPedido.LISTO_PARA_ENTREGAR:
        if (
          ![RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.COCINERO].includes(
            userRoleName
          )
        ) {
          throw new ForbiddenException(
            `Solo Administradores, Supervisores y Cocineros pueden cambiar el estado a ${estado}.`
          );
        }
        break;
      case EstadoPedido.ENTREGADO:
        if (
          ![
            RoleName.ADMIN,
            RoleName.SUPERVISOR,
            RoleName.DOMICILIARIO,
            RoleName.MESERO,
          ].includes(userRoleName)
        ) {
          throw new ForbiddenException(
            `Solo Administradores, Supervisores, Domiciliarios o Meseros pueden cambiar el estado a ${estado}.`
          );
        }
        break;
      case EstadoPedido.ABIERTO:
        if (userRoleName !== RoleName.ADMIN) {
          throw new ForbiddenException(
            "Solo Administradores pueden reabrir pedidos."
          );
        }
        break;
      default:
        throw new ForbiddenException(
          "No tiene permiso para realizar este cambio de estado o el estado no es válido."
        );
    }
    return this.pedidosService.updatePedidoStatus(
      id,
      estado,
      req.user.establecimiento_id,
      req.user.id
    );
  }
  @Post(":id/items")
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
  @ApiOperation({
    summary: "Agregar un nuevo ítem a un pedido o incrementar su cantidad",
  })
  @ApiResponse({
    status: 201,
    description: "Ítem de pedido agregado/actualizado exitosamente",
    type: PedidoItemEntity,
  })
  @ApiResponse({
    status: 400,
    description: "Datos de entrada inválidos o pedido no abierto",
  })
  @ApiResponse({ status: 404, description: "Pedido o producto no encontrado" })
  @ApiParam({ name: "id", description: "ID del pedido (UUID)", type: "string" })
  @ApiBody({ type: CreatePedidoItemDto })
  async addOrUpdateItem(
    @Param("id") pedidoId: string,
    @Body() createPedidoItemDto: CreatePedidoItemDto,
    @Req() req: AuthenticatedRequest
  ): Promise<PedidoItemEntity> {
    const updatedPedido = await this.pedidosService.update(
      pedidoId,
      { pedidoItems: [createPedidoItemDto] },
      req.user.establecimiento_id,
      req.user.id
    );

    const updatedItem = updatedPedido.pedidoItems.find(
      (item) => item.producto?.id === createPedidoItemDto.producto_id
    );

    if (!updatedItem) {
      throw new NotFoundException("El ítem actualizado no se encontró en el pedido.");
    }

    return updatedItem;
  }
  @Patch(":pedidoId/items/:itemId")
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO, RoleName.COCINERO)
  @ApiOperation({ summary: "Actualizar un ítem de pedido existente" })
  @ApiResponse({
    status: 200,
    description: "Ítem de pedido actualizado exitosamente",
    type: PedidoItemEntity,
  })
  @ApiResponse({
    status: 400,
    description: "Datos de entrada inválidos o pedido no abierto",
  })
  @ApiResponse({ status: 403, description: "Acceso prohibido" })
  @ApiResponse({ status: 404, description: "Ítem de pedido no encontrado" })
  @ApiParam({
    name: "pedidoId",
    description: "ID del pedido (UUID)",
    type: "string",
  })
  @ApiParam({
    name: "itemId",
    description: "ID del ítem de pedido (UUID)",
    type: "string",
  })
  @ApiBody({ type: UpdatePedidoItemDto })
  async updateItem(
    @Param("pedidoId") pedidoId: string,
    @Param("itemId") itemId: string,
    @Body() updatePedidoItemDto: UpdatePedidoItemDto,
    @Req() req: AuthenticatedRequest
  ): Promise<PedidoItemEntity> {
    return this.pedidosService.updatePedidoItem(
      pedidoId,
      itemId,
      updatePedidoItemDto,
      req.user.establecimiento_id,
      req.user.id
    );
  }
  @Delete(":pedidoId/items/:itemId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO)
  @ApiOperation({ summary: "Eliminar un ítem de un pedido" })
  @ApiResponse({
    status: 204,
    description: "Ítem de pedido eliminado exitosamente",
  })
  @ApiResponse({
    status: 400,
    description: "Pedido no abierto o es el último ítem",
  })
  @ApiResponse({ status: 404, description: "Ítem de pedido no encontrado" })
  @ApiParam({
    name: "pedidoId",
    description: "ID del pedido (UUID)",
    type: "string",
  })
  @ApiParam({
    name: "itemId",
    description: "ID del ítem de pedido (UUID)",
    type: "string",
  })
  async removeItem(
    @Param("pedidoId") pedidoId: string,
    @Param("itemId") itemId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<void> {
    await this.pedidosService.removePedidoItem(
      pedidoId,
      itemId,
      req.user.establecimiento_id
    );
  }
  @Patch(":id/transfer-table")
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO, RoleName.MESERO)
  @ApiOperation({ summary: "Transferir un pedido de una mesa a otra" })
  @ApiResponse({
    status: 200,
    description: "Pedido transferido exitosamente",
    type: PedidoEntity,
  })
  @ApiResponse({
    status: 400,
    description: "Pedido no de mesa o nueva mesa ocupada",
  })
  @ApiResponse({ status: 404, description: "Pedido o mesa no encontrada" })
  @ApiParam({ name: "id", description: "ID del pedido (UUID)", type: "string" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        newMesaId: {
          type: "string",
          format: "uuid",
          description: "ID de la nueva mesa",
        },
      },
    },
  })
  async transferTable(
    @Param("id") id: string,
    @Body("newMesaId") newMesaId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<PedidoEntity> {
    return this.pedidosService.transferPedidoTable(
      id,
      newMesaId,
      req.user.establecimiento_id
    );
  }
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: "Cancelar un pedido existente" })
  @ApiResponse({ status: 204, description: "Pedido cancelado exitosamente" })
  @ApiResponse({
    status: 400,
    description:
      "No se puede cancelar el pedido en su estado actual o el tiempo ha expirado.",
  })
  @ApiResponse({
    status: 403,
    description: "Acceso prohibido para cancelar este pedido.",
  })
  @ApiResponse({ status: 404, description: "Pedido no encontrado" })
  @ApiParam({ name: "id", description: "ID del pedido (UUID)", type: "string" })
  async remove(
    @Param("id") id: string,
    @Req() req: AuthenticatedRequest
  ): Promise<void> {
    await this.pedidosService.updatePedidoStatus(
      id,
      EstadoPedido.CANCELADO,
      req.user.establecimiento_id,
      req.user.id
    );
  }
  @Patch(':id/asignar-domiciliario')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.DOMICILIARIO, RoleName.MESERO)
  @ApiOperation({
    summary: 'Asignar un pedido de domicilio a un domiciliario',
    description: 'Un domiciliario puede tomar un pedido con estado LISTO_PARA_ENTREGAR, y se le asignará. Administradores y Supervisores también pueden asignar pedidos manualmente.',
  })
  @ApiResponse({ status: 200, description: 'Pedido asignado exitosamente', type: PedidoEntity })
  @ApiResponse({ status: 400, description: 'Pedido no elegible para ser asignado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del pedido (UUID)', type: 'string' })
  async asignarDomiciliario(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest, F
  ): Promise<PedidoEntity> {
    const pedido = await this.pedidosService.findOne(id, req.user.establecimiento_id);

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID "${id}" no encontrado.`);
    }
    if (pedido.tipo_pedido !== TipoPedido.DOMICILIO || pedido.estado !== EstadoPedido.LISTO_PARA_ENTREGAR) {
      throw new BadRequestException('El pedido no es de domicilio o no está en un estado que permita la asignación.');
    }
    return this.pedidosService.asignarDomiciliario(
      id,
      req.user.id,
      req.user.establecimiento_id
    );
  }
}