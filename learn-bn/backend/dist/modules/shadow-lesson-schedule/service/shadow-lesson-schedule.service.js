import { prisma } from '../../../database';
import { lessonScheduleRepository } from '../repository';
import { NotFoundError } from '../../../errors';
export class LessonScheduleService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getAll(page, limit, teacherId) {
        const skip = (page - 1) * limit;
        const data = await this.repository.findAll(skip, limit, teacherId);
        return { data, total: data.length };
    }
    async getByStudent(studentId) {
        const classStudents = await prisma.classStudent.findMany({
            where: { studentId, deletedAt: null },
            select: { classId: true },
        });
        const classIds = classStudents.map(cs => cs.classId);
        if (classIds.length === 0)
            return [];
        return this.repository.findByClassIds(classIds);
    }
    async getById(id) {
        const data = await this.repository.findById(id);
        if (!data)
            throw new NotFoundError('Data tidak ditemukan');
        return data;
    }
    async upsertFromWebhook(items) {
        let count = 0;
        const existingTeachers = await prisma.teacher.findMany({ select: { id: true } });
        const teacherSet = new Set(existingTeachers.map((t) => t.id));
        const existingClasses = await prisma.class.findMany({ select: { id: true } });
        const classSet = new Set(existingClasses.map((c) => c.id));
        const existingSubjects = await prisma.subject.findMany({ select: { id: true } });
        const subjectSet = new Set(existingSubjects.map((s) => s.id));
        for (const item of items) {
            const { id, lessonHour, teachers, classes, ...rest } = item;
            if (rest.subjectId && !subjectSet.has(rest.subjectId)) {
                console.warn(`Skipping schedule ${id} because subject ${rest.subjectId} does not exist in shadow_subjects`);
                continue;
            }
            if (lessonHour && lessonHour.id) {
                const lessonHourPayload = { ...lessonHour };
                if (lessonHourPayload.createdAt)
                    lessonHourPayload.createdAt = new Date(lessonHourPayload.createdAt);
                if (lessonHourPayload.updatedAt)
                    lessonHourPayload.updatedAt = new Date(lessonHourPayload.updatedAt);
                if (lessonHourPayload.deletedAt)
                    lessonHourPayload.deletedAt = new Date(lessonHourPayload.deletedAt);
                delete lessonHourPayload.lastSyncAt;
                await this.repository.upsertLessonHour(lessonHour.id, lessonHourPayload);
            }
            const payload = { ...rest };
            delete payload.subject;
            if (payload.createdAt)
                payload.createdAt = new Date(payload.createdAt);
            if (payload.updatedAt)
                payload.updatedAt = new Date(payload.updatedAt);
            if (payload.deletedAt)
                payload.deletedAt = new Date(payload.deletedAt);
            payload.lastSyncAt = new Date();
            await this.repository.upsert(id, payload);
            await this.repository.deleteTeachersBySchedule(id);
            if (teachers && Array.isArray(teachers)) {
                for (const t of teachers) {
                    if (!teacherSet.has(t.teacherId)) {
                        console.warn(`Skipping teacher ${t.teacherId} for schedule ${id} (not found in shadow_teachers)`);
                        continue;
                    }
                    const tp = {
                        id: t.id,
                        lessonScheduleId: id,
                        teacherId: t.teacherId,
                    };
                    if (t.createdAt)
                        tp.createdAt = new Date(t.createdAt);
                    if (t.deletedAt)
                        tp.deletedAt = t.deletedAt ? new Date(t.deletedAt) : null;
                    await this.repository.createTeacher(tp);
                }
            }
            await this.repository.deleteClassesBySchedule(id);
            if (classes && Array.isArray(classes)) {
                for (const c of classes) {
                    if (!classSet.has(c.classId)) {
                        console.warn(`Skipping class ${c.classId} for schedule ${id} (not found in shadow_classes)`);
                        continue;
                    }
                    const cp = {
                        id: c.id,
                        lessonScheduleId: id,
                        classId: c.classId,
                    };
                    if (c.createdAt)
                        cp.createdAt = new Date(c.createdAt);
                    if (c.deletedAt)
                        cp.deletedAt = c.deletedAt ? new Date(c.deletedAt) : null;
                    await this.repository.createClass(cp);
                }
            }
            count++;
        }
        return { upserted: count };
    }
}
export const lessonScheduleService = new LessonScheduleService(lessonScheduleRepository);
