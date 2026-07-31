import { prisma } from '@/database';
import { CreateQuizDto, UpdateQuizDto } from '../domain/schemas';
import { getOrchestrator, computeClassStudentCounts } from '../../common/hydrate';

export class QuizRepository {
  async create(data: CreateQuizDto, teacherId: string) {
    const targetClassIds = data.classIds && data.classIds.length > 0 ? data.classIds : data.classId ? [data.classId] : [];
    const quiz = await prisma.quiz.create({
      data: {
        title: data.title, timeLimit: data.timeLimit, status: data.status || 'Draft', teacherId,
        classes: { create: targetClassIds.map((cId) => ({ classId: cId })) },
        questions: { create: data.questions.map((q) => ({ question: q.question, options: JSON.stringify(q.options), correctOption: q.correctOption })) },
      },
      include: { classes: true, questions: true },
    });
    const hydrated = await this.hydrate([quiz]);
    return hydrated[0];
  }

  async bulkCreate(data: CreateQuizDto, teacherId: string) {
    return this.create(data, teacherId);
  }

  async findAllByClass(classId: string, role?: string) {
    const quizzes = await prisma.quiz.findMany({
      where: {
        classes: { some: { classId } }, deletedAt: null,
        ...(role === 'MURID' ? { status: 'Published' } : {}),
      },
      include: {
        classes: true,
        _count: { select: { questions: true, submissions: { where: { finishedAt: { not: null } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.hydrateAll(quizzes as any[]);
  }

  async findById(id: string) {
    const quiz = await prisma.quiz.findFirst({
      where: { id, deletedAt: null },
      include: {
        classes: true,
        questions: { select: { id: true, question: true, options: true, correctOption: true } },
        _count: { select: { questions: true, submissions: { where: { finishedAt: { not: null } } } } },
      },
    });
    if (!quiz) return null;
    const hydrated = await this.hydrateAll([quiz as any]);
    return hydrated[0] ?? null;
  }

  async update(id: string, data: UpdateQuizDto) {
    const targetClassIds = data.classIds && data.classIds.length > 0 ? data.classIds : data.classId ? [data.classId] : undefined;
    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.timeLimit !== undefined && { timeLimit: data.timeLimit }),
        ...(data.status && { status: data.status }),
        ...(targetClassIds && { classes: { deleteMany: {}, create: targetClassIds.map((cId) => ({ classId: cId })) } }),
        ...(data.questions && { questions: { deleteMany: {}, create: data.questions.map((q) => ({ question: q.question, options: JSON.stringify(q.options), correctOption: q.correctOption })) } }),
      },
      include: { classes: true, questions: true },
    });
    const hydrated = await this.hydrate([quiz]);
    return hydrated[0];
  }

  async delete(id: string) {
    return prisma.quiz.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async bulkDelete(ids: string[]) {
    return prisma.quiz.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  }

  private async fetchClassMap(classIds: string[]) {
    if (classIds.length === 0) return new Map<string, string>();
    return new Map((await getOrchestrator().masterClass.findByIds(classIds)).map((c) => [c.id, c.name]));
  }

  private async fetchTeacherMap(teacherIds: string[]) {
    if (teacherIds.length === 0) return new Map<string, any>();
    return new Map((await getOrchestrator().masterTeacher.findByIds(teacherIds)).map((t) => [t.id, t]));
  }

  private async hydrate(items: any[]) {
    const allClassIds = [...new Set(items.flatMap((q: any) => (q.classes || []).map((c: any) => c.classId)))];
    const allTeacherIds = [...new Set(items.map((q: any) => q.teacherId).filter(Boolean))];
    const [classMap, teacherMap] = await Promise.all([this.fetchClassMap(allClassIds), this.fetchTeacherMap(allTeacherIds)]);
    return items.map((q) => ({
      ...q,
      // Schema.prisma QuizQuestion.options adalah String (JSON-encoded).
      // Parse kembali ke array string[] untuk konsistensi dengan Zod schema dan client FE.
      questions: q.questions ? q.questions.map((qq: any) => ({ ...qq, options: typeof qq.options === 'string' ? JSON.parse(qq.options) : qq.options })) : q.questions,
      teacher: teacherMap.get(q.teacherId) ?? { id: q.teacherId, fullname: '' },
      classes: (q.classes || []).map((c: any) => ({
        ...c, class: classMap.has(c.classId) ? { id: c.classId, name: classMap.get(c.classId) } : { id: c.classId, name: '' },
      })),
    }));
  }

  private async hydrateAll(items: any[]) {
    if (items.length === 0) return [];
    const allClassIds = [...new Set(items.flatMap((q: any) => (q.classes || []).map((c: any) => c.classId)))];
    const allTeacherIds = [...new Set(items.map((q: any) => q.teacherId).filter(Boolean))];
    const [classMap, teacherMap, countMap] = await Promise.all([
      this.fetchClassMap(allClassIds),
      this.fetchTeacherMap(allTeacherIds),
      computeClassStudentCounts(allClassIds),
    ]);

    return items.map((q: any) => {
      const completedCount = q._count?.submissions ?? 0;
      const totalStudents = (q.classes || []).reduce((sum: number, c: any) => sum + (countMap.get(c.classId) ?? 0), 0);
      return {
        ...q,
        // Schema.prisma QuizQuestion.options adalah String (JSON-encoded).
        // Parse kembali ke array string[] untuk konsistensi dengan Zod schema dan client FE.
        questions: q.questions ? q.questions.map((qq: any) => ({ ...qq, options: typeof qq.options === 'string' ? JSON.parse(qq.options) : qq.options })) : q.questions,
        teacher: teacherMap.get(q.teacherId) ?? { id: q.teacherId, fullname: '' },
        classes: (q.classes || []).map((c: any) => ({
          ...c, class: classMap.has(c.classId) ? { id: c.classId, name: classMap.get(c.classId) } : { id: c.classId, name: '' },
        })),
        quizStats: { completedCount, totalStudents },
      };
    });
  }
}

export const quizRepository = new QuizRepository();
