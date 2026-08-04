import { TeacherRepository, teacherRepository } from '#internship/modules/teacher/repository/index.js';
import { Prisma, prisma } from '#internship/database/index.js';
import { NotFoundError } from '#app';
import { withCache, clearCachePattern } from '#app';
import { getOrchestrator } from '#app/orchestrator.js';

export class TeacherService {
  constructor(private repository: TeacherRepository) {}

  private async syncWithMaster() {
    try {
      const orchestrator = getOrchestrator();
      const masterTeachers = await orchestrator.masterTeacher.findAll();
      const activeIds = masterTeachers.map((mt) => mt.id);

      for (const mt of masterTeachers) {
        if (!mt.email) continue;
        await prisma.teacher.upsert({
          where: { id: mt.id },
          update: {
            name: mt.fullname,
            email: mt.email,
            nip: mt.nip ?? undefined,
            prefixTitle: mt.prefixTitle ?? undefined,
            suffixTitle: mt.suffixTitle ?? undefined,
            userId: mt.userId,
            deletedAt: null,
          },
          create: {
            id: mt.id,
            name: mt.fullname,
            email: mt.email,
            nip: mt.nip ?? undefined,
            prefixTitle: mt.prefixTitle ?? undefined,
            suffixTitle: mt.suffixTitle ?? undefined,
            userId: mt.userId,
          },
        }).catch(() => {});
      }

      if (activeIds.length > 0) {
        await prisma.teacher.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
          },
        }).catch(() => {});
      }
      await clearCachePattern('teacher:*');
    } catch (e) {
      console.error('Failed to sync master teachers:', e);
    }
  }

  async getAll(page: number, limit: number, search?: string) {
    await this.syncWithMaster();
    const cacheKey = search ? `teacher:all:page:${page}:limit:${limit}:search:${search}` : `teacher:all:page:${page}:limit:${limit}`;
    return withCache(cacheKey, 600, async () => {
      const skip = (page - 1) * limit;
      let whereClause: Prisma.TeacherWhereInput | undefined = undefined;
      
      if (search) {
        whereClause = {
          name: { contains: search, mode: 'insensitive' }
        };
      }

      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, whereClause),
        this.repository.count(whereClause),
      ]);
      return { data, total };
    });
  }

  async getById(id: string) {
    return withCache(`teacher:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Data tidak ditemukan');
      return item;
    });
  }
}

export const teacherService = new TeacherService(teacherRepository);
