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
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { classes: { select: { classId: true } } },
    });

    const submissions = await prisma.quizSubmission.findMany({
      where: { quizId },
      include: {
        student: {
          select: { id: true, fullname: true, nis: true, pictureUrl: true },
        },
      },
    });

    if (!quiz || quiz.classes.length === 0) {
      return submissions.map((s) => ({
        student: s.student,
        submission: {
          id: s.id,
          startedAt: s.startedAt,
          finishedAt: s.finishedAt,
          score: s.score,
        },
      }));
    }

    const classIds = quiz.classes.map((c) => c.classId);

    const classStudents = await prisma.classStudent.findMany({
      where: { classId: { in: classIds }, status: 'Aktif' },
      include: {
        class: {
          select: { id: true, name: true },
        },
        student: {
          select: { id: true, fullname: true, nis: true, pictureUrl: true },
        },
      },
      orderBy: [{ class: { name: 'asc' } }, { student: { fullname: 'asc' } }],
    });

    const submissionMap = new Map(submissions.map((s) => [s.studentId, s]));

    return classStudents.map((cs) => {
      const sub = submissionMap.get(cs.student.id);
      return {
        student: cs.student,
        class: cs.class,
        submission: sub
          ? {
              id: sub.id,
              startedAt: sub.startedAt,
              finishedAt: sub.finishedAt,
              score: sub.score,
            }
          : null,
      };
    });
  }
}

export const quizSubmissionRepository = new QuizSubmissionRepository();
