"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRoute = void 0;
const middlewares_1 = require("../../../middlewares");
const express_1 = require("express");
const controller_1 = require("../../../modules/student/controller");
const domain_1 = require("../../../modules/student/domain");
const zod_1 = require("zod");
const upload_middleware_1 = require("../../../middlewares/upload.middleware");
exports.studentRoute = (0, express_1.Router)();
// Bulk routes — must be defined BEFORE /:id to avoid route conflict
exports.studentRoute.post('/batch', (0, middlewares_1.validate)(domain_1.batchGetStudentSchema), controller_1.studentController.getBatch);
exports.studentRoute.post('/bulk', (0, middlewares_1.validate)(zod_1.z.array(domain_1.createStudentSchema)), controller_1.studentController.bulkCreate);
exports.studentRoute.delete('/bulk', (0, middlewares_1.validate)(zod_1.z.object({ ids: zod_1.z.array(zod_1.z.string().min(1)).min(1) })), controller_1.studentController.bulkDelete);
exports.studentRoute.patch('/bulk/status', (0, middlewares_1.validate)(domain_1.bulkUpdateStudentStatusSchema), controller_1.studentController.bulkUpdateStatus);
exports.studentRoute.post('/bulk/excel', middlewares_1.uploadExcel, controller_1.studentController.bulkCreateFromExcel);
exports.studentRoute.get('/bulk/excel-template', controller_1.studentController.downloadExcelTemplate);
// Statistic routes
exports.studentRoute.get('/statistic', controller_1.studentController.getStatistic);
// Picture routes — must be BEFORE /:id to avoid route conflict? No, /:id/picture is fine after
exports.studentRoute.put('/:id/picture', upload_middleware_1.uploadAttachment, controller_1.studentController.uploadPicture);
exports.studentRoute.delete('/:id/picture', controller_1.studentController.deletePicture);
// CRUD routes
exports.studentRoute.get('/', controller_1.studentController.getAll);
exports.studentRoute.get('/:id', controller_1.studentController.getById);
exports.studentRoute.post('/', (0, middlewares_1.validate)(domain_1.createStudentSchema), controller_1.studentController.create);
exports.studentRoute.put('/:id', (0, middlewares_1.validate)(domain_1.updateStudentSchema), controller_1.studentController.update);
exports.studentRoute.delete('/:id', controller_1.studentController.delete);
