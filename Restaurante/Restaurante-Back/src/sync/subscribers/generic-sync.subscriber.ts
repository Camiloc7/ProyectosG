import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { SyncService } from '../sync.service';
import { SyncableEntity } from '../../common/interfaces/syncable-entity.interface'; 
import { UsuarioEntity } from '../../modules/usuarios/entities/usuario.entity';
import { EstablecimientoEntity } from '../../modules/establecimientos/entities/establecimiento.entity';
import { EstablecimientoConfiguracionPedidoEntity } from '../../modules/establecimientos/entities/configuracion-pedidos.entity';
import { CategoriaEntity } from '../../modules/categorias/entities/categoria.entity';
import { ClienteEntity } from '../../modules/clientes/entities/cliente.entity';
import { CompraIngredienteEntity } from '../../modules/compras/entities/compra-ingrediente.entity';
import { CuentaBancariaEntity } from '../../modules/cuentas-banco/entities/cuenta-bancaria.entity';
import { FacturaEntity } from '../../modules/facturas/entities/factura.entity';
import { FacturaPagosCliente } from '../../modules/facturas/entities/factura-pagos-cliente.entity'; 
import { FacturaPedidoEntity } from '../../modules/facturas/entities/factura-pedido.entity';
import { IngredienteEntity } from '../../modules/ingredientes/entities/ingrediente.entity';
import { MedioPagoEntity } from '../../modules/medios-pago/entities/medio-pago.entity';
import { MesaEntity } from '../../modules/mesas/entities/mesa.entity';
import { MovimientoBancarioEntity } from '../../modules/movimientos-bancarios/entities/movimiento-bancario.entity';
import { PagoEntity } from '../../modules/pagos/entities/pago.entity';
import { PedidoEntity } from '../../modules/pedidos/entities/pedido.entity';
import { PedidoItemEntity } from '../../modules/pedidos/entities/pedido-item.entity';
import { ProductoEntity } from '../../modules/productos/entities/producto.entity';
import { RecetaProductoEntity } from '../../modules/productos/entities/receta-producto.entity';
import { ProveedorEntity } from '../../modules/proveedores/entities/proveedor.entity';
import { RolEntity } from '../../modules/roles/entities/rol.entity';
import { CierreCajaEntity } from '../../modules/cierre-caja/entities/cierre-caja.entity';


@EventSubscriber()
export class GenericSyncSubscriber implements EntitySubscriberInterface {
  private readonly syncableEntityNames = [
    'UsuarioEntity',
    'EstablecimientoEntity',
    'EstablecimientoConfiguracionPedidoEntity',
    'CategoriaEntity',
    'ClienteEntity',
    'CompraIngredienteEntity',
    'CuentaBancariaEntity',
    'FacturaEntity',
    'FacturaPagosCliente', 
    'FacturaPedidoEntity',
    'IngredienteEntity',
    'MedioPagoEntity',
    'MesaEntity',
    'MovimientoBancarioEntity',
    'PagoEntity',
    'PedidoEntity',
    'PedidoItemEntity',
    'ProductoEntity',
    'RecetaProductoEntity',
    'ProveedorEntity',
    'RolEntity',
    'CierreCajaEntity',
  ];

  constructor(dataSource: DataSource, private syncService: SyncService) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return UsuarioEntity;
  }

  private isSyncableEntity(entity: any): boolean {
    return entity && entity.constructor && this.syncableEntityNames.includes(entity.constructor.name);
  }

  private getEstablishmentIdFromEntity(entity: any): string | null {
    if (!entity) return null;

    if (typeof entity.establecimiento_id === 'string') {
      return entity.establecimiento_id;
    }
    if (entity.constructor.name === 'EstablecimientoEntity' && typeof entity.id === 'string') {
      return entity.id;
    }
    return null;
  }

  afterInsert(event: InsertEvent<any>) {
    if (!event.entity) {
      console.warn(`[SyncSubscriber] afterInsert: event.entity es nulo o indefinido.`);
      return;
    }
    if (this.isSyncableEntity(event.entity) && event.entity.id) {
      const establishmentId = this.getEstablishmentIdFromEntity(event.entity);
      if (establishmentId) {
        const changedAt = event.entity.updated_at instanceof Date ? event.entity.updated_at : new Date();
        this.syncService.recordChange(event.entity.id, event.entity.constructor.name, 'INSERT', changedAt, establishmentId, event.entity as SyncableEntity);
      } else {
        console.warn(`[SyncSubscriber] Entidad insertada ${event.entity.constructor.name} - ${event.entity.id} no tiene establecimiento_id válido. No se registrará para sincronización.`);
      }
    }
  }

  afterUpdate(event: UpdateEvent<any>) {
    if (!event.entity) {
      console.warn(`[SyncSubscriber] afterUpdate: event.entity es nulo o indefinido.`);
      return;
    }
    if (this.isSyncableEntity(event.entity) && event.entity.id && event.updatedColumns.length > 0) {
      const establishmentId = this.getEstablishmentIdFromEntity(event.entity);
      if (establishmentId) {
        const changedAt = event.entity.updated_at instanceof Date ? event.entity.updated_at : new Date();
        this.syncService.recordChange(event.entity.id, event.entity.constructor.name, 'UPDATE', changedAt, establishmentId, event.entity as SyncableEntity);
      } else {
        console.warn(`[SyncSubscriber] Entidad actualizada ${event.entity.constructor.name} - ${event.entity.id} no tiene establecimiento_id válido. No se registrará para sincronización.`);
      }
    }
  }

  afterRemove(event: RemoveEvent<any>) {
    if (!event.entity && !event.entityId) { 
      console.warn(`[SyncSubscriber] afterRemove: event.entity y event.entityId son nulos o indefinidos.`);
      return;
    }

    const entityId = event.entity?.id || event.entityId; 
    const entityName = event.entity?.constructor.name || 'UnknownEntity'; 

    const establishmentId = event.entity ? this.getEstablishmentIdFromEntity(event.entity) : null;

    if (entityId && establishmentId) {
        this.syncService.recordChange(entityId, entityName, 'DELETE', new Date(), establishmentId, null); 
    } else {
        console.warn(`[SyncSubscriber] Entidad eliminada ${entityName} - ${entityId} no tiene establecimiento_id válido. No se registrará para sincronización.`);
    }
  }
}

