import { Router } from 'express';
import { classSubjectRequirementController } from '../controller';
import { validate } from '#academic/middlewares/validate';
import { uploadExcel } from '#app/middlewares/upload-excel.middleware.js';
import {
  createClassSubjectRequirementSchema,
  updateClassSubjectRequirementSchema,
  bulkUpsertClassSubjectRequirementSchema,
} from '../domain';

export const classSubjectRequirementsRoute = Router();

classSubjectRequirementsRoute.get('/', classSubjectRequirementController.getAll);
classSubjectRequirementsRoute.post('/', validate(createClassSubjectRequirementSchema), classSubjectRequirementController.upsert);
classSubjectRequirementsRoute.get('/template', classSubjectRequirementController.downloadExcelTemplate);
classSubjectRequirementsRoute.post('/batch', validate(bulkUpsertClassSubjectRequirementSchema), classSubjectRequirementController.bulkUpsert);
classSubjectRequirementsRoute.post('/batch/excel', uploadExcel, classSubjectRequirementController.bulkCreateFromExcel);
classSubjectRequirementsRoute.delete('/batch', classSubjectRequirementController.bulkDelete);
classSubjectRequirementsRoute.delete('/clear', classSubjectRequirementController.clearAll);
classSubjectRequirementsRoute.get('/export', classSubjectRequirementController.downloadExcelExport);
classSubjectRequirementsRoute.get('/:id', classSubjectRequirementController.getById);
classSubjectRequirementsRoute.put('/:id', validate(updateClassSubjectRequirementSchema), classSubjectRequirementController.update);
classSubjectRequirementsRoute.delete('/:id', classSubjectRequirementController.delete);
