import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'mysql', 
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '8889', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'inventory_db',
  autoLoadEntities: true, 
  synchronize: process.env.NODE_ENV === 'development',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
  migrationsRun: false,
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : false,
}));


