import { prisma } from '@master/database/index.js';
import { CreateTeacherDto, UpdateTeacherDto } from '@master/modules/teacher/domain';
import { TeacherStatus } from '@master/database/index.js';
import { getOrchestrator } from '@app/orchestrator.js';

export class TeacherRepository {
  async findAll(skip: number, take: number | "all", search?: string, userId?: string, includeUser = false, includePicture = false) {
    const where: import('@master/database/index.js').Prisma.TeacherWhereInput = { deletedAt: null };
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    const teachers = await prisma.teacher.findMany({
      where,
      ...(includePicture ? { include: { picture: true } } : {}),
      ...(take === "all" ? {} : { skip, take }),
    });

    if (!includeUser) {
      return teachers;
    }

    const users = await getOrchestrator().authData.findUsersByIds(teachers.map((t) => t.userId));

    return teachers.map((teacher) => ({
      ...teacher,
      user: users?.find((u: any) => u.id === teacher.userId),
    }));
  }

  async count(search?: string, userId?: string) {
    const where: import('@master/database/index.js').Prisma.TeacherWhereInput = { deletedAt: null };
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: 'insensitive' } },
        { nik: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
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
    const where: import('@master/database/index.js').Prisma.TeacherWhereInput = { [field]: value, deletedAt: null };
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
      },
      include: { picture: true },
    });

    const users = await getOrchestrator().authData.findUsersByIds([created.userId]);

    return { ...created, user: users[0] || null };
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
      },
      include: { picture: true },
    });

    const users = await getOrchestrator().authData.findUsersByIds([updated.userId]);

    return { ...updated, user: users[0] || null };
  }

  async softDelete(id: string) {
    const deleted = await prisma.teacher.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { picture: true },
    });

    const users = await getOrchestrator().authData.findUsersByIds([deleted.userId]);

    return { ...deleted, user: users[0] || null };
  }

  async bulkSoftDelete(ids: string[]) {
    return prisma.teacher.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  async bulkUpdateStatus(ids: string[], status: TeacherStatus) {
    return prisma.teacher.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { status } });
  }
}

export const teacherRepository = new TeacherRepository();
