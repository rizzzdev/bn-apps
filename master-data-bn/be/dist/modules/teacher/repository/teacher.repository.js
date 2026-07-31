"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherRepository = exports.TeacherRepository = void 0;
const database_1 = require("../../../database");
const client_1 = require("@/database/generated/client");
class TeacherRepository {
    async findAll(skip, take, userId, includeUser = false, includePicture = false) {
        const where = { deletedAt: null };
        if (userId)
            where.userId = userId;
        const teachers = await database_1.prisma.teacher.findMany({
            where,
            ...(includePicture ? { include: { picture: true } } : {}),
            ...(take === "all" ? {} : { skip, take }),
        });
        if (!includeUser) {
            return teachers;
        }
        const users = await database_1.prisma.sentri_users.findMany({
            where: { id: { in: teachers.map((t) => t.userId) } },
            omit: { password_hash: true },
            include: {
                sentri_identifiers: {
                    where: {
                        type: "email",
                    },
                },
            },
        });
        return teachers.map((teacher) => ({
            ...teacher,
            user: users?.find((u) => u.id === teacher.userId),
        }));
    }
    async count(userId) {
        const where = { deletedAt: null };
        if (userId)
            where.userId = userId;
        return database_1.prisma.teacher.count({ where });
    }
    async getStatistics() {
        const [total, active, inactive, retired] = await Promise.all([
            database_1.prisma.teacher.count({ where: { deletedAt: null } }),
            database_1.prisma.teacher.count({ where: { status: client_1.TeacherStatus.Aktif, deletedAt: null } }),
            database_1.prisma.teacher.count({ where: { status: client_1.TeacherStatus.Tidak_Aktif, deletedAt: null } }),
            database_1.prisma.teacher.count({ where: { status: client_1.TeacherStatus.Pensiun, deletedAt: null } }),
        ]);
        return { total, active, inactive, retired };
    }
    async findById(id, includePicture = false) {
        return database_1.prisma.teacher.findFirst({
            where: { id, deletedAt: null },
            ...(includePicture ? { include: { picture: true } } : {}),
        });
    }
    async findByIds(ids) {
        return database_1.prisma.teacher.findMany({
            where: { id: { in: ids }, deletedAt: null },
        });
    }
    async checkUnique(field, value, excludeId) {
        const where = { [field]: value, deletedAt: null };
        if (excludeId)
            where.id = { not: excludeId };
        return database_1.prisma.teacher.findFirst({ where });
    }
    async create(data, userId) {
        const { password, pictureId, ...teacherData } = data;
        const created = await database_1.prisma.teacher.create({
            data: {
                ...teacherData,
                userId,
                ...(pictureId ? { picture: { connect: { id: pictureId } } } : {}),
            },
            include: { picture: true },
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
        const { password, pictureId, ...teacherData } = data;
        const updated = await database_1.prisma.teacher.update({
            where: { id },
            data: {
                ...teacherData,
                ...(pictureId !== undefined
                    ? { picture: pictureId ? { connect: { id: pictureId } } : { disconnect: true } }
                    : {}),
            },
            include: { picture: true },
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
        const deleted = await database_1.prisma.teacher.update({
            where: { id },
            data: { deletedAt: new Date() },
            include: { picture: true },
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
    async bulkSoftDelete(ids) {
        return database_1.prisma.teacher.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { deletedAt: new Date() } });
    }
    async bulkUpdateStatus(ids, status) {
        return database_1.prisma.teacher.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { status } });
    }
}
exports.TeacherRepository = TeacherRepository;
exports.teacherRepository = new TeacherRepository();
