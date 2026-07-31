import { prisma } from '@/database';
import { FinishQuizDto } from '../domain/schemas';
import { getOrchestrator, fetchStudentNames } from '../../common/hydrate';

export class QuizSubmissionRepository {
  async startQuiz(quizId: string, studentId: string) {
    return prisma.quizSubmission.upsert({
      where: { quizId_studentId: { quizId, studentId } },
      update: {},
      create: { quizId, studentId, startedAt: new Date() },
    });
  }

  async findActiveSubmission(quizId: string, studentId: string) {
    return prisma.quizSubmission.findUnique({
      where: { quizId_studentId: { quizId, studentId } },
      include: { answers: true },
    });
  }

  async finishQuiz(submissionId: string, data: FinishQuizDto, score: number) {
    return prisma.quizSubmission.update({
      where: { id: submissionId },
      data: {
        finishedAt: new Date(), score,
        answers: { deleteMany: {}, create: data.answers.map((a) => ({ quizQuestionId: a.quizQuestionId, selectedOption: a.selectedOption })) },
      },
      include: { answers: true },
    });
  }

  async findAllByQuiz(quizId: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { classes: { select: { classId: true } } },
    });

    const submissions = await prisma.quizSubmission.findMany({
      where: { quizId },
    });

    if (!quiz || quiz.classes.length === 0) {
      const studentIds = [...new Set(submissions.map((s) => s.studentId))];
      const studentMap = await fetchStudentNames(studentIds);
      return submissions.map((s) => ({
        student: studentMap.get(s.studentId) ?? { id: s.studentId, fullname: '', nis: '', pictureUrl: null },
        submission: { id: s.id, startedAt: s.startedAt, finishedAt: s.finishedAt, score: s.score },
      }));
    }

    const classIds = quiz.classes.map((c) => c.classId);
    const [csRecords, classMap] = await Promise.all([
      getOrchestrator().academicClassStudent.findMany({
        classId: { in: classIds },
        status: 'Aktif',
        deletedAt: null,
      }),
      getOrchestrator().masterClass.findByIds(classIds).then((cs) => new Map(cs.map((c) => [c.id, c]))),
    ]);

    const studentIds = [...new Set([...submissions.map((s) => s.studentId), ...csRecords.map((cs) => cs.studentId)])];
    const studentMap = await fetchStudentNames(studentIds);
    const submissionMap = new Map(submissions.map((s) => [s.studentId, s]));

    return csRecords.map((cs) => {
      const sub = submissionMap.get(cs.studentId);
      return {
        student: studentMap.get(cs.studentId) ?? { id: cs.studentId, fullname: '', nis: '', pictureUrl: null },
        class: classMap.get(cs.classId) ?? { id: cs.classId, name: '' },
        submission: sub ? { id: sub.id, startedAt: sub.startedAt, finishedAt: sub.finishedAt, score: sub.score } : null,
      };
    });
  }
}

export const quizSubmissionRepository = new QuizSubmissionRepository();
