import { prisma } from '#master/database/index.js';
import { CreateApplicationDto, UpdateApplicationDto } from '#master/modules/application/domain';

export class ApplicationRepository {
  async findAll(skip: number, take: number) {
    // Order by explicit `order` (NULLS LAST so un-positioned rows fall to the
    // bottom) then by createdAt desc as tiebreaker.
    return prisma.application.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: [
        { order: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Returns the maximum `order` value among non-deleted applications.
   * Returns 0 when there are no rows yet (so the first auto-filled row is 1).
   */
  async getMaxOrder(): Promise<number> {
    const top = await prisma.application.findFirst({
      where: { deletedAt: null, order: { not: null } },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return top?.order ?? 0;
  }

  async count() {
    return prisma.application.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.application.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByIds(ids: string[]) {
    return prisma.application.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async create(data: CreateApplicationDto) {
    return prisma.application.create({ data });
  }

  async update(id: string, data: UpdateApplicationDto) {
    return prisma.application.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const applicationRepository = new ApplicationRepository();
