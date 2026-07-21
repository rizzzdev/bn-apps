import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });
import { Router } from 'express';
import { validate } from '@/middlewares/index.js';
import { companyController } from '@/modules/company/controller/index.js';
import { createCompanySchema, updateCompanySchema, bulkDeleteSchema, bulkCreateCompanySchema } from '@/modules/company/domain/index.js';

export const companyRoute = Router();

companyRoute.get('/', companyController.getAll);
companyRoute.get('/excel/template', companyController.downloadTemplate);
companyRoute.get('/:id', companyController.getById);
companyRoute.post('/bulk', validate(bulkCreateCompanySchema), companyController.bulkCreateJson);
companyRoute.post('/', validate(createCompanySchema), companyController.create);
companyRoute.put('/:id', validate(updateCompanySchema), companyController.update);
companyRoute.post('/bulk-delete', validate(bulkDeleteSchema), companyController.bulkDelete);
companyRoute.delete('/:id', companyController.delete);
