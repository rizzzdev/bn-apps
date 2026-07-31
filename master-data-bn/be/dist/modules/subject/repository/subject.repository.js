"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectRepository = exports.SubjectRepository = void 0;
const database_1 = require("../../../database");
class SubjectRepository {
    async findAll(skip, take) {
        return database_1.prisma.subject.findMany({ where: { deletedAt: null }, skip, take });
    }
    async count() {
        return database_1.prisma.subject.count({ where: { deletedAt: null } });
    }
    async findById(id) {
        return database_1.prisma.subject.findFirst({ where: { id, deletedAt: null } });
    }
    async findByIds(ids) {
        return database_1.prisma.subject.findMany({
            where: { id: { in: ids }, deletedAt: null },
        });
    }
    async checkUnique(field, value, excludeId) {
        const where = { [field]: value, deletedAt: null };
        if (excludeId)
            where.id = { not: excludeId };
        return database_1.prisma.subject.findFirst({ where });
    }
    async create(data) {
        return database_1.prisma.subject.create({ data });
    }
    async update(id, data) {
        return database_1.prisma.subject.update({ where: { id }, data });
    }
    async softDelete(id) {
        return database_1.prisma.subject.update({ where: { id }, data: { deletedAt: new Date() } });
    }
}
exports.SubjectRepository = SubjectRepository;
exports.subjectRepository = new SubjectRepository();
