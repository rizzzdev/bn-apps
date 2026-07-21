import { prisma } from "@/database";
import { CreateStudentDto, UpdateStudentDto } from "@/modules/student/domain";
import { StudentStatus } from "@/database/generated/client";

export class StudentRepository {
  async findAll(
    skip: number,
    take: number | "all",
    userId?: string,
    includeCurrentClass = false,
    includeUser = false,
    includePicture = false,
  ) {
    const where: import("@/database/generated/client").Prisma.StudentWhereInput =
      { deletedAt: null };
    if (userId) where.userId = userId;
    const include:
      | import("@/database/generated/client").Prisma.StudentInclude
      | undefined = {
      ...(includeCurrentClass ? { currentClass: true, currentMajor: true } : {}),
      ...(includePicture ? { picture: true } : {}),
    };
    const students = await prisma.student.findMany({
      where,
      include: Object.keys(include).length > 0 ? include : undefined,
      ...(take === "all" ? {} : { skip, take }),
    });

    if (!includeUser) {
      return students;
    }

    const users = await prisma.sentri_users.findMany({
      where: { id: { in: students.map((s) => s.userId) } },
      omit: { password_hash: true },
      include: {
        sentri_identifiers: {
          where: {
            type: "email",
          },
        },
      },
    });

    return students.map((student) => ({
      ...student,
      user: users?.find((u) => u.id === student.userId),
    }));
  }

  async count(userId?: string) {
    const where: import("@/database/generated/client").Prisma.StudentWhereInput =
      { deletedAt: null };
    if (userId) where.userId = userId;
    return prisma.student.count({ where });
  }

  async getStatistic() {
    const stats = await prisma.student.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
      where: {
        deletedAt: null,
      },
    });

    return { stats };
  }

  async findById(id: string, includeCurrentClass = false, includePicture = false) {
    const include:
      | import("@/database/generated/client").Prisma.StudentInclude
      | undefined = {
      ...(includeCurrentClass ? { currentClass: true, currentMajor: true } : {}),
      ...(includePicture ? { picture: true } : {}),
    };
    return prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: Object.keys(include).length > 0 ? include : undefined,
    });
  }

  async findByIds(ids: string[]) {
    return prisma.student.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async checkUnique(field: string, value: string, excludeId?: string) {
    const where: import("@/database/generated/client").Prisma.StudentWhereInput =
      { [field]: value, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.student.findFirst({ where });
  }

  async create(data: CreateStudentDto, userId: string) {
    const { password, pictureId, ...restData } = data;

    const created = await prisma.student.create({
      data: {
        ...restData,
        userId,
        ...(pictureId ? { picture: { connect: { id: pictureId } } } : {}),
      } as any,
      include: { currentClass: true, currentMajor: true, picture: true },
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

  async update(id: string, data: UpdateStudentDto) {
    const { pictureId, ...restData } = data;

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...restData,
        ...(pictureId !== undefined
          ? { picture: pictureId ? { connect: { id: pictureId } } : { disconnect: true } }
          : {}),
      } as any,
      include: { currentClass: true, currentMajor: true, picture: true },
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
    const deleted = await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { currentClass: true, currentMajor: true, picture: true },
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

  async bulkUpdateStatus(ids: string[], status: StudentStatus) {
    return prisma.student.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status },
    });
  }
}

export const studentRepository = new StudentRepository();
