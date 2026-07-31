import { prisma } from '@/database';
import { CreateQuizDto, UpdateQuizDto } from '../domain/schemas';

export class QuizRepository {
  async create(data: CreateQuizDto, teacherId: string) {
    const targetClassIds = data.classIds && data.classIds.length > 0
      ? data.classIds
      : data.classId
        ? [data.classId]
        : [];

    return prisma.quiz.create({
      data: {
        title: data.title,
        timeLimit: data.timeLimit,
        status: data.status || 'Draft',
        teacherId,
        classes: {
          create: targetClassIds.map((cId) => ({ classId: cId })),
        },
        questions: {
          create: data.questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctOption: q.correctOption,
          })),
        },
      },
      include: {
        classes: { include: { class: true } },
        questions: true,
      },
    });
  }

  async bulkCreate(data: CreateQuizDto, teacherId: string) {
    return this.create(data, teacherId);
  }

  async findAllByClass(classId: string, role?: string) {
    const quizzes = await prisma.quiz.findMany({
      where: {
        classes: {
          some: { classId },
        },
        deletedAt: null,
        ...(role === 'MURID' ? { status: 'Published' } : {}),
      },
      include: {
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                _count: { select: { classStudents: { where: { status: 'Aktif', deletedAt: null } } } },
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            fullname: true,
            prefixTitle: true,
            suffixTitle: true,
            pictureUrl: true,
            subjectTeachers: {
              include: {
                subject: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
            submissions: { where: { finishedAt: { not: null } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q: any) => {
      const completedCount = q._count?.submissions ?? 0;
      const totalStudents = q.classes?.reduce((sum: number, c: any) => sum + (c.class?._count?.classStudents ?? 0), 0) ?? 0;
      return {
        ...q,
        quizStats: { completedCount, totalStudents },
      };
    });
  }

  async findById(id: string) {
    const quiz = await prisma.quiz.findFirst({
      where: { id, deletedAt: null },
      include: {
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                _count: { select: { classStudents: { where: { status: 'Aktif', deletedAt: null } } } },
              },
            },
          },
        },
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            correctOption: true,
          },
        },
        teacher: {
          select: { id: true, fullname: true, pictureUrl: true },
        },
        _count: {
          select: {
            questions: true,
            submissions: { where: { finishedAt: { not: null } } },
          },
        },
      },
    });

    if (!quiz) return null;

    const q = quiz as any;
    const completedCount = q._count?.submissions ?? 0;
    const totalStudents = q.classes?.reduce((sum: number, c: any) => sum + (c.class?._count?.classStudents ?? 0), 0) ?? 0;

    return {
      ...quiz,
      quizStats: { completedCount, totalStudents },
    };
  }

  async update(id: string, data: UpdateQuizDto) {
    const targetClassIds = data.classIds && data.classIds.length > 0
      ? data.classIds
      : data.classId
        ? [data.classId]
        : undefined;

    return prisma.quiz.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.timeLimit !== undefined && { timeLimit: data.timeLimit }),
        ...(data.status && { status: data.status }),
        ...(targetClassIds && {
          classes: {
            deleteMany: {},
            create: targetClassIds.map((cId) => ({ classId: cId })),
          },
        }),
        ...(data.questions && {
          questions: {
            deleteMany: {},
            create: data.questions.map((q) => ({
              question: q.question,
              options: q.options,
              correctOption: q.correctOption,
            })),
          },
        }),
      },
      include: {
        classes: { include: { class: true } },
        questions: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.quiz.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkDelete(ids: string[]) {
    return prisma.quiz.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }
}

export const quizRepository = new QuizRepository();
