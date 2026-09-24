import fs from 'fs';
import path from 'path';
import type { OpenAPIV3_1 } from 'openapi-types';
import { env } from '../config/env';
import { components } from './components';
import { healthDocs } from './paths/health.docs';
import type { ApiDocsModule } from './types';

// To document a new feature: create paths/<feature>.docs.ts exporting an
// ApiDocsModule, then add it to this list.
const modules: ApiDocsModule[] = [healthDocs];

// Keep the documented version in sync with package.json.
const { version } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'),
) as { version: string };

export const openApiDocument: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    title: 'Expense Tracker API',
    version,
    description:
      'REST API for the Expense Tracker.\n\n' +
      '**Authentication:** log in with `POST /api/auth/login`. The server sets an ' +
      'HTTP-only `access_token` cookie that the browser sends with every later ' +
      'request, including requests made from this page.\n\n' +
      '**Errors** always have the shape `{ code, message, details? }`.',
  },
  servers: [{ url: `http://localhost:${env.port}/api`, description: 'Local development' }],
  tags: modules.map((m) => m.tag),
  // Most endpoints require login; public ones opt out with `security: []`.
  security: [{ cookieAuth: [] }],
  paths: Object.assign({}, ...modules.map((m) => m.paths)),
  components: {
    ...components,
    schemas: Object.assign({}, components.schemas, ...modules.map((m) => m.schemas ?? {})),
  },
};
