import { StudentRepository } from '#internship/modules/student/repository/index.js';
import { Prisma, prisma } from '#internship/database/index.js';
import { NotFoundError } from '#app';
import { withCache, clearCachePattern } from '#app';
import { getOrchestrator } from '#app/orchestrator.js';

export class StudentService {
  constructor(private repository: StudentRepository) {}

  private async syncWithMaster() {
    try {
      const orchestrator = getOrchestrator();
      const masterStudents = await orchestrator.masterStudent.findAll();
      const activeIds = masterStudents.map((ms) => ms.id);

      for (const ms of masterStudents) {
        if (!ms.email) continue;
        await prisma.student.upsert({
          where: { id: ms.id },
          update: {
            name: ms.fullname,
            email: ms.email,
            nisn: ms.nisn ?? undefined,
            userId: ms.userId,
            deletedAt: null,
          },
          create: {
            id: ms.id,
            name: ms.fullname,
            email: ms.email,
            nisn: ms.nisn ?? undefined,
            userId: ms.userId,
          },
        }).catch(() => {});
      }

      if (activeIds.length > 0) {
        await prisma.student.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
          },
        }).catch(() => {});
      }
      await clearCachePattern('student:*');
    } catch (e) {
      console.error('Failed to sync master students:', e);
    }
  }

  async getAll(page: number, limit: number, search?: string) {
    await this.syncWithMaster();
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

import { studentRepository } from '#internship/modules/student/repository/index.js';
export const studentService = new StudentService(studentRepository);
