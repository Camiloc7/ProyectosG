import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, UnauthorizedException, Headers, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { EstablecimientosService } from './establecimientos.service';
import { CreateEstablecimientoDto } from './dto/create-establecimiento.dto';
import { UpdateEstablecimientoDto } from './dto/update-establecimiento.dto';
import { EstablecimientoEntity } from './entities/establecimiento.entity';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RoleName } from '../../common/constants/app.constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Establecimientos')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('establecimientos')
export class EstablecimientosController {
  constructor(private readonly establecimientosService: EstablecimientosService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo establecimiento' })
  @ApiResponse({ status: 201, description: 'Establecimiento creado exitosamente', type: EstablecimientoEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiBody({ type: CreateEstablecimientoDto })
  async create(@Body() createEstablecimientoDto: CreateEstablecimientoDto): Promise<EstablecimientoEntity> {
    return this.establecimientosService.create(createEstablecimientoDto);
  }

  @Get('listar-por-nit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todos los establecimientos agrupados por NIT' })
  @ApiResponse({
    status: 200,
    description: 'Lista agrupada por NIT',
  })
  @Public() 
  async listarAgrupadosPorNit() {
    return this.establecimientosService.listarAgrupadosPorNit();
  }

  @Get('listar-por-nit/:nit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar los establecimientos asociados a un NIT específico' })
  @ApiResponse({ status: 200, description: 'Establecimientos encontrados por NIT' })
  @ApiResponse({ status: 404, description: 'No se encontraron establecimientos con ese NIT' })
  @Public() 
  async listarPorNit(@Param('nit') nit: string) {
    return this.establecimientosService.listarPorNit(nit);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todos los establecimientos' })
  @ApiResponse({ status: 200, description: 'Lista de establecimientos', type: [EstablecimientoEntity] })
  @ApiQuery({ name: 'activo', required: false, type: 'boolean', description: 'Filtrar por establecimientos activos (true) o inactivos (false). Si no se especifica, devuelve todos.' })
  async findAll(@Query('activo') activo?: string): Promise<EstablecimientoEntity[]> {
    let filterActivo: boolean | undefined;
    if (activo === undefined || activo === '') {
      filterActivo = undefined;
    } else {
      filterActivo = activo.toLowerCase() === 'true';
    }
    return this.establecimientosService.findAll(filterActivo);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un establecimiento por ID' })
  @ApiResponse({ status: 200, description: 'Establecimiento encontrado', type: EstablecimientoEntity })
  @ApiResponse({ status: 404, description: 'Establecimiento no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del establecimiento (UUID)', type: 'string' })
  async findOne(@Param('id') id: string): Promise<EstablecimientoEntity> {
    return this.establecimientosService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar un establecimiento por ID' })
  @ApiResponse({ status: 200, description: 'Establecimiento actualizado exitosamente', type: EstablecimientoEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Establecimiento no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del establecimiento (UUID)', type: 'string' })
  @ApiBody({ type: UpdateEstablecimientoDto })
  async update(@Param('id') id: string, @Body() updateEstablecimientoDto: UpdateEstablecimientoDto): Promise<EstablecimientoEntity> {
    return this.establecimientosService.update(id, updateEstablecimientoDto);
  }


  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar un establecimiento por ID' })
  @ApiResponse({ status: 204, description: 'Establecimiento eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Establecimiento no encontrado' })
  @ApiParam({ name: 'id', description: 'ID del establecimiento (UUID)', type: 'string' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.establecimientosService.remove(id);
  }

  @Post('activar-licencia')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar una licencia para un establecimiento' })
  @Public() 
  @ApiResponse({ status: 200, description: 'Licencia activada exitosamente' })
  @ApiResponse({ status: 404, description: 'Clave de licencia no encontrada' })
  @ApiResponse({ status: 409, description: 'La licencia ya está activa en otro dispositivo' })
  @ApiResponse({ status: 401, description: 'La licencia ha expirado o no está activa' })
  async activateLicense(@Body() activateDto: ActivateLicenseDto): Promise<any> {
    const { licenciaKey, dispositivoId } = activateDto;
    const establecimiento = await this.establecimientosService.activateLicense(licenciaKey, dispositivoId);
    return { mensaje: 'Licencia activada exitosamente', establecimientoId: establecimiento.id };
  }


  @Get('verificar-licencia/:id')
  @ApiOperation({ summary: 'Verificar la validez de la licencia de un establecimiento' })
  @Public() 
  @ApiResponse({ status: 200, description: 'Verificación exitosa' })
  @ApiResponse({ status: 401, description: 'Licencia inválida, expirada o usada en otro dispositivo' })
  @ApiParam({ name: 'id', description: 'ID del establecimiento (UUID)', type: 'string' })
  async verifyLicense(@Param('id') id: string, @Headers('x-device-id') dispositivoId: string): Promise<{ valido: boolean }> {
    const esValido = await this.establecimientosService.verifyLicense(id, dispositivoId);
    if (!esValido) {
      throw new UnauthorizedException('Licencia inválida o expirada.');
    }
    return { valido: true };
  }
}
 