import { prisma } from '#learn/database/index.js';

export class AttachmentRepository {
  async create(data: { filename: string; format: string; size: number; url: string }) {
    return prisma.attachment.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.attachment.findUnique({
      where: { id },
    });
  }

  async findByUrl(url: string) {
    return prisma.attachment.findUnique({
      where: { url },
    });
  }

  async findByIds(ids: string[]) {
    return prisma.attachment.findMany({
      where: { id: { in: ids } },
    });
  }

  async delete(id: string) {
    return prisma.attachment.delete({
      where: { id },
    });
  }

  async bulkDelete(ids: string[]) {
    return prisma.attachment.deleteMany({
      where: { id: { in: ids } },
    });
  }
}

export const attachmentRepository = new AttachmentRepository();
