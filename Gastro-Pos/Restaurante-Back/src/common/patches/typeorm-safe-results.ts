import * as dotenv from 'dotenv';
dotenv.config();

import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';

const dbEngine = process.env.DB_ENGINE || 'mysql';

if (dbEngine === 'sqlite') {
    console.log('[TypeORM Patch] Activando parche de resultados *ultra* seguros para QueryBuilder (SOLO PARA SQLITE)');

    const qbProto: any = (SelectQueryBuilder as any).prototype;

    function normalizeResult<T>(res: T): T {
        if (res == null) return res;

        const result = res as any;

        if (typeof result === 'object' && ('raw' in result || 'entities' in result)) {
            result.raw = Array.isArray(result.raw) ? result.raw : [];
            result.entities = Array.isArray(result.entities) ? result.entities : [];
        }

        return result;
    }

    function safeCall<F extends (...args: any[]) => Promise<any>>(fn: F): F {
        return (async function wrapped(this: any, ...args: any[]) {
            try {
                const res = await fn.apply(this, args);
                return normalizeResult(res);
            } catch (e: any) {
                const msg = String(e?.message ?? '');

                if (msg.includes("reading 'length'") || (e.code === 'SQLITE_RANGE')) { 
                    console.warn(`[TypeORM Patch] Capturado y mitigado "${msg}" en ${fn.name}. Devolviendo resultado vacío/nulo consistente.`);
                    console.warn('[TypeORM Patch] Revisión detallada del error:');
                    try {
                        console.warn('→ Método:', fn.name);
                        console.warn('→ SQL Query:', this.getQuery?.());
                        console.warn('→ Parámetros:', this.getParameters?.());
                    } catch (metaError) {
                        console.warn('[TypeORM Patch] Error al obtener detalles del QueryBuilder:', metaError);
                    }
                    console.warn('→ Stack trace del error original:', e.stack);
                    if (fn.name === 'executeEntitiesAndRawResults' || fn.name === 'getRawAndEntities' || 
                       (fn.name === 'getOne' || fn.name === 'getRawOne')) { 
                        if (fn.name === 'getOne' || fn.name === 'getRawOne' || (this.expressionMap.limit === 1 && fn.name === 'executeEntitiesAndRawResults')) {
                            return null;
                        }
                        return { raw: [], entities: [] }; 
                    }
                    return null;
                }

                throw e; 
            }
        } as any) as F;
    }

    const methodsToPatch = [
        'executeEntitiesAndRawResults',
        'getRawAndEntities',
        'getOne',
        'getOneOrFail',
        'getRawOne',
    ];

    for (const method of methodsToPatch) {
        if (typeof qbProto[method] === 'function') {
            const original = qbProto[method];
            qbProto[method] = safeCall(original);
            console.log(`[TypeORM Patch] ${method} parcheado`);
        }
    }
} else {
    console.log('[TypeORM Patch] Parche de resultados seguros omitido (no es SQLite).');
}

