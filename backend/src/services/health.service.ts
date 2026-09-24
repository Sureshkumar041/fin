import { healthRepository } from '../repositories/health.repository';

export type HealthReport = {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  databaseTime: string | null;
  uptime: number;
  timestamp: string;
};

// Service layer: business logic. Knows nothing about Express (no req/res),
// so it can be reused and unit-tested on its own.
export const healthService = {
  async getHealth(): Promise<HealthReport> {
    let databaseTime: Date | null = null;
    try {
      databaseTime = await healthRepository.getDatabaseTime();
    } catch (err) {
      // An unreachable database is a valid health result, not a server error.
      console.error('Health check: database unreachable', err);
    }

    const databaseUp = databaseTime !== null;
    return {
      status: databaseUp ? 'ok' : 'degraded',
      database: databaseUp ? 'up' : 'down',
      databaseTime: databaseTime?.toISOString() ?? null,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  },
};
