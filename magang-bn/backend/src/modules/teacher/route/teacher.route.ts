import { Router } from 'express';
import { teacherController } from '@/modules/teacher/controller/index.js';
import { getWebHooks } from '@/utils/webhook.js';
import { teacherWebhook, teacherSyncWebhook } from '@/modules/teacher/index.js';
import { sendResponse } from '@/utils/response.js';

export const teacherRoute = Router();

teacherRoute.get('/', teacherController.getAll);
teacherRoute.get('/:id', teacherController.getById);

export const teacherWebhookRoute = Router();

teacherWebhookRoute.all('/', getWebHooks(async (data: any) => {
  console.log({data})
  // await teacherWebhook(data)
}));
teacherWebhookRoute.post('/sync', async (_request, response, next) => {
  try {
    const syncData = await teacherSyncWebhook()
    sendResponse(response, 200, 'Teachers synced successfully', syncData)
  } catch (error) {
    console.log({error})
    next(error)
  }
});
