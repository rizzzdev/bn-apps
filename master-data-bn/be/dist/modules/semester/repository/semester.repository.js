"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.semesterRepository = exports.SemesterRepository = void 0;
const database_1 = require("../../../database");
class SemesterRepository {
    async findAll(skip, take, includeAcademicYear = false) {
        return database_1.prisma.semester.findMany({
            where: { deletedAt: null },
            skip,
            take,
            include: includeAcademicYear ? { academicYear: true } : undefined
        });
    }
    async count() {
        return database_1.prisma.semester.count({ where: { deletedAt: null } });
    }
    async findById(id, includeAcademicYear = false) {
        return database_1.prisma.semester.findFirst({
            where: { id, deletedAt: null },
            include: includeAcademicYear ? { academicYear: true } : undefined
        });
    }
    async findByIds(ids) {
        return database_1.prisma.semester.findMany({
            where: { id: { in: ids }, deletedAt: null },
        });
    }
    async checkUniqueType(type, academicYearId, excludeId) {
        const where = { type, academicYearId, deletedAt: null };
        if (excludeId)
            where.id = { not: excludeId };
        return database_1.prisma.semester.findFirst({ where });
    }
    async checkActiveStatus(excludeId) {
        const where = { status: 'Aktif', deletedAt: null };
        if (excludeId)
            where.id = { not: excludeId };
        return database_1.prisma.semester.findFirst({ where });
    }
    async create(data) {
        return database_1.prisma.semester.create({
            data: data,
            include: { academicYear: true }
        });
    }
    async update(id, data) {
        return database_1.prisma.semester.update({
            where: { id },
            data: data,
            include: { academicYear: true }
        });
    }
    async softDelete(id) {
        return database_1.prisma.semester.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: { academicYear: true }
        });
    }
}
exports.SemesterRepository = SemesterRepository;
exports.semesterRepository = new SemesterRepository();
