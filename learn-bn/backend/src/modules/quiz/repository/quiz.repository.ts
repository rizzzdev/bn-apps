import { prisma } from '@/database';
import { CreateQuizDto, UpdateQuizDto } from '../domain/schemas';

export class QuizRepository {
  async create(data: CreateQuizDto, teacherId: string) {
    return prisma.quiz.create({
      data: {
        title: data.title,
        timeLimit: data.timeLimit,
        classId: data.classId,
        teacherId,
        questions: {
          create: data.questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctOption: q.correctOption,
          })),
        },
      },
      include: { questions: true },
    });
  }

  async findAllByClass(classId: string) {
    return prisma.quiz.findMany({
      where: { classId, deletedAt: null },
      include: {
        teacher: {
          select: { id: true, fullname: true, pictureUrl: true },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.quiz.findFirst({
      where: { id, deletedAt: null },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            // Exclude correctOption here for general fetch to prevent cheating if needed, 
            // but since teachers need to see it, we will include it and strip it in service layer if student
            correctOption: true,
          }
        },
        teacher: {
          select: { id: true, fullname: true, pictureUrl: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateQuizDto) {
    return prisma.quiz.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.timeLimit !== undefined && { timeLimit: data.timeLimit }),
        ...(data.classId && { classId: data.classId }),
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
      include: { questions: true },
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
