"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classController = exports.ClassController = void 0;
const service_1 = require("../../../modules/class/service");
const response_1 = require("../../../utils/response");
class ClassController {
    service;
    constructor(service) {
        this.service = service;
    }
    getAll = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const includeMajor = req.query.includeMajor === 'true';
            const includeCurrentStudent = req.query.includeCurrentStudent === 'true';
            const { data, total } = await this.service.getAll(page, limit, includeMajor, includeCurrentStudent);
            const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
            (0, response_1.sendResponse)(res, 200, 'Success fetch data', data, pagination);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    getById = async (req, res, next) => {
        try {
            const includeMajor = req.query.includeMajor === 'true';
            const includeCurrentStudent = req.query.includeCurrentStudent === 'true';
            const data = await this.service.getById(req.params.id, includeMajor, includeCurrentStudent);
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
}
exports.ClassController = ClassController;
exports.classController = new ClassController(service_1.classService);
