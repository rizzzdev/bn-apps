import cors from 'cors';
import { env } from './env';

export const corsConfig = cors({
    origin: [env.MASTER_API_URL, ...(env.CLIENT_URLS || [])],  
    credentials : true
});
