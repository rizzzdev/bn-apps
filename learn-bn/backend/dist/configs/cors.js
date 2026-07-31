import cors from 'cors';
import { env } from './env';
export const corsConfig = cors({
    origin: env.CLIENT_URL.split(",").map(u => u.trim()).filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
    credentials: true,
});
