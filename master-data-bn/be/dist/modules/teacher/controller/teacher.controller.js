"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherController = exports.TeacherController = void 0;
const service_1 = require("../../../modules/teacher/service");
const response_1 = require("../../../utils/response");
const errors_1 = require("../../../errors");
class TeacherController {
    service;
    constructor(service) {
        this.service = service;
    }
    getAll = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const userId = req.query.userId;
            const includeUser = req.query.includeUser === "true";
            const includePicture = req.query.includePicture === "true";
            const { data, total } = await this.service.getAll(page, limit, userId, includeUser, includePicture);
            const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
            (0, response_1.sendResponse)(res, 200, 'Success fetch data', data, pagination);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    getStatistics = async (req, res, next) => {
        try {
            const data = await this.service.getStatistics();
            (0, response_1.sendResponse)(res, 200, 'Success fetch teacher statistics', data);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    getById = async (req, res, next) => {
        try {
            const includePicture = req.query.includePicture === "true";
            const data = await this.service.getById(req.params.id, includePicture);
            (0, response_1.sendResponse)(res, 200, 'Success fetch data', data);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    create = async (req, res, next) => {
        try {
            const data = await this.service.create(req.body);
            (0, response_1.sendResponse)(res, 201, 'Berhasil ditambahkan', data);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    update = async (req, res, next) => {
        try {
            const data = await this.service.update(req.params.id, req.body);
            (0, response_1.sendResponse)(res, 200, 'Berhasil diperbarui', data);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    delete = async (req, res, next) => {
        try {
            await this.service.delete(req.params.id);
            (0, response_1.sendResponse)(res, 200, 'Berhasil dihapus', null);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    uploadPicture = async (req, res, next) => {
        try {
            if (!req.file) {
                (0, response_1.sendResponse)(res, 400, 'No file uploaded', null);
                return;
            }
            const data = await this.service.uploadPicture(req.params.id, req.file);
            (0, response_1.sendResponse)(res, 200, 'Foto profil berhasil diunggah', data);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    deletePicture = async (req, res, next) => {
        try {
            const data = await this.service.deletePicture(req.params.id);
            (0, response_1.sendResponse)(res, 200, 'Foto profil berhasil dihapus', data);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    getBatch = async (req, res, next) => {
        try {
            const { ids } = req.body;
            const data = await this.service.getBatchByIds(ids);
            (0, response_1.sendResponse)(res, 200, 'Data berhasil diambil', data);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    bulkDelete = async (req, res, next) => {
        try {
            await this.service.bulkDelete(req.body.ids);
            (0, response_1.sendResponse)(res, 200, 'Data berhasil dihapus', null);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    bulkUpdateStatus = async (req, res, next) => {
        try {
            const { ids, status } = req.body;
            const data = await this.service.bulkUpdateStatus(ids, status);
            (0, response_1.sendResponse)(res, 200, 'Status berhasil diperbarui', data);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    bulkCreateFromExcel = async (req, res, next) => {
        try {
            if (!req.file)
                throw new errors_1.BadRequestError('No file uploaded. Please upload an Excel file with field name "file".');
            const data = await this.service.bulkCreateFromExcel(req.file.buffer);
            (0, response_1.sendResponse)(res, 201, 'Berhasil ditambahkan', data);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    downloadExcelTemplate = async (_req, res, next) => {
        try {
            const buffer = await this.service.getExcelTemplate();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="teachers_template.xlsx"');
            res.send(buffer);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
}
exports.TeacherController = TeacherController;
exports.teacherController = new TeacherController(service_1.teacherService);
