"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentRepository = exports.AttachmentRepository = void 0;
const database_1 = require("../../../database");
class AttachmentRepository {
    async create(data) {
        return database_1.prisma.attachment.create({ data });
    }
    async findByUrl(url) {
        return database_1.prisma.attachment.findFirst({ where: { url, deletedAt: null } });
    }
    async findById(id) {
        return database_1.prisma.attachment.findFirst({ where: { id, deletedAt: null } });
    }
    async softDelete(id) {
        return database_1.prisma.attachment.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async findByIds(ids) {
        return database_1.prisma.attachment.findMany({
            where: { id: { in: ids }, deletedAt: null },
        });
    }
    async bulkSoftDelete(ids) {
        return database_1.prisma.attachment.updateMany({
            where: { id: { in: ids }, deletedAt: null },
            data: { deletedAt: new Date() },
        });
    }
}
exports.AttachmentRepository = AttachmentRepository;
exports.attachmentRepository = new AttachmentRepository();
