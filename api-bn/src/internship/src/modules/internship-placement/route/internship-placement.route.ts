import { Router } from 'express';
import { validate } from '#internship/middlewares/index.js';
import { internshipPlacementController } from '#internship/modules/internship-placement/controller/index.js';
import { createInternshipPlacementSchema, updateInternshipPlacementSchema, bulkDeleteSchema, bulkCreateInternshipPlacementSchema, bulkUpdateStatusSchema, bulkUpdateAssessableSchema } from '#internship/modules/internship-placement/domain/index.js';

export const internshipPlacementRoute = Router();

internshipPlacementRoute.get('/', internshipPlacementController.getAll);
internshipPlacementRoute.get('/:id', internshipPlacementController.getById);
internshipPlacementRoute.post('/', validate(createInternshipPlacementSchema), internshipPlacementController.create);
internshipPlacementRoute.post('/batch', validate(bulkCreateInternshipPlacementSchema), internshipPlacementController.bulkCreate);
internshipPlacementRoute.put('/:id', validate(updateInternshipPlacementSchema), internshipPlacementController.update);
internshipPlacementRoute.post('/batch/delete', validate(bulkDeleteSchema), internshipPlacementController.bulkDelete);
internshipPlacementRoute.post('/batch/update-status', validate(bulkUpdateStatusSchema), internshipPlacementController.bulkUpdateStatus);
internshipPlacementRoute.post('/batch/update-assessable', validate(bulkUpdateAssessableSchema), internshipPlacementController.bulkUpdateAssessable);
internshipPlacementRoute.put('/:id/certificate', internshipPlacementController.updateCertificate);
internshipPlacementRoute.delete('/:id', internshipPlacementController.delete);
