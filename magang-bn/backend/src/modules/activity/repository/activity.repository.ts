import { prisma } from '@/database/index.js';
import { CreateActivityDto, UpdateActivityDto } from '@/modules/activity/domain/index.js';
import { Prisma } from '@/database/generated/client/index.js';

export class ActivityRepository {
  async findAll(skip: number, take: number, whereClause?: Prisma.ActivityWhereInput) {
    const where: Prisma.ActivityWhereInput = { ...whereClause, deletedAt: null };
    return prisma.activity.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  async count(whereClause?: Prisma.ActivityWhereInput) {
    const where: Prisma.ActivityWhereInput = { ...whereClause, deletedAt: null };
    return prisma.activity.count({ where });
  }

  async findById(id: string) {
    return prisma.activity.findFirst({ where: { id, deletedAt: null } });
  }

  async create(data: CreateActivityDto) {
    return prisma.activity.create({ data: data as Prisma.ActivityCreateInput });
  }

  async update(id: string, data: UpdateActivityDto) {
    return prisma.activity.update({ where: { id }, data: data as Prisma.ActivityUpdateInput });
  }

  async softDelete(id: string) {
    return prisma.activity.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const activityRepository = new ActivityRepository();
