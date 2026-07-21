import express, { type Request, type Response, type NextFunction } from 'express';
import { Prisma } from '@/database/generated/client';
import { SentriError } from 'sentri/express';
import { corsConfig } from '@/configs/cors';
import { webhookRoute } from '@/modules/webhook';
import { appRoutes } from '@/app/routes';
import { sendError } from '@/utils/response';

export const createServer = () => {
  const app = express();

  app.use(corsConfig);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/v1/webhook', webhookRoute);
  app.use('/api/v1', appRoutes);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof SentriError) {
      console.log({err})
      return sendError(res, err.statusCode, err.message);
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return sendError(res, 409, 'Data sudah ada');
      }
      return sendError(res, 400, `Database error: ${err.message}`);
    }
    console.error('[Error]', err);
    console.log({err})
    return sendError(res, 500, 'Internal Server Error');
  });

  return app;
};
