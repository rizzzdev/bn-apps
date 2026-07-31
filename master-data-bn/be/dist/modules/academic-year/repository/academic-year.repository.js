"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicyearRepository = exports.AcademicYearRepository = void 0;
const database_1 = require("../../../database");
class AcademicYearRepository {
    async findAll(skip, take, includeSemesters = false) {
        return database_1.prisma.academicYear.findMany({
            where: { deletedAt: null },
            skip,
            take,
            include: includeSemesters ? { semesters: { where: { deletedAt: null } } } : undefined
        });
    }
    async count() {
        return database_1.prisma.academicYear.count({ where: { deletedAt: null } });
    }
    async findById(id, includeSemesters = false) {
        return database_1.prisma.academicYear.findFirst({
            where: { id, deletedAt: null },
            include: includeSemesters ? { semesters: { where: { deletedAt: null } } } : undefined
        });
    }
    async findByIds(ids) {
        return database_1.prisma.academicYear.findMany({
            where: { id: { in: ids }, deletedAt: null },
        });
    }
    async checkUnique(field, value, excludeId) {
        const where = { [field]: value, deletedAt: null };
        if (excludeId)
            where.id = { not: excludeId };
        return database_1.prisma.academicYear.findFirst({ where });
    }
    async checkActiveStatus(excludeId) {
        const where = { status: 'Aktif', deletedAt: null };
        if (excludeId)
            where.id = { not: excludeId };
        return database_1.prisma.academicYear.findFirst({ where });
    }
    async create(data) {
        return database_1.prisma.academicYear.create({
            data: data,
            include: { semesters: { where: { deletedAt: null } } }
        });
    }
    async update(id, data) {
        return database_1.prisma.academicYear.update({
            where: { id },
            data: data,
            include: { semesters: { where: { deletedAt: null } } }
        });
    }
    async softDelete(id) {
        return database_1.prisma.academicYear.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: { semesters: { where: { deletedAt: null } } }
        });
    }
}
exports.AcademicYearRepository = AcademicYearRepository;
exports.academicyearRepository = new AcademicYearRepository();
