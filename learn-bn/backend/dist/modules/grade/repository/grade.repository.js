import { prisma } from '../../../database';
export class GradeRepository {
    async getStudentGradesByClass(classId, studentId) {
        const assignments = await prisma.assignmentSubmission.findMany({
            where: {
                studentId,
                assignment: { classes: { some: { classId } } },
            },
            include: {
                assignment: { select: { title: true, deadline: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const quizzes = await prisma.quizSubmission.findMany({
            where: {
                studentId,
                quiz: { classes: { some: { classId } } },
            },
            include: {
                quiz: { select: { title: true } },
            },
            orderBy: { finishedAt: 'desc' },
        });
        return { assignments, quizzes };
    }
    async getClassGrades(classId) {
        const classStudents = await prisma.classStudent.findMany({
            where: { classId, status: 'Aktif' },
            include: {
                student: { select: { id: true, fullname: true, nis: true } },
            },
        });
        const assignments = await prisma.assignment.findMany({
            where: { classes: { some: { classId } } },
            select: { id: true, title: true },
            orderBy: { createdAt: 'asc' },
        });
        const quizzes = await prisma.quiz.findMany({
            where: { classes: { some: { classId } } },
            select: { id: true, title: true },
            orderBy: { createdAt: 'asc' },
        });
        const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
            where: { assignment: { classes: { some: { classId } } } },
            select: { studentId: true, assignmentId: true, grade: true },
        });
        const quizSubmissions = await prisma.quizSubmission.findMany({
            where: { quiz: { classes: { some: { classId } } }, finishedAt: { not: null } },
            select: { studentId: true, quizId: true, score: true },
        });
        return {
            classStudents,
            assignments,
            quizzes,
            assignmentSubmissions,
            quizSubmissions,
        };
    }
}
export const gradeRepository = new GradeRepository();
