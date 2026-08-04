import { Router } from 'express';
import { classSubjectRequirementController } from '../controller';
import { validate } from '#academic/middlewares/validate';
import {
  createClassSubjectRequirementSchema,
  updateClassSubjectRequirementSchema,
  bulkUpsertClassSubjectRequirementSchema,
} from '../domain';

export const classSubjectRequirementsRoute = Router();

classSubjectRequirementsRoute.get('/', classSubjectRequirementController.getAll);
classSubjectRequirementsRoute.post('/', validate(createClassSubjectRequirementSchema), classSubjectRequirementController.upsert);
classSubjectRequirementsRoute.post('/batch', validate(bulkUpsertClassSubjectRequirementSchema), classSubjectRequirementController.bulkUpsert);
classSubjectRequirementsRoute.delete('/batch', classSubjectRequirementController.bulkDelete);
classSubjectRequirementsRoute.delete('/clear', classSubjectRequirementController.clearAll);
classSubjectRequirementsRoute.get('/:id', classSubjectRequirementController.getById);
classSubjectRequirementsRoute.put('/:id', validate(updateClassSubjectRequirementSchema), classSubjectRequirementController.update);
classSubjectRequirementsRoute.delete('/:id', classSubjectRequirementController.delete);
