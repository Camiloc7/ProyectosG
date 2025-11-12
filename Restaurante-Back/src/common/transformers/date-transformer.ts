import { ValueTransformer } from 'typeorm';

export class DateTransformer implements ValueTransformer {
  private readonly dbEngine: string;
  private readonly timezoneOffset: number; // Offset en horas (ej: -5 para UTC-5)

  constructor(dbEngine: string, timezoneOffset: number = -5) {
    this.dbEngine = dbEngine;
    this.timezoneOffset = timezoneOffset;
  }

  /**
   * Convierte la fecha de la base de datos (UTC) a la zona horaria especificada
   * @param value Valor de fecha desde la base de datos
   * @returns Fecha ajustada a la zona horaria especificada
   */
  from(value: string | Date): Date | null {
    if (value === null || value === undefined) {
      return value;
    }
    
    let date: Date;
    
    if (typeof value === 'string') {
      date = new Date(value);
    } else {
      date = value;
    }
    
    // Convertir de UTC a la zona horaria especificada (UTC-5)
    const utcTime = date.getTime();
    const offsetMilliseconds = this.timezoneOffset * 60 * 60 * 1000;
    const adjustedDate = new Date(utcTime + offsetMilliseconds);
    
    return adjustedDate;
  }

  /**
   * Convierte la fecha de la zona horaria local a UTC para guardar en la base de datos
   * @param value Fecha a guardar en la base de datos
   * @returns Fecha en formato UTC o undefined para permitir valores por defecto de la DB
   */
  to(value: Date | null | undefined): string | Date | null | undefined {
    // Si el valor es undefined, devolverlo tal cual para que TypeORM use el valor por defecto de la DB
    if (value === undefined) {
      return undefined;
    }
    
    // Si el valor es null, devolverlo tal cual
    if (value === null) {
      return null;
    }

    // Para SQLite necesitamos formato especial
    if (this.dbEngine === 'sqlite') {
      return value.toISOString().slice(0, 19).replace('T', ' '); 
    }
    
    // Para MySQL, devolver la fecha tal cual (TypeORM maneja la conversión a UTC)
    return value;
  }
}