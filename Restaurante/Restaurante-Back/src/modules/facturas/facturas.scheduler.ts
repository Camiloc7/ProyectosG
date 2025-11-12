import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FacturasService } from './facturas.service';

@Injectable()
export class FacturasScheduler {
  private readonly logger = new Logger(FacturasScheduler.name);

  constructor(private readonly facturasService: FacturasService) {}

  @Cron('*/5 * * * *')
  async handlePendingInvoices() {
    // this.logger.log('Buscando facturas pendientes de enviar...');
    const facturasParaProcesar = await this.facturasService.findInvoicesToProcess();
    
    if (facturasParaProcesar.length === 0) {
      // this.logger.log('No se encontraron facturas pendientes.');
      return;
    }
    
    this.logger.log(`Se encontraron ${facturasParaProcesar.length} facturas pendientes. Procesando...`);
    for (const { factura, retry } of facturasParaProcesar) {
      try {
        await this.facturasService.processInvoice(factura.id);
        // this.logger.log(`Factura ${factura.id} procesada con éxito.`);
      } catch (error) {
        // this.logger.error(`Error al procesar la factura ${factura.id}: ${error.message}`);
      }
    }
  }
}