"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.majorController = exports.MajorController = void 0;
const service_1 = require("../../../modules/major/service");
const response_1 = require("../../../utils/response");
const errors_1 = require("../../../errors");
const ExcelJS = __importStar(require("exceljs"));
class MajorController {
    service;
    constructor(service) {
        this.service = service;
    }
    getAll = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const includeClasses = req.query.includeClasses === 'true';
            const includeCurrentStudent = req.query.includeCurrentStudent === 'true';
            const { data, total } = await this.service.getAll(page, limit, includeClasses, includeCurrentStudent);
            const pagination = { currentPage: page, totalPage: Math.ceil(total / limit), totalData: total, dataPerPage: limit };
            (0, response_1.sendResponse)(res, 200, 'Success fetch data', data, pagination);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    getById = async (req, res, next) => {
        try {
            const includeClasses = req.query.includeClasses === 'true';
            const includeCurrentStudent = req.query.includeCurrentStudent === 'true';
            const data = await this.service.getById(req.params.id, includeClasses, includeCurrentStudent);
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
    downloadTemplate = async (req, res, next) => {
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Template Jurusan');
            sheet.columns = [
                { header: 'Kode Jurusan', key: 'code', width: 20 },
                { header: 'Nama Jurusan', key: 'name', width: 40 },
            ];
            sheet.addRow({ code: 'RPL', name: 'Rekayasa Perangkat Lunak' });
            sheet.addRow({ code: 'TKJ', name: 'Teknik Komputer dan Jaringan' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=template-jurusan.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
    bulkCreate = async (req, res, next) => {
        try {
            if (!req.file) {
                throw new errors_1.BadRequestError('File tidak ditemukan');
            }
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(req.file.buffer);
            const worksheet = workbook.worksheets[0];
            const data = [];
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) { // Skip header
                    data.push({
                        code: row.getCell(1).text?.toString().trim(),
                        name: row.getCell(2).text?.toString().trim(),
                    });
                }
            });
            const result = await this.service.bulkCreate(data);
            (0, response_1.sendResponse)(res, 201, 'Proses bulk create selesai', result);
        }
        catch (error) {
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
}
exports.MajorController = MajorController;
exports.majorController = new MajorController(service_1.majorService);
