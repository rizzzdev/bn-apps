import { Router } from 'express';
import { webhookController } from '../controller/webhook.controller';
import { requireApiKey } from '@/middleware/apiKey';

export const webhookRoute = Router();

webhookRoute.use(requireApiKey);

webhookRoute.post('/sync-all', webhookController.syncAll);
webhookRoute.post('/:module/sync', webhookController.syncModule);
