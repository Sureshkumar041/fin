import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi';

// GET /api-docs       -> interactive Swagger UI
// GET /api-docs.json  -> the raw OpenAPI document (for Postman, code generators, etc.)
export const docsRouter = Router();

docsRouter.get('/api-docs.json', (_req, res) => {
  res.json(openApiDocument);
});

docsRouter.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'FIN API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  }),
);
