import { prisma } from '@/database';
import { CreateMaterialDto, UpdateMaterialDto } from '../domain/schemas';

export class MaterialRepository {
  async create(data: CreateMaterialDto, teacherId: string) {
    return prisma.material.create({
      data: {
        title: data.title,
        content: data.content,
        classId: data.classId,
        teacherId,
        attachments: {
          create: data.attachments || [],
        },
      },
      include: { attachments: true },
    });
  }

  async findAllByClass(classId: string) {
    return prisma.material.findMany({
      where: { classId, deletedAt: null },
      include: {
        attachments: true,
        teacher: {
          select: { id: true, fullname: true, pictureUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.material.findFirst({
      where: { id, deletedAt: null },
      include: {
        attachments: true,
        teacher: {
          select: { id: true, fullname: true, pictureUrl: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateMaterialDto) {
    return prisma.material.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        ...(data.classId && { classId: data.classId }),
        ...(data.attachments && {
          attachments: {
            deleteMany: {},
            create: data.attachments,
          },
        }),
      },
      include: { attachments: true },
    });
  }

  async delete(id: string) {
    return prisma.material.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkDelete(ids: string[]) {
    return prisma.material.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }
}

export const materialRepository = new MaterialRepository();
