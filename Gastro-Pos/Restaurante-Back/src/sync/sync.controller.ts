import { Controller, Get, Param, Query, UseGuards, Req, NotFoundException, BadRequestException, Logger, Post, Body, ForbiddenException } from '@nestjs/common';
import { SyncService } from './sync.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../common/constants/app.constants';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { SyncChangeDto, ReceiveChangesDto } from './dto/receive-changes.dto';
import { DataSource, FindOptionsWhere } from 'typeorm';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(
    private readonly syncService: SyncService,
    private readonly dataSource: DataSource,
  ) {}
  @Get('data/:entityName/:entityUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO, RoleName.COCINERO, RoleName.MESERO, RoleName.DOMICILIARIO) 
  async getEntityData(
    @Param('entityName') entityName: string,
    @Param('entityUuid') entityUuid: string,
    @Query('establishmentId') establishmentId: string, 
  ) {
    this.logger.log(`Recibida solicitud de datos para ${entityName} con UUID ${entityUuid} para establecimiento ${establishmentId}`);
    return this.syncService.getEntityDataFromCloud(entityName, entityUuid, establishmentId);
  }

  @Get('all-for-establishment/:entityName')
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO, RoleName.COCINERO, RoleName.MESERO, RoleName.DOMICILIARIO) 
  async getAllEntitiesForEstablishment(
      @Param('entityName') entityName: string,
      @Query('establishmentId') establishmentId: string | undefined,
      @Req() req: AuthenticatedRequest 
  ) {
      const entityClass = this.syncService['entityMap'].get(entityName); 
      if (!entityClass) {
          throw new NotFoundException(`Entidad '${entityName}' no encontrada o no es sincronizable.`);
      }
      const repository = this.dataSource.getRepository(entityClass);
      let entities: any[];
      const whereCondition: FindOptionsWhere<any> = {};
      const isEstablishmentSpecific = ('establecimiento_id' in entityClass.prototype) || entityName === 'FacturaPagosClienteEntity';
      if (isEstablishmentSpecific) {
          if (!establishmentId) {
              throw new BadRequestException(`El ID del establecimiento es requerido para la entidad '${entityName}'.`);
          }
          if (entityName === 'FacturaPagosClienteEntity') {
              entities = await repository.find({
                  relations: ['factura'], 
                  where: {
                      factura: {
                          establecimiento_id: establishmentId
                      }
                  }
              });
              this.logger.debug(`Obteniendo FacturaPagosCliente para establecimiento ${establishmentId} con join.`);
          } else {
              whereCondition.establecimiento_id = establishmentId;
              entities = await repository.find({ where: whereCondition });
              this.logger.debug(`Obteniendo ${entityName} para establecimiento ${establishmentId}.`);
          }
      } else {
          entities = await repository.find();
          this.logger.debug(`Obteniendo todas las entidades globales de ${entityName}.`);
      }
      
      return entities;
  }
  @Post('receive-changes')
  @UseGuards(AuthGuard('jwt'), RolesGuard) 
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.CAJERO, RoleName.COCINERO, RoleName.MESERO, RoleName.DOMICILIARIO) 
    async receiveChanges(
    @Body() receiveChangesDto: ReceiveChangesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const establishmentId = req.user.establecimiento_id; 
    if (!establishmentId) {
      throw new ForbiddenException('No se pudo determinar el establecimiento del usuario autenticado.');
    }
    this.logger.log(`Recibidos ${receiveChangesDto.changes.length} cambios desde un cliente para el establecimiento ${establishmentId}.`);
    const processedCount = await this.syncService.processReceivedChanges(receiveChangesDto.changes, establishmentId);
    return { message: `Se procesaron ${processedCount} cambios exitosamente.` };
  }
}