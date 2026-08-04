import { prisma } from '#internship/database/index.js';
import { CreateAttachmentDto, UpdateAttachmentDto } from '#internship/modules/attachment/domain/index.js';
import { Prisma } from '#internship/database/index.js';

export class AttachmentRepository {
  async findAll(skip: number, take: number, whereClause?: Prisma.AttachmentWhereInput) {
    const where: Prisma.AttachmentWhereInput = { ...whereClause, deletedAt: null };
    return prisma.attachment.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  async count(whereClause?: Prisma.AttachmentWhereInput) {
    const where: Prisma.AttachmentWhereInput = { ...whereClause, deletedAt: null };
    return prisma.attachment.count({ where });
  }

  async findById(id: string) {
    return prisma.attachment.findFirst({ where: { id, deletedAt: null } });
  }

  async findByIds(ids: string[]) {
    return prisma.attachment.findMany({ where: { id: { in: ids }, deletedAt: null } });
  }

  async create(data: CreateAttachmentDto) {
    return prisma.attachment.create({ data: data as Prisma.AttachmentCreateInput });
  }

  async update(id: string, data: UpdateAttachmentDto) {
    return prisma.attachment.update({ where: { id }, data: data as Prisma.AttachmentUpdateInput });
  }

  async softDelete(id: string) {
    return prisma.attachment.update({ where: { id }, data: { deletedAt: new Date(), url: null } });
  }

  async bulkSoftDelete(ids: string[]) {
    return prisma.attachment.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date(), url: null } });
  }
}

export const attachmentRepository = new AttachmentRepository();
