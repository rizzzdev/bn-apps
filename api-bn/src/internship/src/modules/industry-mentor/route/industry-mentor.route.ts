import { validate } from '@internship/middlewares/index.js';
import { Router } from 'express';
import { industryMentorController } from '@internship/modules/industry-mentor/controller/index.js';
import {
  createIndustryMentorSchema,
  updateIndustryMentorSchema,
  bulkDeleteSchema,
  bulkEditCompanySchema,
  changePasswordSchema,
  bulkCreateIndustryMentorSchema,
} from '@internship/modules/industry-mentor/domain/index.js';
import { sentriAuth } from '@auth/index.js';

export const industryMentorRoute = Router();

// Template & batch routes — didefinisikan sebelum `/:id`
industryMentorRoute.get('/template', industryMentorController.downloadTemplate);
industryMentorRoute.post('/batch', validate(bulkCreateIndustryMentorSchema), industryMentorController.bulkCreateJson);
industryMentorRoute.post('/batch/delete', validate(bulkDeleteSchema), industryMentorController.bulkDelete);
industryMentorRoute.delete('/batch', validate(bulkDeleteSchema), industryMentorController.bulkDelete);
industryMentorRoute.delete('/', validate(bulkDeleteSchema), industryMentorController.bulkDelete);
industryMentorRoute.patch('/batch/company', validate(bulkEditCompanySchema), industryMentorController.bulkEditCompanyId);

// CRUD routes
industryMentorRoute.get('/', industryMentorController.getAll);
industryMentorRoute.get('/:id', industryMentorController.getById);
industryMentorRoute.post('/', validate(createIndustryMentorSchema), industryMentorController.create);
industryMentorRoute.put('/:id', validate(updateIndustryMentorSchema), industryMentorController.update);
industryMentorRoute.patch('/:id/password', sentriAuth.authorize("super_admin"), validate(changePasswordSchema), industryMentorController.changePassword);
industryMentorRoute.delete('/:id', industryMentorController.delete);
