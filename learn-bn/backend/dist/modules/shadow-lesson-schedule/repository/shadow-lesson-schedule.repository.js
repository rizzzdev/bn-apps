import { prisma } from '../../../database';
export class LessonScheduleRepository {
    async findAll(skip, take, teacherId) {
        const where = { deletedAt: null };
        if (teacherId) {
            where.teachers = { some: { teacherId } };
        }
        return prisma.lessonSchedule.findMany({
            skip,
            take,
            where,
            include: {
                subject: { select: { id: true, name: true, code: true } },
                lessonHour: { select: { id: true, name: true, startTime: true, endTime: true, order: true } },
                teachers: {
                    include: {
                        teacher: { select: { id: true, fullname: true, prefixTitle: true, suffixTitle: true } },
                    },
                },
                classes: {
                    include: {
                        class: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: [
                { day: 'asc' },
                { lessonHour: { order: 'asc' } },
            ],
        });
    }
    async findByClassIds(classIds) {
        return prisma.lessonSchedule.findMany({
            where: {
                deletedAt: null,
                classes: {
                    some: {
                        classId: { in: classIds },
                    },
                },
            },
            include: {
                subject: { select: { id: true, name: true, code: true } },
                lessonHour: { select: { id: true, name: true, startTime: true, endTime: true, order: true } },
                teachers: {
                    include: {
                        teacher: { select: { id: true, fullname: true, prefixTitle: true, suffixTitle: true } },
                    },
                },
                classes: {
                    include: {
                        class: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: [
                { day: 'asc' },
                { lessonHour: { order: 'asc' } },
            ],
        });
    }
    async findById(id) {
        return prisma.lessonSchedule.findUnique({
            where: { id },
            include: {
                subject: { select: { id: true, name: true, code: true } },
                lessonHour: { select: { id: true, name: true, startTime: true, endTime: true, order: true } },
                teachers: {
                    include: {
                        teacher: { select: { id: true, fullname: true, prefixTitle: true, suffixTitle: true } },
                    },
                },
                classes: {
                    include: {
                        class: { select: { id: true, name: true } },
                    },
                },
            },
        });
    }
    async upsert(id, data) {
        return prisma.lessonSchedule.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
    async upsertLessonHour(id, data) {
        return prisma.lessonHour.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
    async deleteTeachersBySchedule(scheduleId) {
        return prisma.lessonScheduleTeacher.deleteMany({
            where: { lessonScheduleId: scheduleId },
        });
    }
    async createTeacher(data) {
        return prisma.lessonScheduleTeacher.create({ data });
    }
    async deleteClassesBySchedule(scheduleId) {
        return prisma.lessonScheduleClass.deleteMany({
            where: { lessonScheduleId: scheduleId },
        });
    }
    async createClass(data) {
        return prisma.lessonScheduleClass.create({ data });
    }
}
export const lessonScheduleRepository = new LessonScheduleRepository();
