import { prisma } from '@/database';

export class GradeRepository {
  async getStudentGradesByClass(classId: string, studentId: string) {
    const assignments = await prisma.assignmentSubmission.findMany({
      where: {
        studentId,
        assignment: { classId },
      },
      include: {
        assignment: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const quizzes = await prisma.quizSubmission.findMany({
      where: {
        studentId,
        quiz: { classId },
      },
      include: {
        quiz: { select: { title: true } },
      },
      orderBy: { finishedAt: 'desc' },
    });

    return { assignments, quizzes };
  }

  async getClassGrades(classId: string) {
    // For a teacher to see all grades in a class
    // 1. Get all students in the class
    const classStudents = await prisma.classStudent.findMany({
      where: { classId, status: 'Aktif' },
      include: {
        student: { select: { id: true, fullname: true, nis: true } },
      },
    });

    // 2. Fetch assignments & quizzes of this class
    const assignments = await prisma.assignment.findMany({
      where: { classId },
      select: { id: true, title: true },
      orderBy: { createdAt: 'asc' },
    });

    const quizzes = await prisma.quiz.findMany({
      where: { classId },
      select: { id: true, title: true },
      orderBy: { createdAt: 'asc' },
    });

    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
      where: { assignment: { classId } },
      select: { studentId: true, assignmentId: true, grade: true },
    });

    const quizSubmissions = await prisma.quizSubmission.findMany({
      where: { quiz: { classId }, finishedAt: { not: null } },
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
