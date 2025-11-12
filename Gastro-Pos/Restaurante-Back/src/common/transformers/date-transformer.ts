import { ValueTransformer } from 'typeorm';

export class DateTransformer implements ValueTransformer {
  private readonly dbEngine: string;

  constructor(dbEngine: string) {
    this.dbEngine = dbEngine;
  }

  from(value: string | Date): Date | null {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === 'string') {
      return new Date(value);
    }
    return value; 
  }
  to(value: Date): string | Date | null {
    if (value === null || value === undefined) {
      return value;
    }

    if (this.dbEngine === 'sqlite') {
      return value.toISOString().slice(0, 19).replace('T', ' '); 
    }
    return value;
  }
}