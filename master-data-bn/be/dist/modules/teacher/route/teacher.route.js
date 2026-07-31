"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherRoute = void 0;
const middlewares_1 = require("../../../middlewares");
const express_1 = require("express");
const controller_1 = require("../../../modules/teacher/controller");
const domain_1 = require("../../../modules/teacher/domain");
const zod_1 = require("zod");
const upload_middleware_1 = require("../../../middlewares/upload.middleware");
exports.teacherRoute = (0, express_1.Router)();
// Bulk routes — must be defined BEFORE /:id to avoid route conflict
exports.teacherRoute.post('/batch', (0, middlewares_1.validate)(domain_1.batchGetTeacherSchema), controller_1.teacherController.getBatch);
exports.teacherRoute.delete('/bulk', (0, middlewares_1.validate)(zod_1.z.object({ ids: zod_1.z.array(zod_1.z.string().min(1)).min(1) })), controller_1.teacherController.bulkDelete);
exports.teacherRoute.patch('/bulk/status', (0, middlewares_1.validate)(domain_1.bulkUpdateTeacherStatusSchema), controller_1.teacherController.bulkUpdateStatus);
exports.teacherRoute.post('/bulk/excel', middlewares_1.uploadExcel, controller_1.teacherController.bulkCreateFromExcel);
exports.teacherRoute.get('/bulk/excel-template', controller_1.teacherController.downloadExcelTemplate);
// Picture routes
exports.teacherRoute.put('/:id/picture', upload_middleware_1.uploadAttachment, controller_1.teacherController.uploadPicture);
exports.teacherRoute.delete('/:id/picture', controller_1.teacherController.deletePicture);
// CRUD routes
exports.teacherRoute.get('/statistics', controller_1.teacherController.getStatistics);
exports.teacherRoute.get('/', controller_1.teacherController.getAll);
exports.teacherRoute.get('/:id', controller_1.teacherController.getById);
exports.teacherRoute.post('/', (0, middlewares_1.validate)(domain_1.createTeacherSchema), controller_1.teacherController.create);
exports.teacherRoute.put('/:id', (0, middlewares_1.validate)(domain_1.updateTeacherSchema), controller_1.teacherController.update);
exports.teacherRoute.delete('/:id', controller_1.teacherController.delete);
