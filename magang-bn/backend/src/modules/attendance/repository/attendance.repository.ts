import { prisma } from '@/database/index.js';
import { Prisma } from '@/database/generated/client/index.js';

export class AttendanceRepository {
  async create(data: Prisma.AttendanceUncheckedCreateInput) {
    return prisma.attendance.create({ data });
  }

  async findAll(skip: number, take: number, whereClause?: Prisma.AttendanceWhereInput) {
    const where: Prisma.AttendanceWhereInput = { ...whereClause, deletedAt: null };
    return prisma.attendance.findMany({ 
      where, 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' },
      include: {
        student: true,
        placement: {
          include: { company: true }
        }
      }
    });
  }

  async count(whereClause?: Prisma.AttendanceWhereInput) {
    const where: Prisma.AttendanceWhereInput = { ...whereClause, deletedAt: null };
    return prisma.attendance.count({ where });
  }

  async findById(id: string) {
    return prisma.attendance.findFirst({ 
      where: { id, deletedAt: null },
      include: {
        student: true,
        placement: true
      }
    });
  }
}

export const attendanceRepository = new AttendanceRepository();
