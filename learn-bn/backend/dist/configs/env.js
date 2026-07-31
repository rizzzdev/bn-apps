import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const envSchema = z.object({
    PORT: z.string().default('9061'),
    DATABASE_URL: z.string(),
    MASTER_API_URL: z.string(),
    AKADEMIK_API_URL: z.string(),
    API_KEY: z.string().min(1),
    CLIENT_URL: z.string(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', z.treeifyError(parsed.error));
    process.exit(1);
}
export const env = parsed.data;
