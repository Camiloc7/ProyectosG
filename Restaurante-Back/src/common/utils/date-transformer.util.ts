import { DateTransformer } from '../transformers/date-transformer';

/**
 * Instancia del DateTransformer para MySQL con zona horaria UTC-5
 * Usar esta instancia en los decoradores @Column de las entidades
 */
export const dateTransformerMySQL = new DateTransformer('mysql', -5);

/**
 * Instancia del DateTransformer para SQLite con zona horaria UTC-5
 * Usar esta instancia en los decoradores @Column de las entidades
 */
export const dateTransformerSQLite = new DateTransformer('sqlite', -5);

/**
 * Función para obtener el transformer correcto según el motor de base de datos
 * @param dbEngine Motor de base de datos ('mysql' | 'sqlite')
 * @param timezoneOffset Offset de zona horaria en horas (por defecto -5 para UTC-5)
 * @returns DateTransformer configurado
 */
export function getDateTransformer(dbEngine: string = 'mysql', timezoneOffset: number = -5): DateTransformer {
  return new DateTransformer(dbEngine, timezoneOffset);
}