// import {
//   DataSource,
//   EntitySubscriberInterface,
//   EventSubscriber,
//   InsertEvent,
//   UpdateEvent,
//   RemoveEvent,
// } from 'typeorm';
// import { SyncService } from '../sync.service';
// import { SyncableEntity } from '../../common/interfaces/syncable-entity.interface'; 

// import { UsuarioEntity } from '../../modules/usuarios/entities/usuario.entity';
// import { EstablecimientoEntity } from '../../modules/establecimientos/entities/establecimiento.entity';
// import { EstablecimientoConfiguracionPedidoEntity } from '../../modules/establecimientos/entities/configuracion-pedidos.entity';
// import { CategoriaEntity } from '../../modules/categorias/entities/categoria.entity';
// import { ClienteEntity } from '../../modules/clientes/entities/cliente.entity';
// import { CompraIngredienteEntity } from '../../modules/compras/entities/compra-ingrediente.entity';
// import { CuentaBancariaEntity } from '../../modules/cuentas-banco/entities/cuenta-bancaria.entity';
// import { FacturaEntity } from '../../modules/facturas/entities/factura.entity';
// import { FacturaPagosCliente } from '../../modules/facturas/entities/factura-pagos-cliente.entity'; 
// import { FacturaPedidoEntity } from '../../modules/facturas/entities/factura-pedido.entity';
// import { IngredienteEntity } from '../../modules/ingredientes/entities/ingrediente.entity';
// import { MedioPagoEntity } from '../../modules/medios-pago/entities/medio-pago.entity';
// import { MesaEntity } from '../../modules/mesas/entities/mesa.entity';
// import { MovimientoBancarioEntity } from '../../modules/movimientos-bancarios/entities/movimiento-bancario.entity';
// import { PagoEntity } from '../../modules/pagos/entities/pago.entity';
// import { PedidoEntity } from '../../modules/pedidos/entities/pedido.entity';
// import { PedidoItemEntity } from '../../modules/pedidos/entities/pedido-item.entity';
// import { ProductoEntity } from '../../modules/productos/entities/producto.entity';
// import { RecetaProductoEntity } from '../../modules/productos/entities/receta-producto.entity';
// import { ProveedorEntity } from '../../modules/proveedores/entities/proveedor.entity';
// import { RolEntity } from '../../modules/roles/entities/rol.entity';
// import { CierreCajaEntity } from '../../modules/cierre-caja/entities/cierre-caja.entity';


// @EventSubscriber()
// export class GenericSyncSubscriber implements EntitySubscriberInterface {
//   constructor(dataSource: DataSource, private syncService: SyncService) {
//     dataSource.subscribers.push(this);
//   }

//   listenTo() {
//     return [
//       UsuarioEntity,
//       EstablecimientoEntity,
//       EstablecimientoConfiguracionPedidoEntity,
//       CategoriaEntity,
//       ClienteEntity,
//       CompraIngredienteEntity,
//       CuentaBancariaEntity,
//       FacturaEntity,
//       FacturaPagosCliente, 
//       FacturaPedidoEntity,
//       IngredienteEntity,
//       MedioPagoEntity,
//       MesaEntity,
//       MovimientoBancarioEntity,
//       PagoEntity,
//       PedidoEntity,
//       PedidoItemEntity,
//       ProductoEntity,
//       RecetaProductoEntity,
//       ProveedorEntity,
//       RolEntity,
//       CierreCajaEntity,
//     ]; 
//   }

