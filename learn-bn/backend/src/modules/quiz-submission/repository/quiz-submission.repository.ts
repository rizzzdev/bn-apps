import { prisma } from '@/database';
import { FinishQuizDto } from '../domain/schemas';

export class QuizSubmissionRepository {
  async startQuiz(quizId: string, studentId: string) {
    return prisma.quizSubmission.upsert({
      where: {
        quizId_studentId: {
          quizId,
          studentId,
        },
      },
      update: {}, // if already started, do nothing or update startedAt if allowed
      create: {
        quizId,
        studentId,
        startedAt: new Date(),
      },
    });
  }

  async findActiveSubmission(quizId: string, studentId: string) {
    return prisma.quizSubmission.findUnique({
      where: {
        quizId_studentId: {
          quizId,
          studentId,
        },
      },
      include: {
        answers: true,
      },
    });
  }

  async finishQuiz(submissionId: string, data: FinishQuizDto, score: number) {
    return prisma.quizSubmission.update({
      where: { id: submissionId },
      data: {
        finishedAt: new Date(),
        score,
        answers: {
          deleteMany: {}, // Clear old answers if re-submitting (or depending on logic)
          create: data.answers.map((a) => ({
            quizQuestionId: a.quizQuestionId,
            selectedOption: a.selectedOption,
          })),
        },
      },
      include: {
        answers: true,
      },
    });
  }

  async findAllByQuiz(quizId: string) {
    return prisma.quizSubmission.findMany({
      where: { quizId, finishedAt: { not: null } },
      include: {
        student: {
          select: { id: true, fullname: true, nis: true },
        },
      },
      orderBy: { finishedAt: 'desc' },
    });
  }
}

export const quizSubmissionRepository = new QuizSubmissionRepository();
