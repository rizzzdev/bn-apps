import { prisma } from '../../../database';
export class AttachmentRepository {
    async create(data) {
        return prisma.attachment.create({
            data,
        });
    }
    async findById(id) {
        return prisma.attachment.findUnique({
            where: { id },
        });
    }
    async findByUrl(url) {
        return prisma.attachment.findUnique({
            where: { url },
        });
    }
    async findByIds(ids) {
        return prisma.attachment.findMany({
            where: { id: { in: ids } },
        });
    }
    async delete(id) {
        return prisma.attachment.delete({
            where: { id },
        });
    }
    async bulkDelete(ids) {
        return prisma.attachment.deleteMany({
            where: { id: { in: ids } },
        });
    }
}
export const attachmentRepository = new AttachmentRepository();
