import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { CierreCajaService } from './cierre-caja.service';
import { CreateCierreCajaDto } from './dto/create-cierre-caja.dto';
import { UpdateCierreCajaDto } from './dto/update-cierre-caja.dto';
import { GetCierreCajaReportDto } from './dto/get-cierre-caja-report.dto';
import { CierreCajaEntity } from './entities/cierre-caja.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { RolesService } from '../roles/roles.service';
import { RolEntity } from '../roles/entities/rol.entity';
import { DenominacionDto } from './dto/denominacion.dto';

@ApiTags('Cierres de Caja')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('cierres-caja')
export class CierreCajaController implements OnModuleInit {
  private adminRole: RolEntity;
  private supervisorRole: RolEntity;
  private cajeroRole: RolEntity;

  constructor(
    private readonly cierreCajaService: CierreCajaService,
    private readonly rolesService: RolesService,
  ) { }

  async onModuleInit() {
    try {
      this.adminRole = await this.rolesService.findOneByName(RoleName.ADMIN);
      this.supervisorRole = await this.rolesService.findOneByName(RoleName.SUPERVISOR);
      this.cajeroRole = await this.rolesService.findOneByName(RoleName.CAJERO);
    } catch (error) {
      console.error('CierreCajaController: Error al cargar roles en onModuleInit:', error.message);
    }
  }

  @Post('apertura')
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.CAJERO, RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Abre un nuevo turno de caja para un cajero.' })
  @ApiResponse({ status: 201, description: 'Turno de caja abierto exitosamente.', type: CierreCajaEntity })
  @ApiResponse({ status: 400, description: 'Ya existe un turno abierto para este cajero/establecimiento.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        denominaciones_apertura: {
          type: 'object',
          description: 'Recuento de billetes y monedas al inicio del turno.',
          example: {
            '100000': 1,
            '50000': 2,
            '1000': 5
          },
        },
      },
      required: ['denominaciones_apertura'],
    },
  })
  async abrirCaja(
    @Body() createCierreCajaDto: CreateCierreCajaDto,
    @Req() req: AuthenticatedRequest
  ): Promise<CierreCajaEntity> {
    createCierreCajaDto.usuarioCajeroId = req.user.id;
    createCierreCajaDto.establecimientoId = req.user.establecimiento_id;
    return this.cierreCajaService.abrirCaja(createCierreCajaDto);
  }

  @Post('cierre')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.CAJERO, RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Cierra el turno de caja activo para un cajero.' })
  @ApiResponse({ status: 200, description: 'Turno de caja cerrado exitosamente.', type: CierreCajaEntity })
  @ApiResponse({ status: 404, description: 'No se encontró un turno abierto para cerrar.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        denominaciones_cierre: {
          type: 'object',
          description: 'Recuento de billetes y monedas al final del turno.',
          example: {
            '100000': 1,
            '50000': 2,
            '1000': 5
          },
        },
        observaciones: { type: 'string', description: 'Notas opcionales del cierre.' },
      },
      required: ['denominaciones_cierre'],
    },
  })
  async cerrarCaja(
    @Body() updateCierreCajaDto: UpdateCierreCajaDto,
    @Req() req: AuthenticatedRequest
  ): Promise<CierreCajaEntity> {
    updateCierreCajaDto.usuarioCajeroId = req.user.id;
    updateCierreCajaDto.establecimientoId = req.user.establecimiento_id;
    return this.cierreCajaService.cerrarCaja(updateCierreCajaDto);
  }


  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtiene un listado de cierres de caja, con filtros opcionales.' })
  @ApiResponse({ status: 200, description: 'Listado de cierres de caja.', type: [CierreCajaEntity] })
  async obtenerCierresCaja(@Query() query: GetCierreCajaReportDto, @Req() req: AuthenticatedRequest): Promise<CierreCajaEntity[]> {
    query.establecimientoId = req.user.establecimiento_id;
    query.usuarioCajeroId = req.user.id;
    return this.cierreCajaService.obtenerCierresCaja(query);
  }

  @Get('activo')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.CAJERO, RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Verifica si un cajero tiene un turno de caja activo.' })
  @ApiResponse({ status: 200, description: 'Información del turno activo o null si no hay.', type: CierreCajaEntity })
  @ApiResponse({ status: 204, description: 'No hay turno activo para el cajero/establecimiento.' })
  async obtenerCierreCajaActivo(@Req() req: AuthenticatedRequest): Promise<CierreCajaEntity | null> {
    const estId = req.user.establecimiento_id;
    const cajeroId = req.user.id;
    const cierreActivo = await this.cierreCajaService.obtenerCierreCajaActivo(estId, cajeroId);
    if (!cierreActivo) {
      return null;
    }
    return cierreActivo;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO)
  @ApiOperation({ summary: 'Obtiene los detalles de un cierre de caja específico por su ID.' })
  @ApiResponse({ status: 200, description: 'Detalles del cierre de caja.', type: CierreCajaEntity })
  @ApiResponse({ status: 404, description: 'Cierre de caja no encontrado.' })
  @ApiParam({ name: 'id', description: 'ID del cierre de caja (UUID)', type: 'string' })
  async obtenerCierreCajaPorId(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<CierreCajaEntity> {
    const cierre = await this.cierreCajaService.obtenerCierreCajaPorId(id);

    if (req.user.rol_id === this.cajeroRole?.id && cierre.usuario_cajero_id !== req.user.id) {
      throw new ForbiddenException('No tiene permiso para ver este cierre de caja.');
    }

    return cierre;
  }
}