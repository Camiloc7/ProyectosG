import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Res,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBodyOptions,
} from "@nestjs/swagger";
import { Response } from "express";
import { ImpresionService } from "./impresion.service";
import { CreateImpresoraDto } from "./dto/create-impresora.dto";
import { UpdateImpresoraDto } from "./dto/update.impresora.dto";
import { ImpresoraEntity } from "./entities/impresora.entity";
import { AuthGuard } from "src/common/guards/auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { RoleName } from "src/common/constants/app.constants";
import { AuthenticatedRequest } from "src/common/interfaces/authenticated-request.interface";
import { RolesService } from "../roles/roles.service";
import { PedidosService } from "../pedidos/pedidos.service";

@ApiTags("Impresoras")
@ApiBearerAuth("JWT-auth")
@UseGuards(AuthGuard, RolesGuard)
@Controller("impresoras")
export class ImpresionController {
  constructor(
    private readonly impresionService: ImpresionService,
    private readonly rolesService: RolesService,
    private readonly pedidosService: PedidosService
  ) {}

  // @Get('test-conexion')
  //   async testPluginConnection() {
  //       return this.impresionService.probarConexionPlugin();
  //   }

// @Get('disponibles')
// @Roles(RoleName.ADMIN)
// @ApiOperation({ summary: 'Obtener la lista de impresoras disponibles desde el plugin HTTP' })
// @ApiResponse({ status: 200, description: 'Lista completa de impresoras obtenida del plugin.' })
// @ApiResponse({ status: 404, description: 'Error de conexión con el plugin.' })
// async getImpresorasDisponibles(): Promise<any[]> { 
//     return this.impresionService.obtenerImpresorasDisponibles(); 
// }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.CAJERO)
  @ApiOperation({
    summary:
      "Crear una nueva impresora para el establecimiento del usuario autenticado.",
  })
  @ApiBody({
    type: CreateImpresoraDto,
    examples: {
      cajaExample: {
        summary: "Ejemplo: Impresora de Caja (Tiquets)",
        description: "Usada para imprimir facturas o tiquets al cliente.",
        value: {
          nombre: "EPSON TM-T20II Receipt",
          descripcion: "Caja Principal",
          tipo_impresion: "CAJA",
          activa: true,
        },
      },
      cocinaExample: {
        summary: "Ejemplo: Impresora de Cocina (Comandas)",
        description:
          "Usada para imprimir comandas para el área de preparación.",
        value: {
          nombre: "Bixolon SRP-350III",
          descripcion: "Cocina Fríos",
          tipo_impresion: "COCINA",
          activa: true,
        },
      },
    },
  } as ApiBodyOptions)
  @ApiResponse({
    status: 201,
    description: "Impresora creada exitosamente",
    type: ImpresoraEntity,
  })
  @ApiResponse({ status: 400, description: "Datos inválidos o incompletos" })
  async create(
    @Body() createImpresoraDto: CreateImpresoraDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ImpresoraEntity> {
    const establecimientoId = req.user.establecimiento_id;
    if (!establecimientoId) {
      throw new ForbiddenException(
        "No se pudo determinar el establecimiento del usuario desde el token de autenticación."
      );
    }
    createImpresoraDto.establecimiento_id = establecimientoId;
    return this.impresionService.create(createImpresoraDto);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.CAJERO)
  @ApiOperation({
    summary: "Listar todas las impresoras del establecimiento del usuario",
  })
  @ApiResponse({
    status: 200,
    description: "Lista de impresoras obtenida exitosamente",
    type: [ImpresoraEntity],
  })
  async findAll(@Req() req: AuthenticatedRequest): Promise<ImpresoraEntity[]> {
    return this.impresionService.findAll(req.user.establecimiento_id);
  }

  @Get(":id")
  @Roles(RoleName.ADMIN, RoleName.CAJERO)
  @ApiOperation({ summary: "Obtener una impresora por ID" })
  @ApiParam({ name: "id", description: "ID de la impresora" })
  @ApiResponse({
    status: 200,
    description: "Impresora obtenida exitosamente",
    type: ImpresoraEntity,
  })
  @ApiResponse({ status: 404, description: "Impresora no encontrada" })
  async findOne(
    @Param("id") id: string,
    @Req() req: AuthenticatedRequest
  ): Promise<ImpresoraEntity> {
    return this.impresionService.findOne(id, req.user.establecimiento_id);
  }

  @Put(":id")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Actualizar una impresora" })
  @ApiParam({ name: "id", description: "ID de la impresora" })
  @ApiBody({ type: UpdateImpresoraDto })
  @ApiResponse({
    status: 200,
    description: "Impresora actualizada exitosamente",
    type: ImpresoraEntity,
  })
  async update(
    @Param("id") id: string,
    @Body() updateImpresoraDto: UpdateImpresoraDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ImpresoraEntity> {
    return this.impresionService.update(
      id,
      updateImpresoraDto,
      req.user.establecimiento_id
    );
  }

  @Delete(":id")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Eliminar una impresora" })
  @ApiParam({ name: "id", description: "ID de la impresora" })
  @ApiResponse({ status: 200, description: "Impresora eliminada exitosamente" })
  async remove(
    @Param("id") id: string,
    @Req() req: AuthenticatedRequest
  ): Promise<void> {
    return this.impresionService.remove(id, req.user.establecimiento_id);
  }

  @Get("comanda/:pedidoId/pdf")
  async obtenerPdfComanda(
    @Param("pedidoId") pedidoId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    try {
      const pedido = await this.pedidosService.findOne(
        pedidoId,
        req.user.establecimiento_id
      );

      if (!pedido) {
        res.status(404).end("Pedido no encontrado.");
        return;
      }

      const pdfBuffer = await this.impresionService.generarPdfComanda(pedido);

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=comanda-${pedidoId}.pdf`,
      });
      res.end(pdfBuffer);
    } catch (error) {
      res.status(500).end("Error al generar el PDF de la comanda.");
    }
  }


  // @Post('comanda/:pedidoId/enviar')
  // @Roles(RoleName.ADMIN, RoleName.CAJERO)
  // @ApiOperation({ summary: 'Envía la comanda de un pedido a la impresora de cocina' })
  // @ApiParam({ name: 'pedidoId', description: 'ID del pedido a imprimir' })
  // @ApiResponse({ status: 200, description: 'Comanda enviada a la impresora con éxito' })
  // @ApiResponse({ status: 404, description: 'Pedido o impresora de cocina no encontrada' })
  // @ApiResponse({ status: 500, description: 'Error al enviar la comanda' })
  // async enviarComanda(
  //   @Param('pedidoId') pedidoId: string,
  //   @Req() req: AuthenticatedRequest,
  // ): Promise<{ message: string }> {
  //   try {
  //     const pedido = await this.pedidosService.findOne(pedidoId, req.user.establecimiento_id);
  //     if (!pedido) {
  //       throw new NotFoundException('Pedido no encontrado.');
  //     }
  //     await this.impresionService.enviarComandaAImpresora(pedido);
  //     return { message: 'Comanda enviada a la impresora con éxito.' };
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     throw new Error('Error al enviar la comanda a la impresora.');
  //   }
  // }



}
