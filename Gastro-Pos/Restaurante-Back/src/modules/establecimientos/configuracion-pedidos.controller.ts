import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EstablecimientoConfiguracionPedidoService } from './configuracion-pedidos.service';
import { CreateEstablecimientoConfiguracionPedidoDto } from './dto/create-configuracion-pedidos.dto';
import { UpdateEstablecimientoConfiguracionPedidoDto } from './dto/update-configuracion-pedidos.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EstablecimientoConfiguracionPedidoEntity } from './entities/configuracion-pedidos.entity';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('Configuración de Pedidos')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('configuracion-pedidos')
export class EstablecimientoConfiguracionPedidoController {
  constructor(
    private readonly establecimientoConfiguracionPedidoService: EstablecimientoConfiguracionPedidoService,
  ) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear la configuración de pedidos para un establecimiento' })
  @ApiResponse({
    status: 201,
    description: 'Configuración de pedidos creada exitosamente',
    type: EstablecimientoConfiguracionPedidoEntity,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiBody({ type: CreateEstablecimientoConfiguracionPedidoDto })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createEstablecimientoConfiguracionPedidoDto: CreateEstablecimientoConfiguracionPedidoDto,
  ): Promise<EstablecimientoConfiguracionPedidoEntity> {
    createEstablecimientoConfiguracionPedidoDto.establecimiento_id = req.user.establecimiento_id;
    return this.establecimientoConfiguracionPedidoService.create(
      createEstablecimientoConfiguracionPedidoDto,
    );
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.COCINERO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener la configuración de pedidos de un establecimiento' })
  @ApiResponse({
    status: 200,
    description: 'Configuración de pedidos encontrada',
    type: EstablecimientoConfiguracionPedidoEntity,
  })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async findOne(
    @Req() req: AuthenticatedRequest,
  ): Promise<EstablecimientoConfiguracionPedidoEntity> {
    return this.establecimientoConfiguracionPedidoService.findOneByEstablecimientoId(
      req.user.establecimiento_id,
    );
  }

  
  @Patch() 
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar la configuración de pedidos de un establecimiento' })
  @ApiResponse({
    status: 200,
    description: 'Configuración de pedidos actualizada exitosamente',
    type: EstablecimientoConfiguracionPedidoEntity,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  @ApiBody({ type: UpdateEstablecimientoConfiguracionPedidoDto })
  async update(
    @Req() req: AuthenticatedRequest,
    @Body() updateEstablecimientoConfiguracionPedidoDto: UpdateEstablecimientoConfiguracionPedidoDto,
  ): Promise<EstablecimientoConfiguracionPedidoEntity> {
    return this.establecimientoConfiguracionPedidoService.update(
      req.user.establecimiento_id,
      updateEstablecimientoConfiguracionPedidoDto,
    );
  }
}