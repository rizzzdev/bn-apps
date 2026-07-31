import { validate } from '@master/middlewares';
import { uploadAttachment, uploadAttachments } from '@master/middlewares/upload.middleware';
import { Router } from 'express';
import { attachmentController } from '@master/modules/attachment/controller';
import { batchGetAttachmentsSchema, bulkDeleteAttachmentsSchema } from '@master/modules/attachment/domain';

export const attachmentRoute = Router();

// Single upload
attachmentRoute.post('/', uploadAttachment, attachmentController.uploadSingle);
attachmentRoute.get('/file/:url', attachmentController.serveFile);

// Batch routes — didefinisikan sebelum `/:id`
attachmentRoute.post('/batch/upload', uploadAttachments, attachmentController.uploadBulk);
attachmentRoute.post('/batch/get', validate(batchGetAttachmentsSchema), attachmentController.getBatch);
attachmentRoute.post('/batch/delete', validate(bulkDeleteAttachmentsSchema), attachmentController.deleteBulk);

// Single delete
attachmentRoute.delete('/:id', attachmentController.deleteSingle);
