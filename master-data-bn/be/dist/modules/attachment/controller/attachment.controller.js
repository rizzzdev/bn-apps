"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentController = exports.AttachmentController = void 0;
const service_1 = require("../../../modules/attachment/service");
const response_1 = require("../../../utils/response");
const storage_1 = require("../../../utils/storage");
class AttachmentController {
    service;
    constructor(service) {
        this.service = service;
    }
    uploadSingle = async (req, res, next) => {
        try {
            if (!req.file) {
                (0, response_1.sendResponse)(res, 400, 'No file uploaded', null);
                return;
            }
            const data = await this.service.upload(req.file);
            (0, response_1.sendResponse)(res, 201, 'File uploaded successfully', data);
        }
        catch (error) {
            next(error);
        }
    };
    uploadBulk = async (req, res, next) => {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                (0, response_1.sendResponse)(res, 400, 'No files uploaded', null);
                return;
            }
            const data = await this.service.uploadBulk(req.files);
            (0, response_1.sendResponse)(res, 201, 'Files uploaded successfully', data);
        }
        catch (error) {
            next(error);
        }
    };
    deleteSingle = async (req, res, next) => {
        try {
            await this.service.delete(req.params.id);
            (0, response_1.sendResponse)(res, 200, 'Attachment deleted successfully', null);
        }
        catch (error) {
            next(error);
        }
    };
    deleteBulk = async (req, res, next) => {
        try {
            await this.service.bulkDelete(req.body.ids);
            (0, response_1.sendResponse)(res, 200, 'Attachments deleted successfully', null);
        }
        catch (error) {
            next(error);
        }
    };
    getBatch = async (req, res, next) => {
        try {
            const { ids } = req.body;
            const data = await this.service.getBatchByIds(ids);
            (0, response_1.sendResponse)(res, 200, 'Attachments fetched successfully', data);
        }
        catch (error) {
            next(error);
        }
    };
    serveFile = async (req, res, next) => {
        try {
            const { url } = req.params;
            const attachment = await this.service.getFileByUrl(url);
            const storage = (0, storage_1.getStorage)();
            const { buffer, contentType } = await storage.getFile(attachment.url);
            res.set('Content-Type', contentType);
            res.set('Content-Disposition', `inline; filename="${attachment.filename}"`);
            res.send(buffer);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AttachmentController = AttachmentController;
exports.attachmentController = new AttachmentController(service_1.attachmentService);
