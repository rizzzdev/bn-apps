import { prisma, ClassStudentStatus } from '#academic/database/index.js';
import type {
  AcademicClassStudent,
  IAcademicClassStudentRepository,
} from '#app/ports/academic-data.port.js';

export class AcademicClassStudentRepository implements IAcademicClassStudentRepository {
  async findFirst(where: { classId: string; studentId: string; status?: string }): Promise<AcademicClassStudent | null> {
    const record = await prisma.classStudent.findFirst({
      where: {
        classId: where.classId,
        studentId: where.studentId,
        status: (where.status ?? 'Aktif') as ClassStudentStatus,
        deletedAt: null,
      },
    });
    if (!record) return null;
    return {
      id: record.id,
      classId: record.classId,
      studentId: record.studentId,
      status: record.status,
    };
  }

  async findMany(where: { classId?: { in: string[] }; studentId?: string; status?: string; deletedAt?: null }): Promise<AcademicClassStudent[]> {
    const records = await prisma.classStudent.findMany({
      where: {
        ...(where.classId?.in && { classId: { in: where.classId.in } }),
        ...(where.studentId && { studentId: where.studentId }),
        ...(where.status && { status: where.status as ClassStudentStatus }),
        deletedAt: null,
      },
    });
    return records.map((r) => ({
      id: r.id,
      classId: r.classId,
      studentId: r.studentId,
      status: r.status,
    }));
  }

  async count(where: { classId?: { in: string[] }; status?: string; deletedAt?: null }): Promise<number> {
    return prisma.classStudent.count({
      where: {
        ...(where.classId?.in && { classId: { in: where.classId.in } }),
        ...(where.status && { status: where.status as ClassStudentStatus }),
        deletedAt: null,
      },
    });
  }
}
