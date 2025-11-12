import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { SyncChangelogEntity } from './entities/sync-changelog.entity';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WebSocketEventsService } from '../websocket/services/websocket-events.service';
import { SyncChangeDto } from './dto/receive-changes.dto'; 
import { UsuarioEntity } from '../modules/usuarios/entities/usuario.entity';
import { EstablecimientoEntity } from '../modules/establecimientos/entities/establecimiento.entity'; 
import { EstablecimientoConfiguracionPedidoEntity } from '../modules/establecimientos/entities/configuracion-pedidos.entity';
import { CategoriaEntity } from '../modules/categorias/entities/categoria.entity';
import { ClienteEntity } from '../modules/clientes/entities/cliente.entity';
import { CompraIngredienteEntity } from '../modules/compras/entities/compra-ingrediente.entity';
import { CuentaBancariaEntity } from '../modules/cuentas-banco/entities/cuenta-bancaria.entity';
import { FacturaEntity } from '../modules/facturas/entities/factura.entity';
import { FacturaPagosCliente } from '../modules/facturas/entities/factura-pagos-cliente.entity'; 
import { FacturaPedidoEntity } from '../modules/facturas/entities/factura-pedido.entity';
import { IngredienteEntity } from '../modules/ingredientes/entities/ingrediente.entity';
import { MedioPagoEntity } from '../modules/medios-pago/entities/medio-pago.entity';
import { MesaEntity } from '../modules/mesas/entities/mesa.entity';
import { MovimientoBancarioEntity } from '../modules/movimientos-bancarios/entities/movimiento-bancario.entity';
import { PagoEntity } from '../modules/pagos/entities/pago.entity';
import { PedidoEntity } from '../modules/pedidos/entities/pedido.entity';
import { PedidoItemEntity } from '../modules/pedidos/entities/pedido-item.entity';
import { ProductoEntity } from '../modules/productos/entities/producto.entity';
import { RecetaProductoEntity } from '../modules/productos/entities/receta-producto.entity';
import { ProveedorEntity } from '../modules/proveedores/entities/proveedor.entity';
import { RolEntity } from '../modules/roles/entities/rol.entity';
import { CierreCajaEntity } from '../modules/cierre-caja/entities/cierre-caja.entity';
import { SyncableEntity } from '../common/interfaces/syncable-entity.interface';


