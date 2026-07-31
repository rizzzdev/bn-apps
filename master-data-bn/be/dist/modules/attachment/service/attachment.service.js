"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentService = exports.AttachmentService = void 0;
const repository_1 = require("../../../modules/attachment/repository");
const errors_1 = require("../../../errors");
const storage_1 = require("../../../utils/storage");
const path_1 = __importDefault(require("path"));
class AttachmentService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async upload(file) {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const sizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(4));
        const filename = file.filename || path_1.default.basename(file.path);
        const data = {
            filename: file.originalname,
            format: ext.replace('.', ''),
            size: sizeMB,
            url: filename,
        };
        const created = await this.repository.create(data);
        return created;
    }
    async uploadBulk(files) {
        const results = [];
        for (const file of files) {
            const result = await this.upload(file);
            results.push(result);
        }
        return results;
    }
    async delete(id) {
        const attachment = await this.repository.findById(id);
        if (!attachment)
            throw new errors_1.NotFoundError('Attachment not found');
        await this.repository.softDelete(id);
        const storage = (0, storage_1.getStorage)();
        await storage.delete(attachment.url);
        return true;
    }
    async bulkDelete(ids) {
        const storage = (0, storage_1.getStorage)();
        const attachments = await Promise.all(ids.map((id) => this.repository.findById(id)));
        const existingIds = [];
        for (const attachment of attachments) {
            if (attachment) {
                existingIds.push(attachment.id);
                await storage.delete(attachment.url);
            }
        }
        if (existingIds.length > 0) {
            await this.repository.bulkSoftDelete(existingIds);
        }
        return true;
    }
    async getBatchByIds(ids) {
        const found = await this.repository.findByIds(ids);
        const foundIds = new Set(found.map((a) => a.id));
        const notFound = ids.filter((id) => !foundIds.has(id));
        return { found, notFound };
    }
    async getFileByUrl(url) {
        const attachment = await this.repository.findByUrl(url);
        if (!attachment)
            throw new errors_1.NotFoundError('File not found');
        return attachment;
    }
}
exports.AttachmentService = AttachmentService;
exports.attachmentService = new AttachmentService(repository_1.attachmentRepository);
