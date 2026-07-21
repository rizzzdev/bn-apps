import { TeacherRepository, teacherRepository } from '@/modules/teacher/repository/index.js';
import { Prisma } from '@/database/generated/client/index.js';
import { NotFoundError } from '@/errors/index.js';
import { withCache, clearCachePattern, setCache } from '@/utils/cache.js';

export class TeacherService {
  constructor(private repository: TeacherRepository) {}

  async getAll(page: number, limit: number, search?: string) {
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