@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly isElectronApp: boolean;
  private readonly cloudApiUrl: string;
  private entityMap: Map<string, any>;
  private authToken: string | null = null; 

  constructor(
    @InjectRepository(SyncChangelogEntity)
    private syncChangelogRepository: Repository<SyncChangelogEntity>,
    @InjectRepository(EstablecimientoEntity) 
    private readonly establecimientoRepository: Repository<EstablecimientoEntity>,
    private configService: ConfigService,
    private httpService: HttpService,
    private websocketEventsService: WebSocketEventsService,
    private dataSource: DataSource,
  ) {
    this.isElectronApp = configService.get<string>('DB_ENGINE') === 'sqlite'; 
    this.cloudApiUrl = configService.get<string>('CLOUD_API_URL') || ''; 

    if (!this.cloudApiUrl && !this.isElectronApp) { 
      this.logger.warn('CLOUD_API_URL no está configurada en el archivo .env. Esto es crítico para la sincronización entre instancias.');
    }

    if (this.isElectronApp) {
      this.logger.log('SyncService inicializado en modo Electron (local).');
      setInterval(() => this.processLocalChanges(), 30000); 
    } else {
      this.logger.log('SyncService inicializado en modo AWS (nube).');
    }

    this.entityMap = new Map<string, any>();
    this.entityMap.set('UsuarioEntity', UsuarioEntity);
    this.entityMap.set('EstablecimientoEntity', EstablecimientoEntity);
    this.entityMap.set('EstablecimientoConfiguracionPedidoEntity', EstablecimientoConfiguracionPedidoEntity);
    this.entityMap.set('CategoriaEntity', CategoriaEntity);
    this.entityMap.set('ClienteEntity', ClienteEntity);
    this.entityMap.set('CompraIngredienteEntity', CompraIngredienteEntity);
    this.entityMap.set('CuentaBancariaEntity', CuentaBancariaEntity);
    this.entityMap.set('FacturaEntity', FacturaEntity);
    this.entityMap.set('FacturaPagosClienteEntity', FacturaPagosCliente); 
    this.entityMap.set('FacturaPedidoEntity', FacturaPedidoEntity);
    this.entityMap.set('IngredienteEntity', IngredienteEntity);
    this.entityMap.set('MedioPagoEntity', MedioPagoEntity);
    this.entityMap.set('MesaEntity', MesaEntity);
    this.entityMap.set('MovimientoBancarioEntity', MovimientoBancarioEntity);
    this.entityMap.set('PagoEntity', PagoEntity);
    this.entityMap.set('PedidoEntity', PedidoEntity);
    this.entityMap.set('PedidoItemEntity', PedidoItemEntity);
    this.entityMap.set('ProductoEntity', ProductoEntity);
    this.entityMap.set('RecetaProductoEntity', RecetaProductoEntity);
    this.entityMap.set('ProveedorEntity', ProveedorEntity);
    this.entityMap.set('RolEntity', RolEntity);
    this.entityMap.set('CierreCajaEntity', CierreCajaEntity);
  }

  setAuthToken(token: string): void {
    this.authToken = token;
    this.logger.log('Token de autenticación establecido para sincronización.');
  }

  private getAuthHeaders(): any { 
    if (!this.authToken) {
      this.logger.error('No hay token de autenticación disponible para la sincronización.');
      throw new Error('Autenticación requerida para la sincronización.');
    }
    return {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    };
  }

  async recordChange(
    entityUuid: string,
    entityName: string,
    operationType: 'INSERT' | 'UPDATE' | 'DELETE',
    changedAt: Date,
    establishmentId: string, 
    data: SyncableEntity | null = null, 
  ): Promise<void> {
    if (this.isElectronApp) {
      const change = this.syncChangelogRepository.create({
        id: undefined, 
        entity_uuid: entityUuid,
        entity_name: entityName,
        operation_type: operationType,
        changed_at: changedAt,
        synced_to_cloud: false,
        error_message: null, 
        data: data, 
      });
      await this.syncChangelogRepository.save(change);
      this.logger.debug(`Cambio local registrado: ${operationType} ${entityName} - ${entityUuid}`);
    } else {
      this.logger.debug(`Cambio en AWS: ${operationType} ${entityName} - ${entityUuid}. Emitiendo evento WebSocket al establecimiento ${establishmentId}.`);
      this.websocketEventsService.emitToEstablishment(
        establishmentId,
        'sync:data-changed',
        { entityName, entityUuid, changedAt, operationType, establishmentId }
      );
    }
  }

  async processLocalChanges(): Promise<void> {
    if (!this.isElectronApp) return;

    if (!this.cloudApiUrl) {
      this.logger.error('CLOUD_API_URL no está configurada. No se pueden enviar cambios a la nube.');
      return;
    }
    if (!this.authToken) {
        this.logger.warn('No hay token de autenticación para enviar cambios. Saltando sincronización local.');
        return;
    }

    this.logger.log('Procesando cambios locales pendientes...');
    let pendingChanges: SyncChangelogEntity[] = [];
    try {
        pendingChanges = await this.syncChangelogRepository.find({
            where: { synced_to_cloud: false },
            order: { recorded_at: 'ASC' },
        });
    } catch (error: any) {
        if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
            this.logger.warn(`ADVERTENCIA: Se capturó un TypeError al buscar cambios pendientes. Esto puede ocurrir si la tabla sync_changelog está vacía o recién creada. Asumiendo que no hay cambios pendientes.`, error.message);
            pendingChanges = []; 
        } else {
            this.logger.error('Error al obtener cambios locales pendientes:', error.message);
            return; 
        }
    }


    if (pendingChanges.length === 0) {
      this.logger.log('No hay cambios locales pendientes.');
      return;
    }

    this.logger.log(`Enviando ${pendingChanges.length} cambios a la nube...`);
    try {
      const changesToSend: SyncChangeDto[] = pendingChanges.map(change => ({
        entity_uuid: change.entity_uuid,
        entity_name: change.entity_name,
        operation_type: change.operation_type,
        changed_at: change.changed_at,
        data: change.data, 
      }));

      await firstValueFrom(
        this.httpService.post(
          `${this.cloudApiUrl}/sync/receive-changes`,
          { changes: changesToSend },
          this.getAuthHeaders() 
        )
      );

      for (const change of pendingChanges) {
        change.synced_to_cloud = true;
        await this.syncChangelogRepository.save(change);
      }
      this.logger.log(`Se han sincronizado ${pendingChanges.length} cambios locales con éxito.`);
    } catch (error) {
      this.logger.error('Error al sincronizar cambios locales con la nube:', error.message);
    }
  }

  async handleRemoteChange(data: { entityName: string, entityUuid: string, changedAt: Date, operationType: 'INSERT' | 'UPDATE' | 'DELETE', establishmentId: string }): Promise<void> {
    if (!this.isElectronApp) return;

    if (!this.cloudApiUrl) {
      this.logger.error('CLOUD_API_URL no está configurada. No se pueden recibir cambios de la nube.');
      return;
    }
    if (!this.authToken) {
        this.logger.warn('No hay token de autenticación para recibir cambios remotos. Saltando.');
        return;
    }

    this.logger.log(`Recibida notificación de cambio desde AWS para establecimiento ${data.establishmentId}: ${data.operationType} ${data.entityName} - ${data.entityUuid}`);

    const entityClass = this.entityMap.get(data.entityName);
    if (!entityClass) {
      this.logger.error(`Entidad desconocida para sincronización: ${data.entityName}. No se puede procesar el cambio remoto.`);
      return;
    }

    if (data.operationType === 'DELETE') { 
      await this.syncEntity(entityClass, data.entityUuid, null, data.operationType); 
    } else {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            `${this.cloudApiUrl}/sync/data/${data.entityName.toLowerCase()}/${data.entityUuid}?establishmentId=${data.establishmentId}`,
            this.getAuthHeaders() 
          )
        );
        const remoteData: SyncableEntity = response.data; 

        await this.syncEntity(entityClass, data.entityUuid, remoteData, data.operationType); 
      } catch (error) {
        this.logger.error(`Error al obtener datos remotos para ${data.entityName} ${data.entityUuid}: ${error.message}`);
      }
    }
  }

  async getEntityDataFromCloud(entityName: string, entityUuid: string, establishmentId: string): Promise<SyncableEntity | null> { 
    if (this.isElectronApp) {
      this.logger.error('getEntityDataFromCloud llamado en la aplicación Electron. Esto es un error.');
      throw new ForbiddenException('Acceso denegado: esta operación solo es para el backend de la nube.');
    }

    const entityClass = this.entityMap.get(entityName);
    if (!entityClass) {
      this.logger.error(`Solicitud de datos para entidad desconocida: ${entityName}.`);
      throw new NotFoundException(`Entidad '${entityName}' no encontrada o no es sincronizable.`);
    }

    const repository = this.dataSource.getRepository(entityClass);
    let entity: SyncableEntity | null; 

    if (entityName === 'EstablecimientoEntity' || entityName === 'RolEntity') { 
      entity = await repository.findOneBy({ id: entityUuid } as FindOptionsWhere<any>) as SyncableEntity | null; 
    } else if (entityName === 'FacturaPagosClienteEntity') { 
      entity = await repository.findOne({ 
          where: { id: entityUuid } as FindOptionsWhere<any>,
          relations: ['factura'] 
      }) as SyncableEntity | null; 
      if (entity && (entity as any).factura && (entity as any).factura.establecimiento_id !== establishmentId) {
          this.logger.warn(`FacturaPagosCliente ${entityUuid} encontrada pero no pertenece al establecimiento ${establishmentId} a través de su factura.`);
          throw new NotFoundException(`Entidad con ID '${entityUuid}' no encontrada o no pertenece al establecimiento especificado.`);
      }
    }
    else {
      if ('establecimiento_id' in entityClass.prototype) {
        entity = await repository.findOneBy({ 
          id: entityUuid, 
          establecimiento_id: establishmentId 
        } as FindOptionsWhere<any>) as SyncableEntity | null; 
        this.logger.debug(`Buscando ${entityName} por ID '${entityUuid}' y establecimiento '${establishmentId}'.`);
      } else {
        this.logger.warn(`Entidad ${entityName} no tiene 'establecimiento_id'. Buscando solo por ID.`);
        entity = await repository.findOneBy({ id: entityUuid } as FindOptionsWhere<any>) as SyncableEntity | null; 
      }
    }
    
    if (!entity) {
      this.logger.warn(`Entidad ${entityName} con UUID ${entityUuid} no encontrada o no pertenece al establecimiento ${establishmentId}.`);
      throw new NotFoundException(`Entidad con ID '${entityUuid}' no encontrada o no pertenece al establecimiento especificado.`);
    }

    return entity;
  }

  async processReceivedChanges(changes: SyncChangeDto[], establishmentId: string): Promise<number> {
    if (this.isElectronApp) {
      this.logger.error('processReceivedChanges llamado en la aplicación Electron. Esto es un error.');
      throw new ForbiddenException('Acceso denegado: esta operación solo es para el backend de la nube.');
    }

    let processedCount = 0;
    for (const change of changes) {
      try {
        const entityClass = this.entityMap.get(change.entity_name);
        if (!entityClass) {
          this.logger.warn(`Entidad desconocida '${change.entity_name}' en el cambio recibido. Saltando.`);
          continue;
        }

        const repository = this.dataSource.getRepository(entityClass);
        let localEntity: SyncableEntity | null = null; 

        if (change.entity_name === 'EstablecimientoEntity' || change.entity_name === 'RolEntity') {
            localEntity = await repository.findOneBy({ id: change.entity_uuid } as FindOptionsWhere<any>) as SyncableEntity | null; 
        } else if (change.entity_name === 'FacturaPagosClienteEntity') { 
            localEntity = await repository.findOne({ 
                where: { id: change.entity_uuid } as FindOptionsWhere<any>,
                relations: ['factura'] 
            }) as SyncableEntity | null; 
            if (localEntity && (localEntity as any).factura && (localEntity as any).factura.establecimiento_id !== establishmentId) {
                this.logger.warn(`FacturaPagosCliente ${change.entity_uuid} recibida pero no pertenece al establecimiento ${establishmentId} en AWS. Saltando.`);
                continue; 
            }
        }
        else {
            if ('establecimiento_id' in entityClass.prototype) {
                localEntity = await repository.findOneBy({ 
                    id: change.entity_uuid, 
                    establecimiento_id: establishmentId 
                } as FindOptionsWhere<any>) as SyncableEntity | null; 
            } else {
                this.logger.warn(`Entidad ${change.entity_name} no tiene 'establecimiento_id'. Buscando solo por ID.`);
                localEntity = await repository.findOneBy({ id: change.entity_uuid } as FindOptionsWhere<any>) as SyncableEntity | null; 
            }
        }

        const remoteChangedAt = new Date(change.changed_at);

        if (change.operation_type === 'DELETE') {
          if (localEntity) {
            if (remoteChangedAt >= localEntity.updated_at) { 
                await repository.delete(change.entity_uuid);
                this.logger.log(`Entidad eliminada en AWS: ${change.entity_name} - ${change.entity_uuid}`);
                processedCount++;
                this.websocketEventsService.emitToEstablishment(
                    establishmentId,
                    'sync:data-changed',
                    { entityName: change.entity_name, entityUuid: change.entity_uuid, changedAt: new Date(), operationType: 'DELETE', establishmentId }
                );
            } else {
                this.logger.debug(`Conflicto de eliminación para ${change.entity_name} ${change.entity_uuid}: la versión en AWS es más reciente. No se elimina.`);
            }
          } else {
            this.logger.debug(`Entidad a eliminar ${change.entity_name} - ${change.entity_uuid} no encontrada en AWS.`);
          }
        } else { 
          if (!change.data) {
            this.logger.error(`Datos nulos para operación ${change.operation_type} en ${change.entity_name} - ${change.entity_uuid}.`);
            continue; 
          }
          const dataToApply: SyncableEntity = change.data; 

          if (localEntity) {
            if (remoteChangedAt > localEntity.updated_at) { 
              repository.merge(localEntity, dataToApply); 
              await repository.save(localEntity);
              this.logger.log(`Entidad actualizada en AWS: ${change.entity_name} - ${change.entity_uuid}`);
              processedCount++;
              this.websocketEventsService.emitToEstablishment(
                  establishmentId,
                  'sync:data-changed',
                  { entityName: change.entity_name, entityUuid: change.entity_uuid, changedAt: new Date(), operationType: 'UPDATE', establishmentId }
              );
            } else {
              this.logger.debug(`Conflicto de sincronización para ${change.entity_name} ${change.entity_uuid}: la versión en AWS es más reciente o igual. No se actualiza.`);
            }
          } else {
            const newEntity = repository.create(dataToApply); 
            await repository.save(newEntity);
            this.logger.log(`Entidad insertada en AWS: ${change.entity_name} - ${change.entity_uuid}`);
            processedCount++;
            this.websocketEventsService.emitToEstablishment(
                establishmentId,
                'sync:data-changed',
                { entityName: change.entity_name, entityUuid: change.entity_uuid, changedAt: new Date(), operationType: 'INSERT', establishmentId }
            );
          }
        }
      } catch (error) {
        this.logger.error(`Error al procesar cambio para ${change.entity_name} ${change.entity_uuid}: ${error.message}`);
      }
    }
    return processedCount;
  }

  private async syncEntity<T extends SyncableEntity>( 
    entityClass: new () => T,
    entityUuid: string,
    remoteData: T | null, 
    operationType: 'INSERT' | 'UPDATE' | 'DELETE'
  ): Promise<void> {
    const repository = this.dataSource.getRepository(entityClass);
    let localEntity: T | null = null;

    try {
      localEntity = await repository.findOneBy({ id: entityUuid } as FindOptionsWhere<T>) as T | null; 

      if (operationType === 'DELETE') {
        if (localEntity) {
          await repository.delete(entityUuid);
          this.logger.log(`Entidad eliminada localmente: ${entityClass.name} - ${entityUuid}`);
        } else {
          this.logger.debug(`Entidad a eliminar ${entityClass.name} - ${entityUuid} no encontrada localmente.`);
        }
      } else { 
        if (!remoteData) {
          this.logger.error(`Datos remotos nulos para operación ${operationType} en ${entityClass.name} - ${entityUuid}`);
          return;
        }

        const remoteUpdatedAt = new Date(remoteData.updated_at);

        if (localEntity) {
          if (remoteUpdatedAt > localEntity.updated_at) { 
            repository.merge(localEntity, remoteData); 
            await repository.save(localEntity);
            this.logger.log(`Entidad actualizada localmente: ${entityClass.name} - ${entityUuid}`);
          } else {
            this.logger.debug(`Conflicto de sincronización para ${entityClass.name} ${entityUuid}: la versión local es más reciente o igual. No se actualiza.`);
          }
        } else {
          const newEntity = repository.create(remoteData); 
          await repository.save(newEntity);
          this.logger.log(`Entidad insertada localmente: ${entityClass.name} - ${entityUuid}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error al sincronizar entidad ${entityClass.name} ${entityUuid}: ${error.message}`);
    }
  }
  async bulkSyncAllRelevantData(): Promise<void> { 
    if (!this.isElectronApp || !this.authToken || !this.cloudApiUrl) {
        this.logger.warn('No se puede realizar la sincronización masiva: no es Electron, no hay token o no hay URL de la nube.');
        return;
    }

    this.logger.log('Iniciando sincronización masiva de todos los datos relevantes.');
    let localEstablishmentIds: string[] = [];
    try {
        const localEstablishments = await this.establecimientoRepository.find({ select: ['id'] });
        localEstablishmentIds = localEstablishments.map(e => e.id);
        this.logger.log(`Encontrados ${localEstablishmentIds.length} establecimientos locales: ${localEstablishmentIds.join(', ')}`);
    } catch (error) {
        this.logger.error(`Error al obtener establecimientos locales para sincronización masiva: ${error.message}`);
    }
    const syncableEntityNames = Array.from(this.entityMap.keys());

    for (const entityName of syncableEntityNames) {
        try {
            const entityClass = this.entityMap.get(entityName);
            let requiresEstablishmentFilter = false;
            if (entityName === 'FacturaPagosClienteEntity') {
                requiresEstablishmentFilter = true; 
            } else if (entityName !== 'EstablecimientoEntity' && entityName !== 'RolEntity') { 
                if ('establecimiento_id' in entityClass.prototype) {
                    requiresEstablishmentFilter = true;
                }
            }

            if (requiresEstablishmentFilter) {
                // Sincronizar para cada ID de establecimiento local
                for (const estId of localEstablishmentIds) {
                    const apiUrl = `${this.cloudApiUrl}/sync/all-for-establishment/${entityName}?establishmentId=${estId}`;
                    this.logger.debug(`Solicitando todos los datos para ${entityName} (establecimiento ${estId}) desde: ${apiUrl}`);
                    const response = await firstValueFrom(
                        this.httpService.get(apiUrl, this.getAuthHeaders())
                    );
                    const remoteEntities: SyncableEntity[] = response.data;
                    this.logger.log(`Recibidos ${remoteEntities.length} entidades de ${entityName} para establecimiento ${estId}. Aplicando cambios...`);
                    for (const remoteData of remoteEntities) {
                        await this.syncEntity(entityClass, remoteData.id, remoteData, 'UPDATE'); 
                    }
                }
            } else {
                // Sincronizar entidades globales una sola vez (EstablecimientoEntity, RolEntity, etc.)
                const apiUrl = `${this.cloudApiUrl}/sync/all-for-establishment/${entityName}`; 
                this.logger.debug(`Solicitando todas las entidades globales de ${entityName} desde: ${apiUrl}`);
                const response = await firstValueFrom(
                    this.httpService.get(apiUrl, this.getAuthHeaders())
                );
                const remoteEntities: SyncableEntity[] = response.data;
                this.logger.log(`Recibidos ${remoteEntities.length} entidades globales de ${entityName}. Aplicando cambios...`);
                for (const remoteData of remoteEntities) {
                    await this.syncEntity(entityClass, remoteData.id, remoteData, 'UPDATE');
                }
            }
            this.logger.log(`Sincronización masiva para ${entityName} completada.`);

        } catch (error) {
            this.logger.error(`Error durante la sincronización masiva para ${entityName}: ${error.message}`);
        }
    }
    this.logger.log('Sincronización masiva de todos los datos relevantes completada.');
  }
}