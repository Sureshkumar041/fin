import 'reflect-metadata';
import path from 'path';
import { DataSource } from 'typeorm';
import { env } from './env';

// Single DataSource shared by the app and the TypeORM CLI (migrations).
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.name,
  // gen_random_uuid() is built into PostgreSQL 13+, no extension needed.
  uuidExtension: 'pgcrypto',
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  logging: env.db.logging,
  // Schema changes go through migrations only; never auto-sync.
  synchronize: false,
  // Globs resolve to .ts under ts-node and .js in the compiled dist/ build.
  entities: [path.join(__dirname, '..', 'entities', '*.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
});
