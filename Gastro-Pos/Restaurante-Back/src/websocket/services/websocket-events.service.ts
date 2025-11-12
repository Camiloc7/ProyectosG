// import { Injectable, Logger } from '@nestjs/common';
// import { Server } from 'socket.io';
// import { PedidoEntity, EstadoPedido } from '../../modules/pedidos/entities/pedido.entity';
// import { PedidoItemEntity, EstadoCocina } from '../../modules/pedidos/entities/pedido-item.entity'; 
// import { EstadoMesa } from '../../modules/mesas/entities/mesa.entity';

// @Injectable()
// export class WebSocketEventsService {
//   public server: Server; 
//   private readonly logger = new Logger(WebSocketEventsService.name);
  
//   public emitToEstablishment(
//     establishmentId: string,
//     event: string,
//     data: any
//   ) {
//     if (this.server) {
//       this.server.to(`establecimiento-${establishmentId}`).emit(event, data); 
//       this.logger.debug(`Evento '${event}' emitido a la sala '${establishmentId}' con datos: ${JSON.stringify(data)}`);
//     } else {
//       this.logger.error('No se puede emitir el evento: la instancia del servidor Socket.IO no está disponible.');
//     }
//   }
  
//   emitPedidoCreated(establecimientoId: string, pedidoId: string): void {
//     if (this.server) {
//       this.server
//         .to(`establecimiento-${establecimientoId}`)
//         .emit("pedidoCreated", { pedidoId });
//       this.logger.log(
//         `[WS] Pedido Creado: ${pedidoId} en establecimiento ${establecimientoId}`
//       );
//     }
//   }

//   emitPedidoUpdated(
//     establecimientoId: string,
//     pedidoId: string,
//     pedidoData: PedidoEntity
//   ): void {
//     if (this.server) {
//       this.server
//         .to(`establecimiento-${establecimientoId}`)
//         .emit("pedidoUpdated", { pedidoId, pedidoData });
//       this.logger.log(
//         `[WS] Pedido Actualizado: ${pedidoId} en establecimiento ${establecimientoId}`
//       );
//     }
//   }

//   emitPedidoStatusUpdated(
//     establecimientoId: string,
//     pedidoId: string,
//     newStatus: EstadoPedido
//   ): void {
//     if (this.server) {
//       this.server
//         .to(`establecimiento-${establecimientoId}`)
//         .emit("pedidoStatusUpdated", { pedidoId, newStatus });
//       this.logger.log(
//         `[WS] Pedido ${pedidoId} Estado Actualizado a ${newStatus} en establecimiento ${establecimientoId}`
//       );
//     }
//   }

//   emitPedidoItemCreated(
//     establecimientoId: string,
//     pedidoId: string,
//     pedidoItem: PedidoItemEntity
//   ): void {
//     if (this.server) {
//       this.server
//         .to(`establecimiento-${establecimientoId}`)
//         .emit("pedidoItemCreated", { pedidoId, pedidoItem });
//       this.logger.log(
//         `[WS] Pedido ${pedidoId} Item ${pedidoItem.id} Creado en establecimiento ${establecimientoId}`
//       );
//     }
//   }

//   emitPedidoItemUpdated(
//     establecimientoId: string,
//     pedidoId: string,
//     pedidoItem: PedidoItemEntity
//   ): void {
//     if (this.server) {
//       this.server
//         .to(`establecimiento-${establecimientoId}`)
//         .emit("pedidoItemUpdated", { pedidoId, pedidoItem });
//       this.logger.log(
//         `[WS] Pedido ${pedidoId} Item ${pedidoItem.id} Actualizado (Estado Cocina: ${pedidoItem.estado_cocina}) en establecimiento ${establecimientoId}`
//       );
//     }
//   }

//   emitPedidoItemRemoved(
//     establecimientoId: string,
//     pedidoId: string,
//     itemId: string
//   ): void {
//     if (this.server) {
//       this.server
//         .to(`establecimiento-${establecimientoId}`)
//         .emit("pedidoItemRemoved", { pedidoId, itemId });
//       this.logger.log(
//         `[WS] Pedido ${pedidoId} Item ${itemId} Eliminado en establecimiento ${establecimientoId}`
//       );
//     }
//   }

//   emitPedidoTableTransferred(
//     establecimientoId: string,
//     pedidoId: string,
//     oldMesaId: string | null,
//     newMesaId: string | null
//   ): void {
//     if (this.server) {
//       this.server
//         .to(`establecimiento-${establecimientoId}`)
//         .emit("pedidoTableTransferred", { pedidoId, oldMesaId, newMesaId });
//       this.logger.log(
//         `[WS] Pedido ${pedidoId} transferido de ${oldMesaId || "N/A"} a ${newMesaId || "N/A"} en establecimiento ${establecimientoId}`
//       );
//     }
//   }

