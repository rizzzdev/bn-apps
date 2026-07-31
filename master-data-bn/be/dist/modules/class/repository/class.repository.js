"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classRepository = exports.ClassRepository = void 0;
const database_1 = require("../../../database");
class ClassRepository {
    async findAll(skip, take, includeMajor = false, includeCurrentStudent = false) {
        const include = {
            ...(includeMajor ? { major: true } : {}),
            ...(includeCurrentStudent ? { _count: { select: { currentStudents: true } } } : {})
        };
        return database_1.prisma.class.findMany({ where: { deletedAt: null }, skip, take, include: Object.keys(include).length > 0 ? include : undefined });
    }
    async count() {
        return database_1.prisma.class.count({ where: { deletedAt: null } });
    }
    async findById(id, includeMajor = false, includeCurrentStudent = false) {
        const include = {
            ...(includeMajor ? { major: true } : {}),
            ...(includeCurrentStudent ? { _count: { select: { currentStudents: true } } } : {})
        };
        return database_1.prisma.class.findFirst({ where: { id, deletedAt: null }, include: Object.keys(include).length > 0 ? include : undefined });
    }
    async findByIds(ids) {
        return database_1.prisma.class.findMany({
            where: { id: { in: ids }, deletedAt: null },
        });
    }
    async checkUnique(field, value, excludeId) {
        const where = { [field]: value, deletedAt: null };
        if (excludeId)
            where.id = { not: excludeId };
        return database_1.prisma.class.findFirst({ where });
    }
    async create(data) {
        return database_1.prisma.class.create({ data, include: { major: true } });
    }
    async update(id, data) {
        return database_1.prisma.class.update({ where: { id }, data, include: { major: true } });
    }
    async softDelete(id) {
        return database_1.prisma.class.update({ where: { id }, data: { deletedAt: new Date() }, include: { major: true } });
    }
}
exports.ClassRepository = ClassRepository;
exports.classRepository = new ClassRepository();
