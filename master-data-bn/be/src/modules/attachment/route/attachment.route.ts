import { validate } from '@/middlewares';
import { uploadAttachment, uploadAttachments } from '@/middlewares/upload.middleware';
import { Router } from 'express';
import { attachmentController } from '@/modules/attachment/controller';
import { batchGetAttachmentsSchema, bulkDeleteAttachmentsSchema } from '@/modules/attachment/domain';
import { z } from 'zod';

export const attachmentRoute = Router();

attachmentRoute.post('/', uploadAttachment, attachmentController.uploadSingle);
attachmentRoute.post('/bulk', uploadAttachments, attachmentController.uploadBulk);
attachmentRoute.post('/batch', validate(batchGetAttachmentsSchema), attachmentController.getBatch);
attachmentRoute.delete('/bulk', validate(bulkDeleteAttachmentsSchema), attachmentController.deleteBulk);
attachmentRoute.delete('/:id', attachmentController.deleteSingle);
