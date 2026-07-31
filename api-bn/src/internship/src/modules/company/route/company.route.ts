import { validate } from '@internship/middlewares/index.js';
import { Router } from 'express';
import { companyController } from '@internship/modules/company/controller/index.js';
import { createCompanySchema, updateCompanySchema, bulkDeleteSchema, bulkCreateCompanySchema } from '@internship/modules/company/domain/index.js';

export const companyRoute = Router();

// Template & batch routes — didefinisikan sebelum `/:id`
companyRoute.get('/template', companyController.downloadTemplate);
companyRoute.post('/batch', validate(bulkCreateCompanySchema), companyController.bulkCreateJson);
companyRoute.post('/batch/delete', validate(bulkDeleteSchema), companyController.bulkDelete);

// CRUD routes
companyRoute.get('/', companyController.getAll);
companyRoute.get('/:id', companyController.getById);
companyRoute.post('/', validate(createCompanySchema), companyController.create);
companyRoute.put('/:id', validate(updateCompanySchema), companyController.update);
companyRoute.delete('/:id', companyController.delete);
