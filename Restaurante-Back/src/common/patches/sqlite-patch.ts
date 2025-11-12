/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityMetadataValidator } from 'typeorm/metadata-builder/EntityMetadataValidator';

console.log('[TypeORM Patch] Activando parches defensivos (validator + SQL sanitizer)');

const originalValidateEntityMetadata = EntityMetadataValidator.prototype.validate;
EntityMetadataValidator.prototype.validate = function (...args: any[]) {
  try {
    return originalValidateEntityMetadata.apply(this, args);
  } catch (error: any) {
    const msg = String(error?.message ?? '');

    const isSqliteTypeErr =
      msg.includes('is not supported by "sqlite" database') &&
      (msg.includes('Data type "timestamp"') ||
        msg.includes('Data type "enum"') ||
        msg.includes('Data type "char"'));

    if (isSqliteTypeErr) {
      console.warn('[TypeORM Patch] Ignorando error de validación para SQLite:', msg);
      return;
    }

    throw error;
  }
};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SqliteDriver } = require('typeorm/driver/sqlite/SqliteDriver');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Table } = require('typeorm/schema-builder/table/Table');

  const originalCreateQueryRunner = SqliteDriver.prototype.createQueryRunner;

  SqliteDriver.prototype.createQueryRunner = function (mode: any) {
    const queryRunner = originalCreateQueryRunner.apply(this, [mode]);

    const originalCreateTable = (queryRunner as any).createTable;
    (queryRunner as any).createTable = async function (
      table: typeof Table,
      ifNotExist?: boolean,
      dropForeignKeys?: boolean,
      createForeignKeys?: boolean,
    ) {
      table.columns.forEach((column: any) => {
        if (
          (column.type === 'timestamp' || column.type === 'datetime') &&
          typeof column.default === 'string' &&
          (/\bCURRENT_TIMESTAMP\s*\(/i.test(column.default) || column.default === 'CURRENT_TIMESTAMP()')
        ) {
          column.default = 'CURRENT_TIMESTAMP';
          console.log(`[TypeORM Patch] Corrigiendo DEFAULT '${column.name}' -> CURRENT_TIMESTAMP`);
        }

        if (column.type === 'char') {
          column.type = 'varchar';
          console.log(`[TypeORM Patch] 'char' -> 'varchar' en '${column.name}'`);
        }

        if (column.type === 'enum') {
          column.type = 'varchar';
          console.log(`[TypeORM Patch] 'enum' -> 'varchar' en '${column.name}'`);
        }
      });

      await originalCreateTable.apply(this, [table, ifNotExist, dropForeignKeys, createForeignKeys]);
    };
    const originalQuery = (queryRunner as any).query;
    (queryRunner as any).query = function (query: any, parameters?: any[]) {
      if (typeof query === 'string') {
        query = query
          .replace(/CURRENT_TIMESTAMP\s*\(\s*\d+\s*\)/gi, 'CURRENT_TIMESTAMP')
          .replace(/timestamp\s*\(\s*\d+\s*\)/gi, 'datetime')
          .replace(/DEFAULT\s*\(\s*CURRENT_TIMESTAMP\s*\)/gi, 'DEFAULT CURRENT_TIMESTAMP');
      }
      return originalQuery.call(this, query, parameters);
    };

    return queryRunner;
  };

  console.log('[TypeORM Patch] Parche para SqliteDriver activo.');
} catch {
  console.log('[TypeORM Patch] SqliteDriver no disponible, se omite parche específico de SQLite.');
}
