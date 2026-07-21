import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });
import { Router } from 'express';
import { validate } from '@/middlewares/index.js';
import { industryMentorController } from '@/modules/industry-mentor/controller/index.js';
import { createIndustryMentorSchema, updateIndustryMentorSchema, bulkDeleteSchema, bulkEditCompanySchema, changePasswordSchema, bulkCreateIndustryMentorSchema } from '@/modules/industry-mentor/domain/index.js';

export const industryMentorRoute = Router();

industryMentorRoute.get('/', industryMentorController.getAll);
industryMentorRoute.get('/excel/template', industryMentorController.downloadTemplate);
industryMentorRoute.get('/:id', industryMentorController.getById);
industryMentorRoute.post('/bulk', validate(bulkCreateIndustryMentorSchema), industryMentorController.bulkCreateJson);
industryMentorRoute.post('/', validate(createIndustryMentorSchema), industryMentorController.create);
industryMentorRoute.put('/:id', validate(updateIndustryMentorSchema), industryMentorController.update);
industryMentorRoute.patch('/:id/password', validate(changePasswordSchema), industryMentorController.changePassword);
industryMentorRoute.put('/bulk/company', validate(bulkEditCompanySchema), industryMentorController.bulkEditCompanyId);
industryMentorRoute.post('/bulk-delete', validate(bulkDeleteSchema), industryMentorController.bulkDelete);
industryMentorRoute.delete('/:id', industryMentorController.delete);