//   emitPedidoRemoved(establecimientoId: string, pedidoId: string): void {
//     if (this.server) {
//       this.server
//         .to(`establecimiento-${establecimientoId}`)
//         .emit("pedidoRemoved", { pedidoId });
//       this.logger.log(
//         `[WS] Pedido ${pedidoId} Eliminado en establecimiento ${establecimientoId}`
//       );
//     }
//   }

//   /**
//    * Emite un evento de factura creada al establecimiento.
//    * @param establecimientoId ID del establecimiento.
//    * @param facturaId ID de la factura recién creada.
//    */
//   emitFacturaCreated(establecimientoId: string, facturaId: string): void {
//     if (this.server) {
//       this.server
//         .to(`establecimiento-${establecimientoId}`)
//         .emit("facturaCreated", { facturaId });
//       this.logger.log(
//         `[WS] Factura Creada: ${facturaId} en establecimiento ${establecimientoId}`
//       );
//     }
//   }

//   emitMesaStatusUpdated(
//     establecimientoId: string,
//     mesaId: string,
//     newStatus: EstadoMesa
//   ): void {
//     if (this.server) {
//       this.server
//         .to(`establecimiento-${establecimientoId}`)
//         .emit("mesaStatusUpdated", { mesaId, newStatus });
//       this.logger.log(
//         `[WS] Mesa ${mesaId} Estado Actualizado a ${newStatus} en establecimiento ${establecimientoId}`
//       );
//     }
//   }

// /**
// * Emite un trabajo de impresión a un dispositivo TPV específico, 
// * enviando la lista de operaciones ESC/POS al plugin local.
// * @param deviceId ID único del dispositivo Electron (Caja).
// * @param payload Datos necesarios para la impresión (Lista de Operaciones, nombreImpresora, etc.).
// */
// public emitPrintJobToDevice(
//   deviceId: string,
//   payload: {
//     tipoImpresion: 'COCINA' | 'CAJA' | 'FACTURA', 
//     nombreImpresora: string, 
//     operaciones: any[], 
//     pedidoId: string 
//   }
// ): void {
//   if (this.server) {
//     this.server.to(`device-${deviceId}`).emit("printJob", payload); 
//     this.logger.log(`[WS] Tarea 'printJob' enviada a device-${deviceId} para tipo: ${payload.tipoImpresion}`);
//   } else {
//     this.logger.error('No se pudo emitir la tarea de impresión: el servidor Socket.IO no está disponible.');
//   }
// }
// }








import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { PedidoEntity, EstadoPedido } from '../../modules/pedidos/entities/pedido.entity';
import { PedidoItemEntity, EstadoCocina } from '../../modules/pedidos/entities/pedido-item.entity'; 
import { EstadoMesa } from '../../modules/mesas/entities/mesa.entity';

@Injectable()
export class WebSocketEventsService {
  public server: Server; 
  private readonly logger = new Logger(WebSocketEventsService.name);
  public emitToEstablishment(
    establishmentId: string,
    event: string,
    data: any
  ) {
    if (this.server) {
      this.server.to(`establecimiento-${establishmentId}`).emit(event, data); 
      this.logger.debug(`Evento '${event}' emitido a la sala '${establishmentId}' con datos: ${JSON.stringify(data)}`);
    } else {
      this.logger.error('No se puede emitir el evento: la instancia del servidor Socket.IO no está disponible.');
    }
  }
  emitPedidoCreated(establecimientoId: string, pedidoId: string): void {
    if (this.server) {
      this.server
        .to(`establecimiento-${establecimientoId}`)
        .emit("pedidoCreated", { pedidoId });
      this.logger.log(
        `[WS] Pedido Creado: ${pedidoId} en establecimiento ${establecimientoId}`
      );
    }
  }

  emitPedidoUpdated(
    establecimientoId: string,
    pedidoId: string,
    pedidoData: PedidoEntity
  ): void {
    if (this.server) {
      this.server
        .to(`establecimiento-${establecimientoId}`)
        .emit("pedidoUpdated", { pedidoId, pedidoData });
      this.logger.log(
        `[WS] Pedido Actualizado: ${pedidoId} en establecimiento ${establecimientoId}`
      );
    }
  }

  emitPedidoStatusUpdated(
    establecimientoId: string,
    pedidoId: string,
    newStatus: EstadoPedido
  ): void {
    if (this.server) {
      this.server
        .to(`establecimiento-${establecimientoId}`)
        .emit("pedidoStatusUpdated", { pedidoId, newStatus });
      this.logger.log(
        `[WS] Pedido ${pedidoId} Estado Actualizado a ${newStatus} en establecimiento ${establecimientoId}`
      );
    }
  }

  emitPedidoItemCreated(
    establecimientoId: string,
    pedidoId: string,
    pedidoItem: PedidoItemEntity
  ): void {
    if (this.server) {
      this.server
        .to(`establecimiento-${establecimientoId}`)
        .emit("pedidoItemCreated", { pedidoId, pedidoItem });
      this.logger.log(
        `[WS] Pedido ${pedidoId} Item ${pedidoItem.id} Creado en establecimiento ${establecimientoId}`
      );
    }
  }

