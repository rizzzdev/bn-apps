import { prisma } from '@/database';
import { CreateTeacherDto, UpdateTeacherDto } from '@/modules/teacher/domain';
import { TeacherStatus } from '@/database/generated/client';

export class TeacherRepository {
  async findAll(skip: number, take: number | "all", userId?: string, includeUser = false, includePicture = false) {
    const where: import('@/database/generated/client').Prisma.TeacherWhereInput = { deletedAt: null };
    if (userId) where.userId = userId;
    const teachers = await prisma.teacher.findMany({
      where,
      ...(includePicture ? { include: { picture: true } } : {}),
      ...(take === "all" ? {} : { skip, take }),
    });

    if (!includeUser) {
      return teachers;
    }

    const users = await prisma.sentri_users.findMany({
      where: { id: { in: teachers.map((t) => t.userId) } },
      omit: { password_hash: true },
      include: {
        sentri_identifiers: {
          where: {
            type: "email",
          },
        },
      },
    });

    return teachers.map((teacher) => ({
      ...teacher,
      user: users?.find((u) => u.id === teacher.userId),
    }));
  }

  async count(userId?: string) {
    const where: import('@/database/generated/client').Prisma.TeacherWhereInput = { deletedAt: null };
    if (userId) where.userId = userId;
    return prisma.teacher.count({ where });
  }

  async getStatistics() {
    const [total, active, inactive, retired] = await Promise.all([
      prisma.teacher.count({ where: { deletedAt: null } }),
      prisma.teacher.count({ where: { status: TeacherStatus.Aktif, deletedAt: null } }),
      prisma.teacher.count({ where: { status: TeacherStatus.Tidak_Aktif, deletedAt: null } }),
      prisma.teacher.count({ where: { status: TeacherStatus.Pensiun, deletedAt: null } }),
    ]);
    return { total, active, inactive, retired };
  }

  async findById(id: string, includePicture = false) {
    return prisma.teacher.findFirst({
      where: { id, deletedAt: null },
      ...(includePicture ? { include: { picture: true } } : {}),
    });
  }

  async findByIds(ids: string[]) {
    return prisma.teacher.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async checkUnique(field: string, value: string, excludeId?: string) {
    const where: import('@/database/generated/client').Prisma.TeacherWhereInput = { [field]: value, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.teacher.findFirst({ where });
  }

  async create(data: CreateTeacherDto, userId: string) {
    const { password, pictureId, ...teacherData } = data;
    const created = await prisma.teacher.create({
      data: {
        ...teacherData,
        userId,
        ...(pictureId ? { picture: { connect: { id: pictureId } } } : {}),
      } as any,
      include: { picture: true },
    });

    const user = await prisma.sentri_users.findFirst({
      where: { id: created.userId },
      omit: { password_hash: true },
      include: {
        sentri_identifiers: {
          where: {
            type: "email",
          },
        },
      },
    });

    return { ...created, user };
  }

  async update(id: string, data: UpdateTeacherDto) {
    const { password, pictureId, ...teacherData } = data;
    const updated = await prisma.teacher.update({
      where: { id },
      data: {
        ...teacherData,
        ...(pictureId !== undefined
          ? { picture: pictureId ? { connect: { id: pictureId } } : { disconnect: true } }
          : {}),
      } as any,
      include: { picture: true },
    });

    const user = await prisma.sentri_users.findFirst({
      where: { id: updated.userId },
      omit: { password_hash: true },
      include: {
        sentri_identifiers: {
          where: {
            type: "email",
          },
        },
      },
    });

    return { ...updated, user };
  }

  async softDelete(id: string) {
    const deleted = await prisma.teacher.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { picture: true },
    });

    const user = await prisma.sentri_users.findFirst({
      where: { id: deleted.userId },
      omit: { password_hash: true },
      include: {
        sentri_identifiers: {
          where: {
            type: "email",
          },
        },
      },
    });

    return { ...deleted, user };
  }

  async bulkSoftDelete(ids: string[]) {
    return prisma.teacher.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async bulkUpdateStatus(ids: string[], status: TeacherStatus) {
    return prisma.teacher.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { status } });
  }
}

export const teacherRepository = new TeacherRepository();
