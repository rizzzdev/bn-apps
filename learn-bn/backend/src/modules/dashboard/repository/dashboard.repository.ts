import { prisma } from '@/database';

export class DashboardRepository {
  async findTeacherPendingGrading(teacherId: string) {
    const assignments = await prisma.assignment.findMany({
      where: {
        teacherId,
        status: 'Published',
        deletedAt: null,
      },
      include: {
        classes: {
          include: {
            class: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            submissions: {
              where: { grade: null },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments
      .filter((a) => a._count?.submissions > 0)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        className:
          a.classes?.map((c: any) => c.class?.name).filter(Boolean).join(', ') || 'Kelas',
        ungradedCount: a._count?.submissions ?? 0,
      }));
  }

  async findStudentPendingMaterials(studentId: string, classIds: string[]) {
    return prisma.material.findMany({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deletedAt: null,
        reads: { none: { studentId } },
      },
      include: {
        classes: {
          include: {
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async findStudentPendingAssignments(studentId: string, classIds: string[]) {
    return prisma.assignment.findMany({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deadline: { gte: new Date() },
        deletedAt: null,
        submissions: { none: { studentId } },
      },
      include: {
        classes: {
          include: {
            class: { select: { id: true, name: true } },
          },
        },
        teacher: { select: { id: true, fullname: true } },
      },
      orderBy: { deadline: 'asc' },
      take: 10,
    });
  }

  async findStudentPendingQuizzes(studentId: string, classIds: string[]) {
    return prisma.quiz.findMany({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deletedAt: null,
        submissions: { none: { studentId } },
      },
      include: {
        classes: {
          include: {
            class: { select: { id: true, name: true } },
          },
        },
        teacher: { select: { id: true, fullname: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async countTotalUnreadMaterials(studentId: string, classIds: string[]) {
    return prisma.material.count({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deletedAt: null,
        reads: { none: { studentId } },
      },
    });
  }

  async countTotalPendingAssignments(studentId: string, classIds: string[]) {
    return prisma.assignment.count({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deadline: { gte: new Date() },
        deletedAt: null,
        submissions: { none: { studentId } },
      },
    });
  }

  async countTotalPendingQuizzes(studentId: string, classIds: string[]) {
    return prisma.quiz.count({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deletedAt: null,
        submissions: { none: { studentId } },
      },
    });
  }

  // ─── Student Stat Counts ───────────────────────────
  async countStudentAssignmentsSubmitted(studentId: string, classIds: string[]) {
    return prisma.assignmentSubmission.count({
      where: {
        studentId,
        assignment: {
          classes: { some: { classId: { in: classIds } } },
          status: 'Published',
          deletedAt: null,
        },
      },
    });
  }

  async countStudentTotalAssignments(studentId: string, classIds: string[]) {
    return prisma.assignment.count({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deletedAt: null,
      },
    });
  }

  async countStudentMaterialsRead(studentId: string, classIds: string[]) {
    return prisma.materialRead.count({
      where: {
        studentId,
        material: {
          classes: { some: { classId: { in: classIds } } },
          status: 'Published',
          deletedAt: null,
        },
      },
    });
  }

  async countStudentTotalMaterials(studentId: string, classIds: string[]) {
    return prisma.material.count({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deletedAt: null,
      },
    });
  }

  async countStudentQuizzesDone(studentId: string, classIds: string[]) {
    return prisma.quizSubmission.count({
      where: {
        studentId,
        finishedAt: { not: null },
        quiz: {
          classes: { some: { classId: { in: classIds } } },
          status: 'Published',
          deletedAt: null,
        },
      },
    });
  }

  async countStudentTotalQuizzes(studentId: string, classIds: string[]) {
    return prisma.quiz.count({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deletedAt: null,
      },
    });
  }

  // ─── Teacher Stat Counts ───────────────────────────
  async countTeacherGradedSubmissions(teacherId: string) {
    return prisma.assignmentSubmission.count({
      where: {
        grade: { not: null },
        assignment: {
          teacherId,
          status: 'Published',
          deletedAt: null,
        },
      },
    });
  }

  async countTeacherTotalSubmissions(teacherId: string) {
    return prisma.assignmentSubmission.count({
      where: {
        assignment: {
          teacherId,
          status: 'Published',
          deletedAt: null,
        },
      },
    });
  }

  async findStudentClassIds(studentId: string) {
    const classStudents = await prisma.classStudent.findMany({
      where: { studentId, status: 'Aktif', deletedAt: null },
      select: { classId: true },
    });
    return classStudents.map((cs) => cs.classId);
  }
}

export const dashboardRepository = new DashboardRepository();
