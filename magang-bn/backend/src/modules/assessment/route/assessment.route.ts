import { Router } from 'express';
import { validate } from '@/middlewares/index.js';
import { assessmentController } from '@/modules/assessment/controller/index.js';
import { createAssessmentSchema, updateAssessmentSchema, bulkDeleteSchema } from '@/modules/assessment/domain/index.js';

export const assessmentRoute = Router();

assessmentRoute.get('/', assessmentController.getAll);
assessmentRoute.get('/:id', assessmentController.getById);
assessmentRoute.post('/', validate(createAssessmentSchema), assessmentController.create);
assessmentRoute.put('/:id/certificate', assessmentController.updateCertificate);
assessmentRoute.delete('/:id/certificate', assessmentController.removeCertificate);
assessmentRoute.put('/:id', validate(updateAssessmentSchema), assessmentController.update);
assessmentRoute.post('/bulk-delete', validate(bulkDeleteSchema), assessmentController.bulkDelete);
assessmentRoute.delete('/:id', assessmentController.delete);
