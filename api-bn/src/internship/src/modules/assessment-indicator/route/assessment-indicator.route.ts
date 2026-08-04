import { Router } from 'express';
import { validate } from '#internship/middlewares/index.js';
import { assessmentIndicatorController } from '#internship/modules/assessment-indicator/controller/index.js';
import {
  createAssessmentIndicatorSchema,
  updateAssessmentIndicatorSchema,
  bulkCreateAssessmentIndicatorSchema,
  bulkDeleteIndicatorSchema,
} from '#internship/modules/assessment-indicator/domain/index.js';

export const assessmentIndicatorRoute = Router();

assessmentIndicatorRoute.get('/', assessmentIndicatorController.getByPlacementId);
assessmentIndicatorRoute.get('/:id', assessmentIndicatorController.getById);
assessmentIndicatorRoute.post('/', validate(createAssessmentIndicatorSchema), assessmentIndicatorController.create);
assessmentIndicatorRoute.post('/bulk', validate(bulkCreateAssessmentIndicatorSchema), assessmentIndicatorController.bulkCreate);
assessmentIndicatorRoute.put('/:id', validate(updateAssessmentIndicatorSchema), assessmentIndicatorController.update);
assessmentIndicatorRoute.post('/batch/delete', validate(bulkDeleteIndicatorSchema), assessmentIndicatorController.bulkDelete);
assessmentIndicatorRoute.delete('/:id', assessmentIndicatorController.delete);
