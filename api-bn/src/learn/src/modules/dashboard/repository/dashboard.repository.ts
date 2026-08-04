import { prisma } from '#learn/database/index.js';
import { shadowSyncService } from '../../../services/shadow-sync.service.js';

async function hydrateClassNames(items: { classId: string }[]) {
  const classIds = [...new Set(items.map((c) => c.classId).filter(Boolean))];
  if (classIds.length === 0) return new Map<string, string>();
  await shadowSyncService.lazySyncAll().catch(() => {});
  const classes = await prisma.shadowClass.findMany({
    where: { id: { in: classIds }, deletedAt: null },
  });
  return new Map(classes.map((c) => [c.id, c.name]));
}

export class DashboardRepository {
  async findTeacherPendingGrading(teacherId: string) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    const assignments = await prisma.assignment.findMany({
      where: { teacherId, status: 'Published', deletedAt: null },
      include: { _count: { select: { submissions: { where: { grade: null } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const classIds = [...new Set(assignments.flatMap((a: any) => (a.classes || []).map((c: any) => c.classId)))];
    const shadowClasses = classIds.length > 0
      ? await prisma.shadowClass.findMany({ where: { id: { in: classIds }, deletedAt: null } })
      : [];
    const classMap = new Map(shadowClasses.map((c) => [c.id, c.name]));

    return assignments
      .filter((a: any) => a._count?.submissions > 0)
      .map((a: any) => {
        const classNames = (a.classes || []).map((c: any) => classMap.get(c.classId)).filter(Boolean).join(', ');
        return {
          id: a.id,
          title: a.title,
          className: classNames || 'Kelas',
          ungradedCount: a._count?.submissions ?? 0,
        };
      });
  }

  async findStudentPendingMaterials(studentId: string, classIds: string[]) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    const materials = await prisma.material.findMany({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deletedAt: null,
        reads: { none: { studentId } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const allClassIds = [...new Set(materials.flatMap((m: any) => (m.classes || []).map((c: any) => c.classId)))];
    const shadowClasses = allClassIds.length > 0
      ? await prisma.shadowClass.findMany({ where: { id: { in: allClassIds }, deletedAt: null } })
      : [];
    const classMap = new Map(shadowClasses.map((c) => [c.id, c.name]));

    return (materials as any[]).map((m) => ({
      ...m,
      classes: (m.classes || []).map((c: any) => ({
        ...c,
        class: classMap.has(c.classId) ? { id: c.classId, name: classMap.get(c.classId) } : { id: c.classId, name: 'Kelas' },
      })),
    }));
  }

  async findStudentPendingAssignments(studentId: string, classIds: string[]) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    const assignments = await prisma.assignment.findMany({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deadline: { gte: new Date() },
        deletedAt: null,
        submissions: { none: { studentId } },
      },
      orderBy: { deadline: 'asc' },
      take: 10,
    });

    const teacherIds = [...new Set((assignments as any[]).map((a: any) => a.teacherId).filter(Boolean))];
    const shadowTeachers = teacherIds.length > 0
      ? await prisma.shadowTeacher.findMany({ where: { id: { in: teacherIds }, deletedAt: null } })
      : [];
    const teacherMap = new Map(shadowTeachers.map((t) => [t.id, { id: t.id, fullname: t.fullname }]));

    const allClassIds = [...new Set(assignments.flatMap((a: any) => (a.classes || []).map((c: any) => c.classId)))];
    const shadowClasses = allClassIds.length > 0
      ? await prisma.shadowClass.findMany({ where: { id: { in: allClassIds }, deletedAt: null } })
      : [];
    const classMap = new Map(shadowClasses.map((c) => [c.id, c.name]));

    return (assignments as any[]).map((a) => ({
      ...a,
      classes: (a.classes || []).map((c: any) => ({
        ...c,
        class: classMap.has(c.classId) ? { id: c.classId, name: classMap.get(c.classId) } : { id: c.classId, name: 'Kelas' },
      })),
      teacher: teacherMap.get(a.teacherId) ?? { id: a.teacherId, fullname: '' },
    }));
  }

  async findStudentPendingQuizzes(studentId: string, classIds: string[]) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    const quizzes = await prisma.quiz.findMany({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published',
        deletedAt: null,
        submissions: { none: { studentId } },
      },
      include: { _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const teacherIds = [...new Set((quizzes as any[]).map((q: any) => q.teacherId).filter(Boolean))];
    const shadowTeachers = teacherIds.length > 0
      ? await prisma.shadowTeacher.findMany({ where: { id: { in: teacherIds }, deletedAt: null } })
      : [];
    const teacherMap = new Map(shadowTeachers.map((t) => [t.id, { id: t.id, fullname: t.fullname }]));

    const allClassIds = [...new Set(quizzes.flatMap((q: any) => (q.classes || []).map((c: any) => c.classId)))];
    const shadowClasses = allClassIds.length > 0
      ? await prisma.shadowClass.findMany({ where: { id: { in: allClassIds }, deletedAt: null } })
      : [];
    const classMap = new Map(shadowClasses.map((c) => [c.id, c.name]));

    return (quizzes as any[]).map((q) => ({
      ...q,
      classes: (q.classes || []).map((c: any) => ({
        ...c,
        class: classMap.has(c.classId) ? { id: c.classId, name: classMap.get(c.classId) } : { id: c.classId, name: 'Kelas' },
      })),
      teacher: teacherMap.get(q.teacherId) ?? { id: q.teacherId, fullname: '' },
    }));
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

  async countTeacherGradedSubmissions(teacherId: string) {
    return prisma.assignmentSubmission.count({
      where: {
        grade: { not: null },
        assignment: { teacherId, status: 'Published', deletedAt: null },
      },
    });
  }

  async countTeacherTotalSubmissions(teacherId: string) {
    return prisma.assignmentSubmission.count({
      where: {
        assignment: { teacherId, status: 'Published', deletedAt: null },
      },
    });
  }

  async findStudentClassIds(studentId: string) {
    await shadowSyncService.lazySyncAll().catch(() => {});
    const records = await prisma.shadowClassStudent.findMany({
      where: {
        studentId,
        status: 'Aktif',
        deletedAt: null,
      },
    });
    return records.map((cs) => cs.classId);
  }
}

export const dashboardRepository = new DashboardRepository();
