import { prisma } from '../../../database';
export class DashboardRepository {
    async findTeacherPendingGrading(teacherId) {
        const assignments = await prisma.assignment.findMany({
            where: {
                teacherId,
                status: 'Published',
                deletedAt: null,
            },
            include: {
                classes: {
                    include: {
                        class: { select: { id: true, name: true } },
                    },
                },
                _count: {
                    select: {
                        submissions: {
                            where: { grade: null },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return assignments
            .filter((a) => a._count?.submissions > 0)
            .map((a) => ({
            id: a.id,
            title: a.title,
            className: a.classes?.map((c) => c.class?.name).filter(Boolean).join(', ') || 'Kelas',
            ungradedCount: a._count?.submissions ?? 0,
        }));
    }
    async findStudentPendingMaterials(studentId, classIds) {
        return prisma.material.findMany({
            where: {
                classes: { some: { classId: { in: classIds } } },
                status: 'Published',
                deletedAt: null,
                reads: { none: { studentId } },
            },
            include: {
                classes: {
                    include: {
                        class: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
    }
    async findStudentPendingAssignments(studentId, classIds) {
        return prisma.assignment.findMany({
            where: {
                classes: { some: { classId: { in: classIds } } },
                status: 'Published',
                deadline: { gte: new Date() },
                deletedAt: null,
                submissions: { none: { studentId } },
            },
            include: {
                classes: {
                    include: {
                        class: { select: { id: true, name: true } },
                    },
                },
                teacher: { select: { id: true, fullname: true } },
            },
            orderBy: { deadline: 'asc' },
            take: 10,
        });
    }
    async findStudentPendingQuizzes(studentId, classIds) {
        return prisma.quiz.findMany({
            where: {
                classes: { some: { classId: { in: classIds } } },
                status: 'Published',
                deletedAt: null,
                submissions: { none: { studentId } },
            },
            include: {
                classes: {
                    include: {
                        class: { select: { id: true, name: true } },
                    },
                },
                teacher: { select: { id: true, fullname: true } },
                _count: { select: { questions: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
    }
    async countTotalUnreadMaterials(studentId, classIds) {
        return prisma.material.count({
            where: {
                classes: { some: { classId: { in: classIds } } },
                status: 'Published',
                deletedAt: null,
                reads: { none: { studentId } },
            },
        });
    }
    async countTotalPendingAssignments(studentId, classIds) {
        return prisma.assignment.count({
            where: {
                classes: { some: { classId: { in: classIds } } },
                status: 'Published',
                deadline: { gte: new Date() },
                deletedAt: null,
                submissions: { none: { studentId } },
            },
        });
    }
    async countTotalPendingQuizzes(studentId, classIds) {
        return prisma.quiz.count({
            where: {
                classes: { some: { classId: { in: classIds } } },
                status: 'Published',
                deletedAt: null,
                submissions: { none: { studentId } },
            },
        });
    }
    // ─── Student Stat Counts ───────────────────────────
    async countStudentAssignmentsSubmitted(studentId, classIds) {
        return prisma.assignmentSubmission.count({
            where: {
                studentId,
                assignment: {
                    classes: { some: { classId: { in: classIds } } },
                    status: 'Published',
                    deletedAt: null,
                },
            },
        });
    }
    async countStudentTotalAssignments(studentId, classIds) {
        return prisma.assignment.count({
            where: {
                classes: { some: { classId: { in: classIds } } },
                status: 'Published',
                deletedAt: null,
            },
        });
    }
    async countStudentMaterialsRead(studentId, classIds) {
        return prisma.materialRead.count({
            where: {
                studentId,
                material: {
                    classes: { some: { classId: { in: classIds } } },
                    status: 'Published',
                    deletedAt: null,
                },
            },
        });
    }
    async countStudentTotalMaterials(studentId, classIds) {
        return prisma.material.count({
            where: {
                classes: { some: { classId: { in: classIds } } },
                status: 'Published',
                deletedAt: null,
            },
        });
    }
    async countStudentQuizzesDone(studentId, classIds) {
        return prisma.quizSubmission.count({
            where: {
                studentId,
                finishedAt: { not: null },
                quiz: {
                    classes: { some: { classId: { in: classIds } } },
                    status: 'Published',
                    deletedAt: null,
                },
            },
        });
    }
    async countStudentTotalQuizzes(studentId, classIds) {
        return prisma.quiz.count({
            where: {
                classes: { some: { classId: { in: classIds } } },
                status: 'Published',
                deletedAt: null,
            },
        });
    }
    // ─── Teacher Stat Counts ───────────────────────────
    async countTeacherGradedSubmissions(teacherId) {
        return prisma.assignmentSubmission.count({
            where: {
                grade: { not: null },
                assignment: {
                    teacherId,
                    status: 'Published',
                    deletedAt: null,
                },
            },
        });
    }
    async countTeacherTotalSubmissions(teacherId) {
        return prisma.assignmentSubmission.count({
            where: {
                assignment: {
                    teacherId,
                    status: 'Published',
                    deletedAt: null,
                },
            },
        });
    }
    async findStudentClassIds(studentId) {
        const classStudents = await prisma.classStudent.findMany({
            where: { studentId, status: 'Aktif', deletedAt: null },
            select: { classId: true },
        });
        return classStudents.map((cs) => cs.classId);
    }
}
export const dashboardRepository = new DashboardRepository();
