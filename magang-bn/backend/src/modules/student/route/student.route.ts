import { Router } from 'express';
import { studentController } from '@/modules/student/controller/index.js';
import { getWebHooks } from '@/utils/webhook.js';
import { studentWebhook, studentSyncWebhook } from '@/modules/student/index.js';
import { sendResponse } from '@/utils/response.js';

export const studentRoute = Router();

studentRoute.get('/', studentController.getAll);
studentRoute.get('/:id', studentController.getById);

export const studentWebhookRoute = Router();

studentWebhookRoute.all('/', getWebHooks(async (data: any) => {
  await studentWebhook(data)
}));
studentWebhookRoute.post('/sync', async (_request, response, next) => {
  try {
    const syncData = await studentSyncWebhook()
    sendResponse(response, 200, 'Students synced successfully', syncData)
  } catch (error) {
    console.log({error})
    next(error)
  }
});
