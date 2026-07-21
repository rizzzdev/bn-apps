import { prisma } from '@/database';
import { CreateAssignmentDto, UpdateAssignmentDto } from '../domain/schemas';

export class AssignmentRepository {
  async create(data: CreateAssignmentDto, teacherId: string) {
    return prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
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
    return prisma.assignment.findMany({
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
    return prisma.assignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        attachments: true,
        teacher: {
          select: { id: true, fullname: true, pictureUrl: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateAssignmentDto) {
    return prisma.assignment.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.deadline && { deadline: new Date(data.deadline) }),
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
    return prisma.assignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkDelete(ids: string[]) {
    return prisma.assignment.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }
}

export const assignmentRepository = new AssignmentRepository();
