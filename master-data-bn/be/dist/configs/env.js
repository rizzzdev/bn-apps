"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url(),
    CLIENT_URL: zod_1.z.string(),
    WEBHOOK_CLIENT_URL: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().optional(),
    PORT: zod_1.z.string().default("8000").transform(Number),
    CORS_ORIGIN: zod_1.z.string().optional().default("*"),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default("7d"),
    SALT_ROUNDS: zod_1.z.string().default("12"),
    API_KEY: zod_1.z.string().optional(),
    SUPABASE_URL: zod_1.z.string().optional(),
    SUPABASE_SERVICE_KEY: zod_1.z.string().optional(),
    SUPABASE_BUCKET: zod_1.z.string().default("attachments"),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error("Invalid environment variables:", _env.error.format());
    process.exit(1);
}
exports.env = _env.data;
