import { NotFoundError } from '@app/index.js';

export interface BaseRepository<T, CreateDto, UpdateDto> {
  findAll(skip: number, limit: number): Promise<T[]>;
  count(): Promise<number>;
  findById(id: string): Promise<T | null>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T>;
  softDelete(id: string): Promise<any>;
  softDeleteMany(ids: string[]): Promise<{ count: number }>;
  updateStatusMany(ids: string[], status: string): Promise<{ count: number }>;
  createMany?(items: CreateDto[]): Promise<any>;
}

export class BaseService<T, CreateDto, UpdateDto> {
  constructor(protected repository: BaseRepository<T, CreateDto, UpdateDto>, protected entityName: string = 'Data') {}

  async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, limit),
      this.repository.count(),
    ]);
    return { data, total };
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError(`${this.entityName} tidak ditemukan`);
    return item;
  }

  async create(data: CreateDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateDto) {
    await this.getById(id);
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repository.softDelete(id);
  }

  async deleteBulk(ids: string[]) {
    const { count } = await this.repository.softDeleteMany(ids);
    return { deleted: count };
  }

  async updateStatusBulk(ids: string[], status: string) {
    const { count } = await this.repository.updateStatusMany(ids, status);
    return { updated: count };
  }

  async createBulk(items: CreateDto[]) {
    if (this.repository.createMany) {
      await this.repository.createMany(items);
      return { created: items.length };
    }
    throw new Error('createMany not supported');
  }
}
