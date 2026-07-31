"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.majorRepository = exports.MajorRepository = void 0;
const database_1 = require("../../../database");
class MajorRepository {
    async findAll(skip, take, includeClasses = false, includeCurrentStudent = false) {
        const include = {
            ...(includeClasses ? { classes: { where: { deletedAt: null } } } : {}),
            ...(includeCurrentStudent ? { _count: { select: { currentStudents: true } } } : {})
        };
        return database_1.prisma.major.findMany({
            where: { deletedAt: null },
            skip,
            take,
            include: Object.keys(include).length > 0 ? include : undefined
        });
    }
    async count() {
        return database_1.prisma.major.count({ where: { deletedAt: null } });
    }
    async findById(id, includeClasses = false, includeCurrentStudent = false) {
        const include = {
            ...(includeClasses ? { classes: { where: { deletedAt: null } } } : {}),
            ...(includeCurrentStudent ? { _count: { select: { currentStudents: true } } } : {})
        };
        return database_1.prisma.major.findFirst({
            where: { id, deletedAt: null },
            include: Object.keys(include).length > 0 ? include : undefined
        });
    }
    async findByIds(ids) {
        return database_1.prisma.major.findMany({
            where: { id: { in: ids }, deletedAt: null },
        });
    }
    async checkUnique(field, value, excludeId) {
        const where = { [field]: value, deletedAt: null };
        if (excludeId)
            where.id = { not: excludeId };
        return database_1.prisma.major.findFirst({ where });
    }
    async create(data) {
        return database_1.prisma.major.create({ data, include: { classes: { where: { deletedAt: null } } } });
    }
    async update(id, data) {
        return database_1.prisma.major.update({ where: { id }, data, include: { classes: { where: { deletedAt: null } } } });
    }
    async softDelete(id) {
        return database_1.prisma.major.update({ where: { id }, data: { deletedAt: new Date() }, include: { classes: { where: { deletedAt: null } } } });
    }
}
exports.MajorRepository = MajorRepository;
exports.majorRepository = new MajorRepository();
