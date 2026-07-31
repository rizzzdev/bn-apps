import { prisma } from '../../../database';
export class ClassRepository {
    async findAll(skip, take) {
        return prisma.class.findMany({ skip, take });
    }
    async findById(id) {
        return prisma.class.findUnique({ where: { id } });
    }
    async findClassesByTeacher(teacherId) {
        const scheduleClasses = await prisma.lessonScheduleClass.findMany({
            where: {
                lessonSchedule: {
                    teachers: { some: { teacherId } },
                    deletedAt: null,
                },
            },
            include: {
                class: {
                    include: {
                        major: { select: { id: true, name: true } },
                        _count: { select: { classStudents: { where: { status: 'Aktif' } } } },
                    },
                },
                lessonSchedule: {
                    include: {
                        subject: { select: { id: true, name: true, code: true } },
                    },
                },
            },
        });
        // Deduplicate classes
        const seen = new Set();
        const classes = [];
        for (const sc of scheduleClasses) {
            if (!seen.has(sc.class.id)) {
                seen.add(sc.class.id);
                classes.push({
                    ...sc.class,
                    subjectName: sc.lessonSchedule.subject.name,
                    studentCount: sc.class._count.classStudents,
                });
            }
        }
        return classes;
    }
    async findClassesByStudent(studentId) {
        const classStudents = await prisma.classStudent.findMany({
            where: {
                studentId,
                status: 'Aktif',
                deletedAt: null,
            },
            include: {
                class: {
                    include: {
                        major: { select: { id: true, name: true } },
                        _count: { select: { classStudents: { where: { status: 'Aktif' } } } },
                    },
                },
            },
        });
        return classStudents.map((cs) => ({
            ...cs.class,
            studentCount: cs.class._count.classStudents,
        }));
    }
    async findStudentsByClass(classId) {
        return prisma.classStudent.findMany({
            where: { classId, status: 'Aktif' },
            include: {
                student: {
                    select: { id: true, fullname: true, nis: true, nisn: true, pictureUrl: true },
                },
            },
            orderBy: { student: { fullname: 'asc' } },
        });
    }
    async upsert(id, data) {
        // using any for data to bypass strict typing during initial setup
        return prisma.class.upsert({
            where: { id },
            update: data,
            create: { id, ...data },
        });
    }
}
export const classRepository = new ClassRepository();
