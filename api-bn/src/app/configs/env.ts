import "dotenv/config"
import z from "zod"

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    DB_URL: z.string(),
    PORT: z.string().default("3000"),
    ACCESS_TOKEN_EXPIRES: z.string().default("5m"),
    REFRESH_TOKEN_EXPIRES: z.string().default("1d"),
    API_KEY: z.string(),
    SALT_ROUNDS: z.string().default("10").transform((roundStr) => parseInt(roundStr)),
    REDIS_URL: z.string().optional(),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_KEY: z.string().optional(),
    SUPABASE_BUCKET: z.string().optional(),
    CLIENT_URLS: z
        .string()
        .default("http://localhost:5173,http://localhost:9093,http://localhost:9082,http://localhost:9072,http://127.0.0.1:5173,http://127.0.0.1:9072")
        .transform((val) => val.split(",").map((url) => url.trim().replace(/\/+$/, "")).filter(Boolean)),
})


const { success, data, error } = envSchema.safeParse(process.env)
if (!success) {
    console.error({ error })
    process.exit(1)
}

export const env = data