import express from 'express';
import { SentriError } from 'sentri/express';
import { sendError } from '../utils/response';
import { BaseError } from '../errors';
import { appRoutes } from './routes';
import { ZodError } from 'zod';
import { corsConfig } from '../configs/cors';
export const app = express();
app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
app.use('/api/v1', appRoutes);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR HANDLER]:', err);
    if (err instanceof ZodError) {
        const message = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ') || 'Validasi gagal';
        return sendError(res, 400, message);
    }
    if (err instanceof SentriError ||
        err?.name === 'SentriError' ||
        (typeof err === 'object' && err !== null && 'statusCode' in err && 'message' in err)) {
        return sendError(res, err.statusCode || 400, err.message || 'Terjadi kesalahan');
    }
    if (err instanceof BaseError) {
        return sendError(res, err.statusCode, err.message);
    }
    if (err?.code === 'P2003') {
        return sendError(res, 400, 'Data referensi (Kelas atau Guru) tidak terdaftar di sistem');
    }
    return sendError(res, 500, err.message || 'Internal Server Error');
});
