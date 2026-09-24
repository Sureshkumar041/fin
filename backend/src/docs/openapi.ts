import fs from 'fs';
import path from 'path';
import type { OpenAPIV3_1 } from 'openapi-types';
import { env } from '../config/env';
import { components } from './components';
import { authDocs } from './paths/auth.docs';
import { categoryDocs } from './paths/category.docs';
import { contactDocs } from './paths/contact.docs';
import { dashboardDocs } from './paths/dashboard.docs';
import { expenseDocs } from './paths/expense.docs';
import { healthDocs } from './paths/health.docs';
import type { ApiDocsModule } from './types';

// To document a new feature: create paths/<feature>.docs.ts exporting an
// ApiDocsModule, then add it to this list. The order here is the tag order in Swagger UI.
const modules: ApiDocsModule[] = [
  healthDocs,
  authDocs,
  categoryDocs,
  contactDocs,
  expenseDocs,
  dashboardDocs,
];

// Keep the documented version in sync with package.json.
const { version } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'),
) as { version: string };

export const openApiDocument: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    title: 'FIN API',
    version,
    description:
      'REST API for the FIN.\n\n' +
      '**Authentication:** log in with `POST /api/auth/login`. The server sets an ' +
      'HTTP-only `access_token` cookie that the browser sends with every later ' +
      'request, including requests made from this page.\n\n' +
      '**Errors** always have the shape `{ code, message, details? }`. Any endpoint that ' +
      'uses the database may also return `503 SERVICE_UNAVAILABLE` if the database is unreachable.\n\n' +
      "**Ownership:** users only see their own data. Another user's resource returns 404, never 403.",
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