  emitPedidoItemUpdated(
    establecimientoId: string,
    pedidoId: string,
    pedidoItem: PedidoItemEntity
  ): void {
    if (this.server) {
      this.server
        .to(`establecimiento-${establecimientoId}`)
        .emit("pedidoItemUpdated", { pedidoId, pedidoItem });
      this.logger.log(
        `[WS] Pedido ${pedidoId} Item ${pedidoItem.id} Actualizado (Estado Cocina: ${pedidoItem.estado_cocina}) en establecimiento ${establecimientoId}`
      );
    }
  }

  emitPedidoItemRemoved(
    establecimientoId: string,
    pedidoId: string,
    itemId: string
  ): void {
    if (this.server) {
      this.server
        .to(`establecimiento-${establecimientoId}`)
        .emit("pedidoItemRemoved", { pedidoId, itemId });
      this.logger.log(
        `[WS] Pedido ${pedidoId} Item ${itemId} Eliminado en establecimiento ${establecimientoId}`
      );
    }
  }

  emitPedidoTableTransferred(
    establecimientoId: string,
    pedidoId: string,
    oldMesaId: string | null,
    newMesaId: string | null
  ): void {
    if (this.server) {
      this.server
        .to(`establecimiento-${establecimientoId}`)
        .emit("pedidoTableTransferred", { pedidoId, oldMesaId, newMesaId });
      this.logger.log(
        `[WS] Pedido ${pedidoId} transferido de ${oldMesaId || "N/A"} a ${newMesaId || "N/A"} en establecimiento ${establecimientoId}`
      );
    }
  }

  emitPedidoRemoved(establecimientoId: string, pedidoId: string): void {
    if (this.server) {
      this.server
        .to(`establecimiento-${establecimientoId}`)
        .emit("pedidoRemoved", { pedidoId });
      this.logger.log(
        `[WS] Pedido ${pedidoId} Eliminado en establecimiento ${establecimientoId}`
      );
    }
  }

  
  /**
   * Emite un evento de factura creada al establecimiento.
   * @param establecimientoId ID del establecimiento.
   * @param facturaId ID de la factura recién creada.
   */
  emitFacturaCreated(establecimientoId: string, facturaId: string): void {
    if (this.server) {
      this.server
        .to(`establecimiento-${establecimientoId}`)
        .emit("facturaCreated", { facturaId });
      this.logger.log(
        `[WS] Factura Creada: ${facturaId} en establecimiento ${establecimientoId}`
      );
    }
  }



  emitMesaStatusUpdated(
    establecimientoId: string,
    mesaId: string,
    newStatus: EstadoMesa
  ): void {
    if (this.server) {
      this.server
        .to(`establecimiento-${establecimientoId}`)
        .emit("mesaStatusUpdated", { mesaId, newStatus });
      this.logger.log(
        `[WS] Mesa ${mesaId} Estado Actualizado a ${newStatus} en establecimiento ${establecimientoId}`
      );
    }
  }
//   /**
//  * Emite un trabajo de impresión a un dispositivo TPV específico.
//  * @param deviceId ID único del dispositivo Electron (Caja).
//  * @param payload Datos necesarios para la impresión (buffer, tipo, etc.).
//  */
// public emitPrintJobToDevice(
//   deviceId: string,
//   payload: {
//     tipoImpresion: 'COCINA' | 'CAJA' | 'FACTURA', 
//     dataBase64: string, 
//     pedidoId: string 
//   }
// ): void {
//   if (this.server) {
//     this.server.to(`device-${deviceId}`).emit("printJob", payload); 
//     this.logger.log(`[WS] Tarea 'printJob' enviada a device-${deviceId} para tipo: ${payload.tipoImpresion}`);
//   } else {
//     this.logger.error('No se pudo emitir la tarea de impresión: el servidor Socket.IO no está disponible.');
//   }
// }


/**
* Emite un trabajo de impresión a un dispositivo TPV específico, 
* enviando la lista de operaciones ESC/POS al plugin local.
* @param deviceId ID único del dispositivo Electron (Caja).
* @param payload Datos necesarios para la impresión (Lista de Operaciones, nombreImpresora, etc.).
*/
public emitPrintJobToDevice(
  deviceId: string,
  payload: {
    tipoImpresion: 'COCINA' | 'CAJA' | 'FACTURA', 
    nombreImpresora: string, 
    operaciones: any[], 
    pedidoId: string 
  }
): void {
  if (this.server) {
    this.server.to(`device-${deviceId}`).emit("printJob", payload); 
    this.logger.log(`[WS] Tarea 'printJob' enviada a device-${deviceId} para tipo: ${payload.tipoImpresion}`);
  } else {
    this.logger.error('No se pudo emitir la tarea de impresión: el servidor Socket.IO no está disponible.');
  }
}
}