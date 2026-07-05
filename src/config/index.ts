import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment schema. Every process-level input the server depends on is
 * declared here and validated at boot so misconfiguration fails fast and
 * loudly instead of surfacing as a runtime error deep in a request.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(20).default(12),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

const env = parsed.data;

export const config = Object.freeze({
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  corsOrigin: env.CORS_ORIGIN,
  bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
});
