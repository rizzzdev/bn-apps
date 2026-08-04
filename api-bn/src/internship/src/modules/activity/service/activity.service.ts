import { ActivityRepository, activityRepository } from '#internship/modules/activity/repository/index.js';
import { CreateActivityDto, UpdateActivityDto } from '#internship/modules/activity/domain/index.js';
import { NotFoundError } from '#app';
import { withCache, clearCachePattern, setCache, putOptionalToNull } from '#app';
import { prisma } from '#internship/database/index.js';
import { Prisma } from '#internship/database/index.js';

const ACTIVITY_NULLABLE_UPDATE_FIELDS = ['actorId', 'targetId', 'action'] as const;

export class ActivityService {
  constructor(private repository: ActivityRepository) {}

  async getAll(page: number, limit: number, whereClause?: Prisma.ActivityWhereInput) {
    const cacheKey = whereClause 
      ? `activity:all:page:${page}:limit:${limit}:where:${JSON.stringify(whereClause)}` 
      : `activity:all:page:${page}:limit:${limit}`;
      
    return withCache(cacheKey, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, whereClause),
        this.repository.count(whereClause),
      ]);
      return { data, total };
    });
  }

  async getById(id: string) {
    return withCache(`activity:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Data tidak ditemukan');
      return item;
    });
  }

  async create(data: CreateActivityDto) {
    const created = await this.repository.create(data);
    await clearCachePattern(`activity:all:*`);
    await setCache(`activity:id:${created.id}`, created, 600);
    return created;
  }

  async update(id: string, data: UpdateActivityDto) {
    await this.getById(id);
    const updated = await this.repository.update(id, putOptionalToNull(data, ACTIVITY_NULLABLE_UPDATE_FIELDS));
    await clearCachePattern(`activity:all:*`);
    await setCache(`activity:id:${id}`, updated, 600);
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern(`activity:all:*`);
    await clearCachePattern(`activity:id:${id}`);
    return deleted;
  }
}

export const activityService = new ActivityService(activityRepository);
