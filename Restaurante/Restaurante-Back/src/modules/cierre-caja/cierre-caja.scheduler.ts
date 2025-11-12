import { Injectable, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { CierreCajaService } from './cierre-caja.service';

@Injectable()
export class CierreCajaScheduler implements OnModuleInit {
  constructor(private readonly cierreCajaService: CierreCajaService) {}

onModuleInit() {
  cron.schedule('0 3 * * *', async () => {
    console.log('Iniciando proceso de cierre de caja automático a las 3 AM (hora Colombia)...');
    await this.cierreCajaService.cerrarCajasPendientes();
    console.log('Proceso de cierre de caja automático finalizado.');
  }, {
    timezone: "America/Bogota" 
  });
}
}


