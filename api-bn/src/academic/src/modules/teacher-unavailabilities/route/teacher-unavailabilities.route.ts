import { Router } from 'express';
import { teacherUnavailabilityController } from '../controller';
import { validate } from '#academic/middlewares/validate';
import { uploadExcel } from '#app/middlewares/upload-excel.middleware.js';
import { createTeacherUnavailabilitySchema, bulkSetTeacherUnavailabilitySchema } from '../domain';
import { z } from 'zod';

export const teacherUnavailabilitiesRoute = Router();

// CRUD single
teacherUnavailabilitiesRoute.get('/', teacherUnavailabilityController.getAll);
teacherUnavailabilitiesRoute.post('/', validate(createTeacherUnavailabilitySchema), teacherUnavailabilityController.create);
teacherUnavailabilitiesRoute.get('/template', teacherUnavailabilityController.downloadExcelTemplate);
teacherUnavailabilitiesRoute.get('/export', teacherUnavailabilityController.downloadExcelExport);
teacherUnavailabilitiesRoute.delete('/:id', teacherUnavailabilityController.delete);

// Batch routes — distandardisasi
teacherUnavailabilitiesRoute.post('/batch', validate(bulkSetTeacherUnavailabilitySchema), teacherUnavailabilityController.bulkSet);
teacherUnavailabilitiesRoute.post('/batch/excel', uploadExcel, teacherUnavailabilityController.bulkCreateFromExcel);
teacherUnavailabilitiesRoute.post('/batch/delete', validate(z.object({ ids: z.array(z.string().min(1)).min(1) })), teacherUnavailabilityController.bulkDelete);
