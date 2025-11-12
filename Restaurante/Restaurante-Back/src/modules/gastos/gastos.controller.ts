import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GastosService } from './gastos.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { GastoEntity } from './entities/gasto.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/app.constants';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { CierreCajaService } from '../cierre-caja/cierre-caja.service'; 

@ApiTags('Gastos')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('gastos')
export class GastosController {
  constructor(
    private readonly gastosService: GastosService,
    private readonly cierreCajaService: CierreCajaService, 
  ) {}

@Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.CAJERO, RoleName.ADMIN, RoleName.SUPERVISOR)
  @ApiOperation({ summary: 'Registra un nuevo gasto operacional para el turno de caja activo.' })
  @ApiResponse({ status: 201, description: 'Gasto registrado exitosamente.', type: GastoEntity })
  @ApiResponse({ status: 400, description: 'Datos de gasto inválidos.' })
  async create(
    @Body() createGastoDto: CreateGastoDto,
    @Req() req: AuthenticatedRequest
  ): Promise<GastoEntity> {
    const usuarioId = req.user.id;
    const establecimientoId = req.user.establecimiento_id;

    const cierreActivo = await this.cierreCajaService.obtenerCierreCajaActivo(
      establecimientoId,
      usuarioId,
    );

    if (!cierreActivo) {
      throw new BadRequestException('No existe un turno de caja activo para registrar este gasto.');
    }

    return this.gastosService.createWithCierre(
      createGastoDto.monto,
      createGastoDto.descripcion,
      usuarioId,
      establecimientoId,
      cierreActivo.id,
    );
  }
}