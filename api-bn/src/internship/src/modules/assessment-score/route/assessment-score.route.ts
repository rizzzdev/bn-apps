import { Router } from 'express';
import { validate } from '@internship/middlewares/index.js';
import { assessmentScoreController } from '@internship/modules/assessment-score/controller/index.js';
import {
  createAssessmentScoreSchema,
  updateAssessmentScoreSchema,
  bulkSubmitScoreSchema,
} from '@internship/modules/assessment-score/domain/index.js';

export const assessmentScoreRoute = Router();

assessmentScoreRoute.get('/', assessmentScoreController.getByPlacementId);
assessmentScoreRoute.get('/:id', assessmentScoreController.getById);
assessmentScoreRoute.post('/', validate(createAssessmentScoreSchema), assessmentScoreController.create);
assessmentScoreRoute.post('/upsert', validate(createAssessmentScoreSchema), assessmentScoreController.upsert);
assessmentScoreRoute.post('/bulk', validate(bulkSubmitScoreSchema), assessmentScoreController.bulkSubmit);
assessmentScoreRoute.put('/:id', validate(updateAssessmentScoreSchema), assessmentScoreController.update);
assessmentScoreRoute.delete('/:id', assessmentScoreController.delete);
