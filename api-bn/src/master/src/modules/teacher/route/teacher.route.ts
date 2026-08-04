import { validate, uploadExcel } from '#master/middlewares';
import { Router } from 'express';
import { teacherController } from '#master/modules/teacher/controller';
import { batchGetTeacherSchema, createTeacherSchema, updateTeacherSchema, bulkUpdateTeacherStatusSchema, changePasswordSchema } from '#master/modules/teacher/domain';
import { z } from 'zod';
import { uploadAttachment } from '#master/middlewares/upload.middleware';
import { sentriAuth } from '#auth';

export const teacherRoute = Router();

// Batch routes — didefinisikan sebelum `/:id`
teacherRoute.post('/batch/get', validate(batchGetTeacherSchema), teacherController.getBatch);
teacherRoute.post('/batch/delete', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), teacherController.bulkDelete);
teacherRoute.patch('/batch/status', validate(bulkUpdateTeacherStatusSchema), teacherController.bulkUpdateStatus);
teacherRoute.post('/batch/excel', uploadExcel, teacherController.bulkCreateFromExcel);
teacherRoute.get('/template', teacherController.downloadExcelTemplate);

// Picture routes
teacherRoute.put('/:id/picture', uploadAttachment, teacherController.uploadPicture);
teacherRoute.delete('/:id/picture', teacherController.deletePicture);

// Password route
teacherRoute.patch('/:id/password', sentriAuth.authorize("super_admin"), validate(changePasswordSchema), teacherController.changePassword);

// CRUD routes
teacherRoute.get('/statistics', teacherController.getStatistics);
teacherRoute.get('/', teacherController.getAll);
teacherRoute.get('/:id', teacherController.getById);
teacherRoute.post('/', validate(createTeacherSchema), teacherController.create);
teacherRoute.put('/:id', validate(updateTeacherSchema), teacherController.update);
teacherRoute.delete('/:id', teacherController.delete);
