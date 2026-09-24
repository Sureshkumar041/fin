import { env } from './config/env';
import { AppDataSource } from './config/data-source';
import { createApp } from './app';

async function bootstrap() {
  await AppDataSource.initialize();
  console.log('Database connected');

  const server = createApp().listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await AppDataSource.destroy();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
