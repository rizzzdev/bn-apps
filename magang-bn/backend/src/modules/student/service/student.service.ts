import { StudentRepository } from '@/modules/student/repository/index.js';
import { Prisma } from '@/database/generated/client/index.js';
import { NotFoundError } from '@/errors/index.js';
import { withCache, clearCachePattern, setCache } from '@/utils/cache.js';

export class StudentService {
  constructor(private repository: StudentRepository) {}

  async getAll(page: number, limit: number, search?: string) {
    const cacheKey = search ? `student:all:page:${page}:limit:${limit}:search:${search}` : `student:all:page:${page}:limit:${limit}`;
    return withCache(cacheKey, 600, async () => {
      const skip = (page - 1) * limit;
      let whereClause: Prisma.StudentWhereInput | undefined = undefined;
      
      if (search) {
        whereClause = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nisn: { contains: search, mode: 'insensitive' } }
          ]
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
    return withCache(`student:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Siswa tidak ditemukan');
      return item;
    });
  }
}

import { studentRepository } from '@/modules/student/repository/index.js';
export const studentService = new StudentService(studentRepository);
