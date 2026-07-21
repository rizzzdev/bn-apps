import { validate, uploadExcel } from '@/middlewares';
import { Router } from 'express';
import { studentController } from '@/modules/student/controller';
import { batchGetStudentSchema, createStudentSchema, updateStudentSchema, bulkUpdateStudentStatusSchema } from '@/modules/student/domain';
import { z } from 'zod';
import { uploadAttachment } from '@/middlewares/upload.middleware';

export const studentRoute = Router();

// Bulk routes — must be defined BEFORE /:id to avoid route conflict
studentRoute.post('/batch', validate(batchGetStudentSchema), studentController.getBatch);
studentRoute.post('/bulk', validate(z.array(createStudentSchema)), studentController.bulkCreate);
studentRoute.delete('/bulk', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), studentController.bulkDelete);
studentRoute.patch('/bulk/status', validate(bulkUpdateStudentStatusSchema), studentController.bulkUpdateStatus);
studentRoute.post('/bulk/excel', uploadExcel, studentController.bulkCreateFromExcel);
studentRoute.get('/bulk/excel-template', studentController.downloadExcelTemplate);

// Statistic routes
studentRoute.get('/statistic', studentController.getStatistic);

// Picture routes — must be BEFORE /:id to avoid route conflict? No, /:id/picture is fine after
studentRoute.put('/:id/picture', uploadAttachment, studentController.uploadPicture);
studentRoute.delete('/:id/picture', studentController.deletePicture);

// CRUD routes
studentRoute.get('/', studentController.getAll);
studentRoute.get('/:id', studentController.getById);
studentRoute.post('/', validate(createStudentSchema), studentController.create);
studentRoute.put('/:id', validate(updateStudentSchema), studentController.update);
studentRoute.delete('/:id', studentController.delete);
