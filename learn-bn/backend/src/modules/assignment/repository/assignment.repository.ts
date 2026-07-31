import { prisma } from '@/database';
import { CreateAssignmentDto, UpdateAssignmentDto } from '../domain/schemas';

const teacherSelect = {
  id: true,
  fullname: true,
  prefixTitle: true,
  suffixTitle: true,
  pictureUrl: true,
  subjectTeachers: {
    select: { subject: { select: { id: true, name: true, code: true } } },
  },
};

const classesInclude = {
  include: {
    class: {
      select: {
        id: true,
        name: true,
        _count: { select: { classStudents: { where: { status: 'Aktif' as const, deletedAt: null } } } },
      },
    },
  },
};

export class AssignmentRepository {
  async create(data: CreateAssignmentDto, teacherId: string) {
    return prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        status: data.status || 'Draft',
        teacherId,
        attachments: {
          create: data.attachments || [],
        },
        classes: {
          create: data.classIds.map((classId) => ({ classId })),
        },
      },
      include: {
        attachments: true,
        classes: classesInclude,
        teacher: { select: teacherSelect },
      },
    });
  }

  async findAllByTeacher(teacherId: string) {
    const assignments = await prisma.assignment.findMany({
      where: { teacherId, deletedAt: null },
      include: {
        attachments: true,
        classes: classesInclude,
        teacher: { select: teacherSelect },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((a: any) => ({
      ...a,
      submissionStats: {
        submittedCount: a._count?.submissions ?? 0,
        totalStudents: a.classes?.reduce(
          (sum: number, c: any) => sum + (c.class?._count?.classStudents ?? 0),
          0
        ) ?? 0,
      },
    }));
  }

  async findAllByClass(classId: string, isStudent = false, studentId?: string) {
    const assignments = await prisma.assignment.findMany({
      where: {
        classes: { some: { classId } },
        deletedAt: null,
        ...(isStudent && { status: 'Published' }),
      },
      include: {
        attachments: true,
        classes: classesInclude,
        teacher: { select: teacherSelect },
        _count: { select: { submissions: true } },
        ...(studentId ? {
          submissions: {
            where: { studentId },
            select: { id: true, grade: true, createdAt: true },
          },
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((a: any) => {
      const submittedCount = a._count?.submissions ?? 0;
      const totalStudents = a.classes?.reduce(
        (sum: number, c: any) => sum + (c.class?._count?.classStudents ?? 0),
        0
      ) ?? 0;

      if (studentId) {
        const mySubmission = a.submissions?.[0] ?? null;
        return {
          ...a,
          submissionStats: { submittedCount, totalStudents },
          isSubmitted: !!mySubmission,
          mySubmission,
        };
      }

      return { ...a, submissionStats: { submittedCount, totalStudents } };
    });
  }

  async findById(id: string) {
    const assignment = await prisma.assignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        attachments: true,
        classes: classesInclude,
        teacher: { select: teacherSelect },
        _count: { select: { submissions: true } },
      },
    });

    if (!assignment) return null;

    const a = assignment as any;
    const submittedCount = a._count?.submissions ?? 0;
    const totalStudents = a.classes?.reduce(
      (sum: number, c: any) => sum + (c.class?._count?.classStudents ?? 0),
      0
    ) ?? 0;

    return { ...assignment, submissionStats: { submittedCount, totalStudents } };
  }

  async update(id: string, data: UpdateAssignmentDto) {
    return prisma.assignment.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.deadline && { deadline: new Date(data.deadline) }),
        ...(data.status && { status: data.status }),
        ...(data.classIds !== undefined && {
          classes: {
            deleteMany: {},
            create: data.classIds.map((classId) => ({ classId })),
          },
        }),
        ...(data.attachments && {
          attachments: {
            deleteMany: {},
            create: data.attachments,
          },
        }),
      },
      include: {
        attachments: true,
        classes: classesInclude,
        teacher: { select: teacherSelect },
      },
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
