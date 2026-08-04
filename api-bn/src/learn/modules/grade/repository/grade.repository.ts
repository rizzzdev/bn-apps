import { prisma } from '#learn/database/index.js';
import { shadowSyncService } from '../../../services/shadow-sync.service.js';
import { fetchStudentNames } from '../../common/hydrate.js';

export class GradeRepository {
  async getStudentGradesByClass(classId: string, studentId: string) {
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

  async getClassGrades(classId: string) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    const [csRecords, assignments, quizzes, assignmentSubmissions, quizSubmissions] = await Promise.all([
      prisma.shadowClassStudent.findMany({
        where: {
          classId: { in: [classId] },
          status: 'Aktif',
          deletedAt: null,
        },
      }),
      prisma.assignment.findMany({
        where: { classes: { some: { classId } } },
        select: { id: true, title: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.quiz.findMany({
        where: { classes: { some: { classId } } },
        select: { id: true, title: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.assignmentSubmission.findMany({
        where: { assignment: { classes: { some: { classId } } } },
        select: { studentId: true, assignmentId: true, grade: true },
      }),
      prisma.quizSubmission.findMany({
        where: { quiz: { classes: { some: { classId } } }, finishedAt: { not: null } },
        select: { studentId: true, quizId: true, score: true },
      }),
    ]);

    const studentIds = csRecords.map((cs) => cs.studentId);
    const studentMap = await fetchStudentNames(studentIds);

    const classStudents = csRecords.map((cs) => {
      const s = studentMap.get(cs.studentId);
      return { id: cs.id, studentId: cs.studentId, status: cs.status, student: s ?? { id: cs.studentId, fullname: '', nis: null, nisn: null, pictureUrl: null } };
    });

    return { classStudents, assignments, quizzes, assignmentSubmissions, quizSubmissions };
  }
}

export const gradeRepository = new GradeRepository();
