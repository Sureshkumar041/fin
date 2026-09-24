import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import routes from './routes';
import { docsRouter } from './docs';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export function createApp() {
  const app = express();

  app.use(helmet());
  // credentials: true lets the browser send the HTTP-only auth cookie.
  app.use(cors({ origin: [env.clientUrl, "http://localhost:3001"], credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  if (env.apiDocsEnabled) {
    app.use(docsRouter);
  }
  // All API endpoints live under /api (e.g. /api/health). Docs stay at /api-docs.
  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
