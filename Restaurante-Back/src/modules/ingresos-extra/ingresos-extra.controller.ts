import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IngresosExtraService } from './ingresos-extra.service';
import { CreateIngresoExtraDto } from './dto/create-ingreso-extra.dto';
import { IngresoExtraEntity } from './entities/ingreso-extra.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { CierreCajaService } from '../cierre-caja/cierre-caja.service';

@ApiTags('Ingresos Extra')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('ingresos-extra')
export class IngresosExtraController {
  constructor(
    private readonly ingresosExtraService: IngresosExtraService,
    private readonly cierreCajaService: CierreCajaService,
  ) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.CAJERO, RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Registra un nuevo ingreso extra para el turno de caja activo.' })
  @ApiResponse({ status: 201, description: 'Ingreso extra registrado exitosamente.', type: IngresoExtraEntity })
  @ApiResponse({ status: 400, description: 'Datos de ingreso extra inválidos.' })
  async create(
    @Body() createIngresoExtraDto: CreateIngresoExtraDto,
    @Req() req: AuthenticatedRequest
  ): Promise<IngresoExtraEntity> {
    const usuarioId = req.user.id;
    const establecimientoId = req.user.establecimiento_id;
    const cierreActivo = await this.cierreCajaService.obtenerCierreCajaActivo(
      establecimientoId,
      usuarioId,
    );
    if (!cierreActivo) {
      throw new BadRequestException('No existe un turno de caja activo para registrar este ingreso extra.');
    }
    createIngresoExtraDto.usuario_registro_id = usuarioId;
    createIngresoExtraDto.establecimiento_id = establecimientoId;
    createIngresoExtraDto.cierre_caja_id = cierreActivo.id;
    return this.ingresosExtraService.create(createIngresoExtraDto);
  }
}