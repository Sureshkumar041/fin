import type { ApiDocsModule } from '../types';
import { ref } from '../types';

export const healthDocs: ApiDocsModule = {
  tag: { name: 'Health', description: 'Service status' },

  schemas: {
    HealthReport: {
      type: 'object',
      required: ['status', 'database', 'databaseTime', 'uptime', 'timestamp'],
      properties: {
        status: { type: 'string', enum: ['ok', 'degraded'] },
        database: { type: 'string', enum: ['up', 'down'] },
        databaseTime: {
          type: ['string', 'null'],
          format: 'date-time',
          description: 'Current time reported by PostgreSQL; null if unreachable',
        },
        uptime: { type: 'integer', description: 'Process uptime in seconds' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  },

  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API and database health',
        description:
          'Used by load balancers and monitoring. Returns 503 when the database is unreachable.',
        operationId: 'getHealth',
        security: [], // public: overrides the global cookieAuth requirement
        responses: {
          200: {
            description: 'API and database are healthy',
            content: {
              'application/json': {
                schema: ref.schema('HealthReport'),
                example: {
                  status: 'ok',
                  database: 'up',
                  databaseTime: '2026-09-23T10:03:36.757Z',
                  uptime: 42,
                  timestamp: '2026-09-23T10:03:36.758Z',
                },
              },
            },
          },
          503: {
            description: 'Database is unreachable',
            content: {
              'application/json': {
                schema: ref.schema('HealthReport'),
                example: {
                  status: 'degraded',
                  database: 'down',
                  databaseTime: null,
                  uptime: 42,
                  timestamp: '2026-09-23T10:03:36.758Z',
                },
              },
            },
          },
        },
      },
    },
  },
};
