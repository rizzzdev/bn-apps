import { config } from 'dotenv';
import { z } from 'zod';

config(); // Load .env

const envSchema = z.object({
  DATABASE_URL:           z.string().url(),
  CLIENT_URL:             z.string().optional(),
  PORT:                   z.string().default('8000').transform(Number),
  REDIS_URL:              z.string().optional(),
  JWT_ACCESS_EXPIRES_IN:  z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SALT_ROUNDS:            z.string().default('12'),
  MASTER_API_KEY:                z.string().optional(),
  MASTER_API_URL:         z.string().optional(),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
