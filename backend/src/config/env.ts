import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function toNumber(name: string, value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got "${value}"`);
  }
  return parsed;
}

function jwtSecret(): string {
  const secret = required('JWT_SECRET');
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  return secret;
}

const nodeEnv = optional('NODE_ENV', 'development');

// Read and validate once at startup so the app fails fast on bad config.
export const env = {
  nodeEnv,
  sameSite: required('SAME_SITE'),
  isProduction: nodeEnv === 'production',
  port: toNumber('PORT', optional('PORT', '8080')),
  clientUrl: required('CLIENT_URL'),
  // Swagger UI at /api-docs. On by default except in production.
  apiDocsEnabled: optional('API_DOCS_ENABLED', nodeEnv === 'production' ? 'false' : 'true') === 'true',
  db: {
    host: required('DB_HOST'),
    port: toNumber('DB_PORT', optional('DB_PORT', '5432')),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    name: required('DB_NAME'),
    ssl: optional('DB_SSL', 'false') === 'true',
    logging: optional('DB_LOGGING', 'false') === 'true',
  },
  jwt: {
    secret: jwtSecret(),
    expiresInDays: toNumber('JWT_EXPIRES_IN_DAYS', optional('JWT_EXPIRES_IN_DAYS', '7')),
  },
} as const;
