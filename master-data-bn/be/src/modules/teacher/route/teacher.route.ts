import { validate, uploadExcel } from '@/middlewares';
import { Router } from 'express';
import { teacherController } from '@/modules/teacher/controller';
import { batchGetTeacherSchema, createTeacherSchema, updateTeacherSchema, bulkUpdateTeacherStatusSchema } from '@/modules/teacher/domain';
import { z } from 'zod';
import { uploadAttachment } from '@/middlewares/upload.middleware';

export const teacherRoute = Router();

// Bulk routes — must be defined BEFORE /:id to avoid route conflict
teacherRoute.post('/batch', validate(batchGetTeacherSchema), teacherController.getBatch);
teacherRoute.delete('/bulk', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), teacherController.bulkDelete);
teacherRoute.patch('/bulk/status', validate(bulkUpdateTeacherStatusSchema), teacherController.bulkUpdateStatus);
teacherRoute.post('/bulk/excel', uploadExcel, teacherController.bulkCreateFromExcel);
teacherRoute.get('/bulk/excel-template', teacherController.downloadExcelTemplate);

// Picture routes
teacherRoute.put('/:id/picture', uploadAttachment, teacherController.uploadPicture);
teacherRoute.delete('/:id/picture', teacherController.deletePicture);

// CRUD routes
teacherRoute.get('/statistics', teacherController.getStatistics);
teacherRoute.get('/', teacherController.getAll);
teacherRoute.get('/:id', teacherController.getById);
teacherRoute.post('/', validate(createTeacherSchema), teacherController.create);
teacherRoute.put('/:id', validate(updateTeacherSchema), teacherController.update);
teacherRoute.delete('/:id', teacherController.delete);
