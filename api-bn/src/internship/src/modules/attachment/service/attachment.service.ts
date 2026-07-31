import { AttachmentRepository, attachmentRepository } from '@internship/modules/attachment/repository/index.js';
import { CreateAttachmentDto, UpdateAttachmentDto } from '@internship/modules/attachment/domain/index.js';
import { NotFoundError } from '@app/index.js';
import { withCache, clearCachePattern, setCache } from '@app/index.js';
import path from 'path';
import fs from 'fs';

export class AttachmentService {
  constructor(private repository: AttachmentRepository) {}

  async getAll(page: number, limit: number) {
    return withCache(`attachment:all:page:${page}:limit:${limit}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit),
        this.repository.count(),
      ]);
      return { data, total };
    });
  }

  async getById(id: string) {
    return withCache(`attachment:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Data tidak ditemukan');
      return item;
    });
  }

  async create(data: CreateAttachmentDto) {
    const created = await this.repository.create(data);
    await clearCachePattern(`attachment:all:*`);
    await setCache(`attachment:id:${created.id}`, created, 600);
    return created;
  }

  async update(id: string, data: UpdateAttachmentDto) {
    await this.getById(id);
    const updated = await this.repository.update(id, data);
    await clearCachePattern(`attachment:all:*`);
    await setCache(`attachment:id:${id}`, updated, 600);
    return updated;
  }

  async delete(id: string) {
    const existing = await this.getById(id);
    
    // Delete physical file from disk
    if (existing.url) {
      const filename = existing.url.split('/').pop();
      if (filename) {
        const filePath = path.resolve(process.cwd(), 'public/attachments', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    const deleted = await this.repository.softDelete(id);
    await clearCachePattern(`attachment:all:*`);
    await clearCachePattern(`attachment:id:${id}`);
    return deleted;
  }

  async bulkDelete(ids: string[]) {
    // Find attachments first to get URLs before they're set to null
    const attachments = await this.repository.findByIds(ids);
    
    // Delete physical files from disk
    for (const att of attachments) {
      if (att.url) {
        const filename = att.url.split('/').pop();
        if (filename) {
          const filePath = path.resolve(process.cwd(), 'public/attachments', filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    }

    const deleted = await this.repository.bulkSoftDelete(ids);
    await clearCachePattern(`attachment:all:*`);
    return deleted;
  }
}

export const attachmentService = new AttachmentService(attachmentRepository);
