import { Router, type Request, type Response, type NextFunction } from 'express';
import { env } from '@/configs/env';
import { webhookController } from '@/modules/webhook/webhook.controller';
import { UnauthorizedError } from '@/errors';

export const webhookRoute = Router();

const validateApiKey = (req: Request, _res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== env.API_KEY) {
    throw new UnauthorizedError('invalid API key');
  }
  next();
};

webhookRoute.use(validateApiKey);

webhookRoute.post('/sync-all', webhookController.handleSyncAll);
webhookRoute.post('/:module/sync', webhookController.handleSync);
webhookRoute.post('/:module', webhookController.handleIncoming);
