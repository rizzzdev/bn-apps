import express, { type Request, type Response, type NextFunction } from 'express';
import { SentriError } from 'sentri/express';
import { sendError } from '@/utils/response';
import { BaseError } from '@/errors';
import { appRoutes } from './routes';

import { corsConfig } from '@/configs/cors';

export const app = express();

app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static('public'));

app.use('/api/v1', appRoutes);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SentriError) {
    return sendError(res, err.statusCode || 401, err.message);
  }
  
  if (err instanceof BaseError) {
    return sendError(res, err.statusCode, err.message);
  }

  console.error(err);
  return sendError(res, 500, 'Internal Server Error');
});
