import { prisma } from '@master/database/index.js';

export class AttachmentRepository {
  async create(data: { filename: string; format: string; size: number; url: string }) {
    return prisma.attachment.create({ data });
  }

  async findByUrl(url: string) {
    return prisma.attachment.findFirst({ where: { url, deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.attachment.findFirst({ where: { id, deletedAt: null } });
  }

  async softDelete(id: string) {
    return prisma.attachment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async findByIds(ids: string[]) {
    return prisma.attachment.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async bulkSoftDelete(ids: string[]) {
    return prisma.attachment.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}

export const attachmentRepository = new AttachmentRepository();
