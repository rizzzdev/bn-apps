"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicyearController = exports.AcademicYearController = void 0;
const service_1 = require("../../../modules/academic-year/service");
const response_1 = require("../../../utils/response");
class AcademicYearController {
    service;
    constructor(service) {
        this.service = service;
    }
    getAll = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const includeSemesters = req.query.includeSemesters === 'true';
            const { data, total } = await this.service.getAll(page, limit, includeSemesters);
            const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
            (0, response_1.sendResponse)(res, 200, 'Success fetch data', data, pagination);
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const includeSemesters = req.query.includeSemesters === 'true';
            const data = await this.service.getById(req.params.id, includeSemesters);
            (0, response_1.sendResponse)(res, 200, 'Success fetch data', data);
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const data = await this.service.create(req.body);
            (0, response_1.sendResponse)(res, 201, 'Berhasil ditambahkan', data);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const data = await this.service.update(req.params.id, req.body);
            (0, response_1.sendResponse)(res, 200, 'Berhasil diperbarui', data);
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            await this.service.delete(req.params.id);
            (0, response_1.sendResponse)(res, 200, 'Berhasil dihapus', null);
        }
        catch (error) {
            next(error);
        }
    };
    getBatch = async (req, res, next) => {
        try {
            const { ids } = req.body;
            const data = await this.service.getBatchByIds(ids);
            (0, response_1.sendResponse)(res, 200, 'Data berhasil diambil', data);
        }
        catch (error) {
            next(error);
        }
    };
    bulkDelete = async (req, res, next) => {
        try {
            await this.service.bulkDelete(req.body.ids);
            (0, response_1.sendResponse)(res, 200, 'Data berhasil dihapus', null);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AcademicYearController = AcademicYearController;
exports.academicyearController = new AcademicYearController(service_1.academicyearService);
