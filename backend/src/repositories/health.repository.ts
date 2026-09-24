import { AppDataSource } from '../config/data-source';

// Repository layer: the only layer that talks to the database.
// For entity-backed features this will usually wrap
// AppDataSource.getRepository(SomeEntity); the health check has no table,
// so it runs a raw query instead.
export const healthRepository = {
  async getDatabaseTime(): Promise<Date> {
    const rows: { now: Date }[] = await AppDataSource.query('SELECT NOW() AS now');
    return rows[0].now;
  },
};