//   private isSyncableEntity(entity: any): boolean {
//     // Ya no es estrictamente necesario si listenTo() ya filtra, pero es una buena capa de seguridad
//     const syncableEntityNames = this.listenTo().map(e => e.name); // Obtiene los nombres de las clases
//     return entity && entity.constructor && syncableEntityNames.includes(entity.constructor.name);
//   }

//   private getEstablishmentIdFromEntity(entity: any): string | null {
//     if (!entity) return null;

//     if (typeof entity.establecimiento_id === 'string') {
//       return entity.establecimiento_id;
//     }
//     if (entity.constructor.name === 'EstablecimientoEntity' && typeof entity.id === 'string') {
//       return entity.id;
//     }
//     // Para FacturaPagosCliente, si no tiene establecimiento_id directo,
//     // se asume que el SyncService lo manejará a través de la relación con Factura.
//     // Aquí no podemos cargar relaciones fácilmente en el subscriber.
//     return null;
//   }

//   afterInsert(event: InsertEvent<any>) {
//     if (!event.entity) {
//       console.warn(`[SyncSubscriber] afterInsert: event.entity es nulo o indefinido.`);
//       return;
//     }
//     // No necesitamos isSyncableEntity aquí si listenTo() ya está filtrando
//     // Pero si lo mantenemos, el `event.entity.id` ya está garantizado por TypeORM para eventos de inserción exitosa
//     const establishmentId = this.getEstablishmentIdFromEntity(event.entity);
//     if (establishmentId) {
//       this.syncService.recordChange(event.entity.id, event.entity.constructor.name, 'INSERT', event.entity.updated_at, establishmentId, event.entity as SyncableEntity);
//     } else {
//       console.warn(`[SyncSubscriber] Entidad insertada ${event.entity.constructor.name} - ${event.entity.id} no tiene establecimiento_id válido. No se registrará para sincronización.`);
//     }
//   }

//   afterUpdate(event: UpdateEvent<any>) {
//     if (!event.entity) {
//       console.warn(`[SyncSubscriber] afterUpdate: event.entity es nulo o indefinido.`);
//       return;
//     }
//     // event.updatedColumns.length > 0 asegura que hubo un cambio real
//     if (event.entity.id && event.updatedColumns.length > 0) {
//       const establishmentId = this.getEstablishmentIdFromEntity(event.entity);
//       if (establishmentId) {
//         this.syncService.recordChange(event.entity.id, event.entity.constructor.name, 'UPDATE', event.entity.updated_at, establishmentId, event.entity as SyncableEntity);
//       } else {
//         console.warn(`[SyncSubscriber] Entidad actualizada ${event.entity.constructor.name} - ${event.entity.id} no tiene establecimiento_id válido. No se registrará para sincronización.`);
//       }
//     }
//   }

//   afterRemove(event: RemoveEvent<any>) {
//     // Para afterRemove, event.entity puede ser null si la entidad ya fue eliminada de la sesión
//     // o si es una eliminación en cascada. Es más seguro usar event.entityId.
//     // Sin embargo, para obtener el establishment_id, a menudo se necesita el objeto completo.
//     // Si event.entity es null, no podemos obtener el establishment_id fácilmente.
//     // Para fines de sincronización, si no tenemos el objeto, podríamos omitir el evento
//     // o requerir que el servicio de eliminación pase el establishment_id explícitamente.
//     // Por ahora, nos basamos en event.entity si está disponible.
//     if (!event.entity && !event.entityId) { // Si ambos son nulos, no hay nada que hacer
//       console.warn(`[SyncSubscriber] afterRemove: event.entity y event.entityId son nulos o indefinidos.`);
//       return;
//     }

//     const entityId = event.entity?.id || event.entityId; // Usa entity.id si existe, sino entityId
//     const entityName = event.entity?.constructor.name || 'UnknownEntity'; // Intenta obtener el nombre

//     // Si event.entity es null, no podemos obtener el establishmentId de forma fiable aquí.
//     // En un escenario real, la eliminación en cascada o la eliminación de relaciones
//     // puede no proporcionar el objeto completo.
//     // Una alternativa robusta es que el servicio que invoca la eliminación
//     // (ej. EstablecimientosService.remove) también llame a SyncService.recordChange
//     // con el establishmentId.
//     const establishmentId = event.entity ? this.getEstablishmentIdFromEntity(event.entity) : null;

//     if (entityId && establishmentId) {
//         this.syncService.recordChange(entityId, entityName, 'DELETE', new Date(), establishmentId, null); 
//     } else {
//         console.warn(`[SyncSubscriber] Entidad eliminada ${entityName} - ${entityId} no tiene establecimiento_id válido. No se registrará para sincronización.`);
//     }
//   }
// }