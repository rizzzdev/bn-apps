import { prisma } from '#internship/database/index.js';
import { CreateDailyLogbookDto, UpdateDailyLogbookDto } from '#internship/modules/daily-logbook/domain/index.js';
import { Prisma } from '#internship/database/index.js';

export class DailyLogbookRepository {
  async findAll(skip: number, take: number, whereClause?: Prisma.DailyLogbookWhereInput) {
    const where: Prisma.DailyLogbookWhereInput = { ...whereClause, deletedAt: null };
    return prisma.dailyLogbook.findMany({ 
      where, 
      skip, 
      take, 
      orderBy: { createdAt: 'desc' },
      include: {
        attachments: { where: { deletedAt: null } },
        placement: {
          include: {
            student: true,
            teacher: true,
            industryMentor: true,
            company: true
          }
        },
        reviews: { orderBy: { createdAt: 'desc' } }
      }
    });
  }

  async count(whereClause?: Prisma.DailyLogbookWhereInput) {
    const where: Prisma.DailyLogbookWhereInput = { ...whereClause, deletedAt: null };
    return prisma.dailyLogbook.count({ where });
  }

  async findById(id: string) {
    return prisma.dailyLogbook.findFirst({ 
      where: { id, deletedAt: null },
      include: {
        attachments: { where: { deletedAt: null } },
        placement: {
          include: {
            student: true,
            teacher: true,
            industryMentor: true,
            company: true
          }
        },
        reviews: { orderBy: { createdAt: 'desc' } }
      }
    });
  }

  async create(data: CreateDailyLogbookDto) {
    return prisma.dailyLogbook.create({ data: data as Prisma.DailyLogbookUncheckedCreateInput });
  }

  async update(id: string, data: UpdateDailyLogbookDto) {
    return prisma.dailyLogbook.update({ where: { id }, data: data as Prisma.DailyLogbookUpdateInput });
  }

  async softDelete(id: string) {
    return prisma.dailyLogbook.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  async bulkSoftDelete(ids: string[]) {
    return prisma.dailyLogbook.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  }
}

export const dailyLogbookRepository = new DailyLogbookRepository();
