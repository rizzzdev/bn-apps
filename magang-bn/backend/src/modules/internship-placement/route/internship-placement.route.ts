import { Router } from 'express';
import { validate } from '@/middlewares/index.js';
import { internshipPlacementController } from '@/modules/internship-placement/controller/index.js';
import { createInternshipPlacementSchema, updateInternshipPlacementSchema, bulkDeleteSchema, bulkCreateInternshipPlacementSchema, bulkUpdateStatusSchema, bulkUpdateAssessableSchema } from '@/modules/internship-placement/domain/index.js';

export const internshipPlacementRoute = Router();

internshipPlacementRoute.get('/', internshipPlacementController.getAll);
internshipPlacementRoute.get('/:id', internshipPlacementController.getById);
internshipPlacementRoute.post('/', validate(createInternshipPlacementSchema), internshipPlacementController.create);
internshipPlacementRoute.post('/bulk', validate(bulkCreateInternshipPlacementSchema), internshipPlacementController.bulkCreate);
internshipPlacementRoute.put('/:id', validate(updateInternshipPlacementSchema), internshipPlacementController.update);
internshipPlacementRoute.post('/bulk-delete', validate(bulkDeleteSchema), internshipPlacementController.bulkDelete);
internshipPlacementRoute.post('/bulk-update-status', validate(bulkUpdateStatusSchema), internshipPlacementController.bulkUpdateStatus);
internshipPlacementRoute.post('/bulk-update-assessable', validate(bulkUpdateAssessableSchema), internshipPlacementController.bulkUpdateAssessable);
internshipPlacementRoute.put('/:id/certificate', internshipPlacementController.updateCertificate);
internshipPlacementRoute.delete('/:id', internshipPlacementController.delete);
