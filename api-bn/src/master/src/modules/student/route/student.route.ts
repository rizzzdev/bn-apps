import { validate, uploadExcel } from '@master/middlewares';
import { Router } from 'express';
import { studentController } from '@master/modules/student/controller';
import { batchGetStudentSchema, createStudentSchema, updateStudentSchema, bulkUpdateStudentStatusSchema, changePasswordSchema } from '@master/modules/student/domain';
import { z } from 'zod';
import { uploadAttachment } from '@master/middlewares/upload.middleware';
import { batchCreateDataSchema } from '@app/utils/batch-schemas';
import { sentriAuth } from '@auth/index.js';

export const studentRoute = Router();

// Batch routes — didefinisikan sebelum `/:id`
studentRoute.post('/batch/get', validate(batchGetStudentSchema), studentController.getBatch);
studentRoute.post('/batch', validate(batchCreateDataSchema(createStudentSchema)), studentController.bulkCreate);
studentRoute.post('/batch/delete', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), studentController.bulkDelete);
studentRoute.patch('/batch/status', validate(bulkUpdateStudentStatusSchema), studentController.bulkUpdateStatus);
studentRoute.post('/batch/excel', uploadExcel, studentController.bulkCreateFromExcel);
studentRoute.get('/template', studentController.downloadExcelTemplate);

// Statistic routes
studentRoute.get('/statistic', studentController.getStatistic);

// Picture routes
studentRoute.put('/:id/picture', uploadAttachment, studentController.uploadPicture);
studentRoute.delete('/:id/picture', studentController.deletePicture);

// Password route
studentRoute.patch('/:id/password', sentriAuth.authorize("super_admin"), validate(changePasswordSchema), studentController.changePassword);

// CRUD routes
studentRoute.get('/', studentController.getAll);
studentRoute.get('/:id', studentController.getById);
studentRoute.post('/', validate(createStudentSchema), studentController.create);
studentRoute.put('/:id', validate(updateStudentSchema), studentController.update);
studentRoute.delete('/:id', studentController.delete);
