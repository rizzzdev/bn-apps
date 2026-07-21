import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("8000").transform(Number),
  DATABASE_URL: z.string().url(),
  MASTER_API_URL: z.string().url(),
  API_KEY: z.string(),
  AUTH_KEY_URI: z.string().url(),
  CLIENT_URLS: z
    .string()
    .transform((urls) => urls.split(",").map((url) => url.trim())),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
