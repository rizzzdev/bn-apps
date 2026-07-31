"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentRepository = exports.StudentRepository = void 0;
const database_1 = require("../../../database");
class StudentRepository {
    async findAll(skip, take, userId, includeCurrentClass = false, includeUser = false, includePicture = false) {
        const where = { deletedAt: null };
        if (userId)
            where.userId = userId;
        const include = {
            ...(includeCurrentClass ? { currentClass: true, currentMajor: true } : {}),
            ...(includePicture ? { picture: true } : {}),
        };
        const students = await database_1.prisma.student.findMany({
            where,
            include: Object.keys(include).length > 0 ? include : undefined,
            ...(take === "all" ? {} : { skip, take }),
        });
        if (!includeUser) {
            return students;
        }
        const users = await database_1.prisma.sentri_users.findMany({
            where: { id: { in: students.map((s) => s.userId) } },
            omit: { password_hash: true },
            include: {
                sentri_identifiers: {
                    where: {
                        type: "email",
                    },
                },
            },
        });
        return students.map((student) => ({
            ...student,
            user: users?.find((u) => u.id === student.userId),
        }));
    }
    async count(userId) {
        const where = { deletedAt: null };
        if (userId)
            where.userId = userId;
        return database_1.prisma.student.count({ where });
    }
    async getStatistic() {
        const stats = await database_1.prisma.student.groupBy({
            by: ["status"],
            _count: {
                _all: true,
            },
            where: {
                deletedAt: null,
            },
        });
        return { stats };
    }
    async findById(id, includeCurrentClass = false, includePicture = false) {
        const include = {
            ...(includeCurrentClass ? { currentClass: true, currentMajor: true } : {}),
            ...(includePicture ? { picture: true } : {}),
        };
        return database_1.prisma.student.findFirst({
            where: { id, deletedAt: null },
            include: Object.keys(include).length > 0 ? include : undefined,
        });
    }
    async findByIds(ids) {
        return database_1.prisma.student.findMany({
            where: { id: { in: ids }, deletedAt: null },
        });
    }
    async checkUnique(field, value, excludeId) {
        const where = { [field]: value, deletedAt: null };
        if (excludeId)
            where.id = { not: excludeId };
        return database_1.prisma.student.findFirst({ where });
    }
    async create(data, userId) {
        const { password, pictureId, ...restData } = data;
        const created = await database_1.prisma.student.create({
            data: {
                ...restData,
                userId,
                ...(pictureId ? { picture: { connect: { id: pictureId } } } : {}),
            },
            include: { currentClass: true, currentMajor: true, picture: true },
        });
        const user = await database_1.prisma.sentri_users.findFirst({
            where: { id: created.userId },
            omit: { password_hash: true },
            include: {
                sentri_identifiers: {
                    where: {
                        type: "email",
                    },
                },
            },
        });
        return { ...created, user };
    }
    async update(id, data) {
        const { pictureId, ...restData } = data;
        const updated = await database_1.prisma.student.update({
            where: { id },
            data: {
                ...restData,
                ...(pictureId !== undefined
                    ? { picture: pictureId ? { connect: { id: pictureId } } : { disconnect: true } }
                    : {}),
            },
            include: { currentClass: true, currentMajor: true, picture: true },
        });
        const user = await database_1.prisma.sentri_users.findFirst({
            where: { id: updated.userId },
            omit: { password_hash: true },
            include: {
                sentri_identifiers: {
                    where: {
                        type: "email",
                    },
                },
            },
        });
        return { ...updated, user };
    }
    async softDelete(id) {
        const deleted = await database_1.prisma.student.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: { currentClass: true, currentMajor: true, picture: true },
        });
        const user = await database_1.prisma.sentri_users.findFirst({
            where: { id: deleted.userId },
            omit: { password_hash: true },
            include: {
                sentri_identifiers: {
                    where: {
                        type: "email",
                    },
                },
            },
        });
        return { ...deleted, user };
    }
    async bulkUpdateStatus(ids, status) {
        return database_1.prisma.student.updateMany({
            where: { id: { in: ids }, deletedAt: null },
            data: { status },
        });
    }
}
exports.StudentRepository = StudentRepository;
exports.studentRepository = new StudentRepository();
