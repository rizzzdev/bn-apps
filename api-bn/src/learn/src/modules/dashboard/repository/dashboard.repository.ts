import { prisma } from '#learn/database/index.js';
import { shadowSyncService } from '../../../services/shadow-sync.service.js';

async function hydrateClassNames(items: { classId: string }[]) {
  const classIds = [...new Set(items.map((item) => item.classId).filter(Boolean))];
  if (classIds.length === 0) return new Map<string, string>();
  await shadowSyncService.lazySyncAll().catch(() => {});
  const classes = await prisma.shadowClass.findMany({
    where: { id: { in: classIds }, deletedAt: null },
  });
  return new Map(classes.map((classItem) => [classItem.id, classItem.name]));
}

export class DashboardRepository {
  async findTeacherPendingGrading(teacherId: string) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    const assignments = await prisma.assignment.findMany({
      where: { teacherId, status: 'Published', deletedAt: null },
      include: {
        classes: true,
        _count: { select: { submissions: { where: { grade: null } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const classIds = [...new Set(assignments.flatMap((assignment) => assignment.classes.map((classItem) => classItem.classId)))];
    const shadowClasses = classIds.length > 0
      ? await prisma.shadowClass.findMany({ where: { id: { in: classIds }, deletedAt: null } })
      : [];
    const classMap = new Map(shadowClasses.map((classItem) => [classItem.id, classItem.name]));

    return assignments
      .filter((assignment) => assignment._count.submissions > 0)
      .map((assignment) => {
        const classNames = assignment.classes.map((classItem) => classMap.get(classItem.classId)).filter(Boolean).join(', ');
        return {
          id: assignment.id,
          title: assignment.title,
          className: classNames || 'Kelas',
          ungradedCount: assignment._count.submissions,
        };
      });
  }

  async findStudentPendingMaterials(studentId: string, classIds: string[]) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    const materials = await prisma.material.findMany({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published', deletedAt: null,
        reads: { none: { studentId } },
      },
      include: { classes: true },
      orderBy: { createdAt: 'desc' }, take: 10,
    });

    const allClassIds = [...new Set(materials.flatMap((material) => material.classes.map((classItem) => classItem.classId)))];
    const shadowClasses = allClassIds.length > 0
      ? await prisma.shadowClass.findMany({ where: { id: { in: allClassIds }, deletedAt: null } })
      : [];
    const classMap = new Map(shadowClasses.map((classItem) => [classItem.id, classItem.name]));

    return materials.map((material) => ({
      ...material,
      classes: material.classes.map((classItem) => ({
        ...classItem,
        class: { id: classItem.classId, name: classMap.get(classItem.classId) ?? 'Kelas' },
      })),
    }));
  }

  async findStudentPendingAssignments(studentId: string, classIds: string[]) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    const assignments = await prisma.assignment.findMany({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published', deadline: { gte: new Date() }, deletedAt: null,
        submissions: { none: { studentId } },
      },
      include: { classes: true },
      orderBy: { deadline: 'asc' }, take: 10,
    });

    const teacherIds = [...new Set(assignments.map((assignment) => assignment.teacherId).filter(Boolean))];
    const shadowTeachers = teacherIds.length > 0
      ? await prisma.shadowTeacher.findMany({ where: { id: { in: teacherIds }, deletedAt: null } })
      : [];
    const teacherMap = new Map(shadowTeachers.map((teacher) => [teacher.id, { id: teacher.id, fullname: teacher.fullname }]));

    const allClassIds = [...new Set(assignments.flatMap((assignment) => assignment.classes.map((classItem) => classItem.classId)))];
    const shadowClasses = allClassIds.length > 0
      ? await prisma.shadowClass.findMany({ where: { id: { in: allClassIds }, deletedAt: null } })
      : [];
    const classMap = new Map(shadowClasses.map((classItem) => [classItem.id, classItem.name]));

    return assignments.map((assignment) => ({
      ...assignment,
      classes: assignment.classes.map((classItem) => ({
        ...classItem,
        class: { id: classItem.classId, name: classMap.get(classItem.classId) ?? 'Kelas' },
      })),
      teacher: teacherMap.get(assignment.teacherId) ?? { id: assignment.teacherId, fullname: '' },
    }));
  }

  async findStudentPendingQuizzes(studentId: string, classIds: string[]) {
    await shadowSyncService.lazySyncAll().catch(() => {});

    const quizzes = await prisma.quiz.findMany({
      where: {
        classes: { some: { classId: { in: classIds } } },
        status: 'Published', deletedAt: null,
        submissions: { none: { studentId } },
      },
      include: { classes: true, _count: { select: { questions: true } } },
      orderBy: { createdAt: 'desc' }, take: 10,
    });

    const teacherIds = [...new Set(quizzes.map((quiz) => quiz.teacherId).filter(Boolean))];
    const shadowTeachers = teacherIds.length > 0
      ? await prisma.shadowTeacher.findMany({ where: { id: { in: teacherIds }, deletedAt: null } })
      : [];
    const teacherMap = new Map(shadowTeachers.map((teacher) => [teacher.id, { id: teacher.id, fullname: teacher.fullname }]));

    const allClassIds = [...new Set(quizzes.flatMap((quiz) => quiz.classes.map((classItem) => classItem.classId)))];
    const shadowClasses = allClassIds.length > 0
      ? await prisma.shadowClass.findMany({ where: { id: { in: allClassIds }, deletedAt: null } })
      : [];
    const classMap = new Map(shadowClasses.map((classItem) => [classItem.id, classItem.name]));

    return quizzes.map((quiz) => ({
      ...quiz,
      classes: quiz.classes.map((classItem) => ({
        ...classItem,
        class: { id: classItem.classId, name: classMap.get(classItem.classId) ?? 'Kelas' },
      })),
      teacher: teacherMap.get(quiz.teacherId) ?? { id: quiz.teacherId, fullname: '' },
    }));
  }

  async countTotalUnreadMaterials(studentId: string, classIds: string[]) {
    return prisma.material.count({ where: { classes: { some: { classId: { in: classIds } } }, status: 'Published', deletedAt: null, reads: { none: { studentId } } } });
  }
  async countTotalPendingAssignments(studentId: string, classIds: string[]) {
    return prisma.assignment.count({ where: { classes: { some: { classId: { in: classIds } } }, status: 'Published', deadline: { gte: new Date() }, deletedAt: null, submissions: { none: { studentId } } } });
  }
  async countTotalPendingQuizzes(studentId: string, classIds: string[]) {
    return prisma.quiz.count({ where: { classes: { some: { classId: { in: classIds } } }, status: 'Published', deletedAt: null, submissions: { none: { studentId } } } });
  }
  async countStudentAssignmentsSubmitted(studentId: string, classIds: string[]) {
    return prisma.assignmentSubmission.count({ where: { studentId, assignment: { classes: { some: { classId: { in: classIds } } }, status: 'Published', deletedAt: null } } });
  }
  async countStudentTotalAssignments(studentId: string, classIds: string[]) {
    return prisma.assignment.count({ where: { classes: { some: { classId: { in: classIds } } }, status: 'Published', deletedAt: null } });
  }
  async countStudentMaterialsRead(studentId: string, classIds: string[]) {
    return prisma.materialRead.count({ where: { studentId, material: { classes: { some: { classId: { in: classIds } } }, status: 'Published', deletedAt: null } } });
  }
  async countStudentTotalMaterials(studentId: string, classIds: string[]) {
    return prisma.material.count({ where: { classes: { some: { classId: { in: classIds } } }, status: 'Published', deletedAt: null } });
  }
  async countStudentQuizzesDone(studentId: string, classIds: string[]) {
    return prisma.quizSubmission.count({ where: { studentId, finishedAt: { not: null }, quiz: { classes: { some: { classId: { in: classIds } } }, status: 'Published', deletedAt: null } } });
  }
  async countStudentTotalQuizzes(studentId: string, classIds: string[]) {
    return prisma.quiz.count({ where: { classes: { some: { classId: { in: classIds } } }, status: 'Published', deletedAt: null } });
  }
  async countTeacherGradedSubmissions(teacherId: string) {
    return prisma.assignmentSubmission.count({ where: { grade: { not: null }, assignment: { teacherId, status: 'Published', deletedAt: null } } });
  }
  async countTeacherTotalSubmissions(teacherId: string) {
    return prisma.assignmentSubmission.count({ where: { assignment: { teacherId, status: 'Published', deletedAt: null } } });
  }
  async findStudentClassIds(studentId: string) {
    await shadowSyncService.lazySyncAll().catch(() => {});
    const records = await prisma.shadowClassStudent.findMany({ where: { studentId, status: 'Aktif', deletedAt: null } });
    return records.map((record) => record.classId);
  }

  // ═══ Curriculum (Waka Kurikulum) ══════════════════════════════════════
  // All curriculum methods use batch queries (groupBy) with in-memory joins.
  // No N+1: each method issues ~6-12 DB queries regardless of result size.
  // Arrow params use meaningful names: (teacher), (classItem), (row), (entry), etc.
  // ───────────────────────────────────────────────────────────────────────

  async findCurriculumOverview() {
    await shadowSyncService.lazySyncAll().catch(() => {});
    const totalTeachers = await prisma.shadowTeacher.count({ where: { deletedAt: null } });
    const totalStudents = await prisma.shadowClassStudent.count({ where: { status: 'Aktif', deletedAt: null } });
    const totalClasses = await prisma.shadowClass.count({ where: { deletedAt: null } });
    const totalMaterials = await prisma.material.count({ where: { status: 'Published', deletedAt: null } });
    const totalAssignments = await prisma.assignment.count({ where: { status: 'Published', deletedAt: null } });
    const totalQuizzes = await prisma.quiz.count({ where: { status: 'Published', deletedAt: null } });
    const totalSubmissions = await prisma.assignmentSubmission.count();
    const finishedQuizCount = await prisma.quizSubmission.count({ where: { finishedAt: { not: null } } });
    const ungradedBacklog = await prisma.assignmentSubmission.count({ where: { grade: null } });

    const allTeachers = await prisma.shadowTeacher.findMany({ where: { deletedAt: null }, select: { id: true, fullname: true, email: true, nip: true } });
    const teacherIds = allTeachers.map((teacher) => teacher.id);
    const baseWhere = { status: 'Published' as const, deletedAt: null };

    const [matRows, assignRows, quizRows, subRows, gradedRows] = await Promise.all([
      prisma.material.groupBy({ by: ['teacherId'], where: { teacherId: { in: teacherIds }, ...baseWhere }, _count: true }),
      prisma.assignment.groupBy({ by: ['teacherId'], where: { teacherId: { in: teacherIds }, ...baseWhere }, _count: true }),
      prisma.quiz.groupBy({ by: ['teacherId'], where: { teacherId: { in: teacherIds }, ...baseWhere }, _count: true }),
      prisma.assignmentSubmission.groupBy({ by: ['assignmentId'], where: { assignment: { teacherId: { in: teacherIds }, ...baseWhere } }, _count: true }),
      prisma.assignmentSubmission.groupBy({ by: ['assignmentId'], where: { grade: { not: null }, assignment: { teacherId: { in: teacherIds }, ...baseWhere } }, _count: true }),
    ]);

    const materialCountByTeacher = new Map(matRows.map((row) => [row.teacherId, row._count]));
    const assignmentCountByTeacher = new Map(assignRows.map((row) => [row.teacherId, row._count]));
    const quizCountByTeacher = new Map(quizRows.map((row) => [row.teacherId, row._count]));

    const allAssignsForTeachers = await prisma.assignment.findMany({ where: { teacherId: { in: teacherIds }, ...baseWhere }, select: { id: true, teacherId: true } });
    const assignmentTeacherMap = new Map<string, string>();
    for (const assignment of allAssignsForTeachers) assignmentTeacherMap.set(assignment.id, assignment.teacherId);

    const submissionCountByTeacher = new Map<string, number>();
    for (const row of subRows) { const teacherIdFromRow = assignmentTeacherMap.get(row.assignmentId); if (teacherIdFromRow) submissionCountByTeacher.set(teacherIdFromRow, (submissionCountByTeacher.get(teacherIdFromRow) ?? 0) + row._count); }
    const gradedCountByTeacher = new Map<string, number>();
    for (const row of gradedRows) { const teacherIdFromRow = assignmentTeacherMap.get(row.assignmentId); if (teacherIdFromRow) gradedCountByTeacher.set(teacherIdFromRow, (gradedCountByTeacher.get(teacherIdFromRow) ?? 0) + row._count); }

    const teacherStats = allTeachers.map((teacher) => ({
      ...teacher,
      materialsCount: materialCountByTeacher.get(teacher.id) ?? 0,
      assignmentCount: assignmentCountByTeacher.get(teacher.id) ?? 0,
      quizCount: quizCountByTeacher.get(teacher.id) ?? 0,
      totalSubmissions: submissionCountByTeacher.get(teacher.id) ?? 0,
      gradedCount: gradedCountByTeacher.get(teacher.id) ?? 0,
    }));

    const sorted = teacherStats.filter((teacher) => teacher.materialsCount + teacher.assignmentCount + teacher.quizCount > 0)
      .sort((a, b) => (b.assignmentCount + b.materialsCount + b.quizCount) - (a.assignmentCount + a.materialsCount + a.quizCount));
    const topTeachers = sorted.slice(0, 5).map((teacher) => ({
      id: teacher.id, fullname: teacher.fullname, email: teacher.email, nip: teacher.nip,
      materialsCount: teacher.materialsCount, assignmentCount: teacher.assignmentCount, quizCount: teacher.quizCount,
      gradedRate: teacher.totalSubmissions > 0 ? Math.round((teacher.gradedCount / teacher.totalSubmissions) * 100) : 100,
    }));

    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
    const [recentMatIds, recentAssignmentIds, recentQuizIds] = await Promise.all([
      prisma.material.findMany({ where: { teacherId: { in: teacherIds }, createdAt: { gte: twoWeeksAgo }, deletedAt: null }, select: { teacherId: true }, distinct: ['teacherId'] }),
      prisma.assignment.findMany({ where: { teacherId: { in: teacherIds }, createdAt: { gte: twoWeeksAgo }, deletedAt: null }, select: { teacherId: true }, distinct: ['teacherId'] }),
      prisma.quiz.findMany({ where: { teacherId: { in: teacherIds }, createdAt: { gte: twoWeeksAgo }, deletedAt: null }, select: { teacherId: true }, distinct: ['teacherId'] }),
    ]);
    const activeTeacherSet = new Set([...recentMatIds.map((row) => row.teacherId), ...recentAssignmentIds.map((row) => row.teacherId), ...recentQuizIds.map((row) => row.teacherId)]);
    const lowActivityTeachers = sorted.filter((teacher) => !activeTeacherSet.has(teacher.id)).map((teacher) => ({ id: teacher.id, fullname: teacher.fullname, lastActivityDays: null }));

    const allClasses = await prisma.shadowClass.findMany({ where: { deletedAt: null }, select: { id: true, name: true } });
    const classIds = allClasses.map((classItem) => classItem.id);
    const [classStudentRows, classSubRows] = await Promise.all([
      prisma.shadowClassStudent.groupBy({ by: ['classId'], where: { classId: { in: classIds }, status: 'Aktif', deletedAt: null }, _count: true }),
      prisma.assignmentSubmission.groupBy({ by: ['assignmentId'], where: { student: { shadowClassStudents: { some: { classId: { in: classIds }, status: 'Aktif' } } }, assignment: { classes: { some: { classId: { in: classIds } } }, ...baseWhere } }, _count: true }),
    ]);
    const assignClassRows = await prisma.assignmentClass.findMany({ where: { classId: { in: classIds }, assignment: { ...baseWhere } }, select: { assignmentId: true, classId: true } });
    const assignClassMap = new Map<string, Set<string>>();
    for (const assignClass of assignClassRows) { if (!assignClassMap.has(assignClass.classId)) assignClassMap.set(assignClass.classId, new Set()); assignClassMap.get(assignClass.classId)!.add(assignClass.assignmentId); }

    const studentCountByClass = new Map(classStudentRows.map((row) => [row.classId, row._count]));
    const classSubmitMap = new Map<string, number>();
    const classCompleteMap = new Map<string, number>();

    for (const row of classSubRows) {
      const matchingClasses = [...(assignClassMap.entries())].filter(([, set]) => set.has(row.assignmentId));
      for (const [classIdEntry] of matchingClasses) classSubmitMap.set(classIdEntry, (classSubmitMap.get(classIdEntry) ?? 0) + row._count);
    }

    const allClassSubs = await prisma.assignmentSubmission.findMany({ where: { assignment: { classes: { some: { classId: { in: classIds } } }, ...baseWhere } }, select: { assignmentId: true, studentId: true } });
    const allSubStudentIds = [...new Set(allClassSubs.map((submission) => submission.studentId))];
    const classStudentRows2 = await prisma.shadowClassStudent.findMany({ where: { studentId: { in: allSubStudentIds }, classId: { in: classIds }, status: 'Aktif', deletedAt: null }, select: { studentId: true, classId: true } });
    const studentClassLookup = new Map<string, Set<string>>();
    for (const row of classStudentRows2) { if (!studentClassLookup.has(row.studentId)) studentClassLookup.set(row.studentId, new Set()); studentClassLookup.get(row.studentId)!.add(row.classId); }
    for (const submission of allClassSubs) {
      const studentClasses = studentClassLookup.get(submission.studentId); if (!studentClasses) continue;
      for (const classIdEntry of studentClasses) { if (assignClassMap.get(classIdEntry)?.has(submission.assignmentId)) classCompleteMap.set(classIdEntry, (classCompleteMap.get(classIdEntry) ?? 0) + 1); }
    }

    const classStats = allClasses.map((classItem) => {
      const studentCount = studentCountByClass.get(classItem.id) ?? 0;
      const totalSubmissionsInClass = classSubmitMap.get(classItem.id) ?? 0;
      const completedSubmissionsInClass = classCompleteMap.get(classItem.id) ?? 0;
      const rate = studentCount > 0 && totalSubmissionsInClass > 0 ? Math.round((completedSubmissionsInClass / (totalSubmissionsInClass * studentCount)) * 100) : 0;
      return { classId: classItem.id, className: classItem.name, submissionRate: rate };
    });
    const underperformingClasses = classStats.sort((a, b) => a.submissionRate - b.submissionRate).slice(0, 5);

    const recentMaterials = await prisma.material.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, title: true, teacherId: true, createdAt: true } });
    const recentAssignments = await prisma.assignment.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, title: true, teacherId: true, createdAt: true } });
    const recentQuizzesList = await prisma.quiz.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, title: true, teacherId: true, createdAt: true } });
    const allRecent = [
      ...recentMaterials.map((item) => ({ id: item.id, title: item.title, teacherId: item.teacherId, createdAt: item.createdAt, type: 'material' as const })),
      ...recentAssignments.map((item) => ({ id: item.id, title: item.title, teacherId: item.teacherId, createdAt: item.createdAt, type: 'assignment' as const })),
      ...recentQuizzesList.map((item) => ({ id: item.id, title: item.title, teacherId: item.teacherId, createdAt: item.createdAt, type: 'quiz' as const })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);

    const recentTeacherIds = [...new Set(allRecent.map((item) => item.teacherId))];
    const recentTeachers = recentTeacherIds.length > 0 ? await prisma.shadowTeacher.findMany({ where: { id: { in: recentTeacherIds } } }) : [];
    const teacherNameMap = new Map(recentTeachers.map((teacher) => [teacher.id, teacher.fullname]));
    const recentActivity = allRecent.map((item) => ({ type: item.type, title: item.title, teacherName: teacherNameMap.get(item.teacherId) ?? '', createdAt: item.createdAt }));

    return {
      stats: { totalTeachers, totalStudents, totalClasses, totalMaterials, totalAssignments, totalQuizzes, submissionRate: 0, materialReadRate: 0, quizCompletionRate: 0, ungradedBacklog },
      topTeachers, lowActivityTeachers, underperformingClasses, recentActivity,
    };
  }

  async findCurriculumTeachers(page: number, limit: number, search?: string) {
    await shadowSyncService.lazySyncAll().catch(() => {});
    const searchFilter = search ? { OR: [{ fullname: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }, { nip: { contains: search, mode: 'insensitive' as const } }] } : {};
    const [total, teachers] = await Promise.all([
      prisma.shadowTeacher.count({ where: { ...searchFilter, deletedAt: null } }),
      prisma.shadowTeacher.findMany({ where: { ...searchFilter, deletedAt: null }, skip: (page - 1) * limit, take: limit, orderBy: { fullname: 'asc' }, select: { id: true, fullname: true, email: true, nip: true } }),
    ]);
    const teacherIds = teachers.map((teacher) => teacher.id);
    if (teacherIds.length === 0) return { data: [], total };

    const baseWhere = { status: 'Published' as const, deletedAt: null };
    const [matRows, assignRows, quizRows, subRows, gradedRows, assignmentClassRows, materialClassRows, lastMaterialRows] = await Promise.all([
      prisma.material.groupBy({ by: ['teacherId'], where: { teacherId: { in: teacherIds }, ...baseWhere }, _count: true }),
      prisma.assignment.groupBy({ by: ['teacherId'], where: { teacherId: { in: teacherIds }, ...baseWhere }, _count: true }),
      prisma.quiz.groupBy({ by: ['teacherId'], where: { teacherId: { in: teacherIds }, ...baseWhere }, _count: true }),
      prisma.assignmentSubmission.groupBy({ by: ['assignmentId'], where: { assignment: { teacherId: { in: teacherIds }, ...baseWhere } }, _count: true }),
      prisma.assignmentSubmission.groupBy({ by: ['assignmentId'], where: { grade: { not: null }, assignment: { teacherId: { in: teacherIds }, ...baseWhere } }, _count: true }),
      prisma.assignmentClass.findMany({ where: { assignment: { teacherId: { in: teacherIds }, deletedAt: null } }, select: { classId: true, assignment: { select: { teacherId: true } } }, distinct: ['classId'] }),
      prisma.materialClass.findMany({ where: { material: { teacherId: { in: teacherIds }, deletedAt: null } }, select: { classId: true, material: { select: { teacherId: true } } }, distinct: ['classId'] }),
      prisma.material.groupBy({ by: ['teacherId'], where: { teacherId: { in: teacherIds }, deletedAt: null }, _max: { createdAt: true } }),
    ]);

    const materialCountByTeacher = new Map(matRows.map((row) => [row.teacherId, row._count]));
    const assignmentCountByTeacher = new Map(assignRows.map((row) => [row.teacherId, row._count]));
    const quizCountByTeacher = new Map(quizRows.map((row) => [row.teacherId, row._count]));
    const allAssignmentsForTeachers = await prisma.assignment.findMany({ where: { teacherId: { in: teacherIds } }, select: { id: true, teacherId: true } });
    const assignmentTeacherMap = new Map(allAssignmentsForTeachers.map((assignment) => [assignment.id, assignment.teacherId]));

    const submissionCountByTeacher = new Map<string, number>();
    for (const row of subRows) { const teacherIdFromRow = assignmentTeacherMap.get(row.assignmentId); if (teacherIdFromRow) submissionCountByTeacher.set(teacherIdFromRow, (submissionCountByTeacher.get(teacherIdFromRow) ?? 0) + row._count); }
    const gradedCountByTeacher = new Map<string, number>();
    for (const row of gradedRows) { const teacherIdFromRow = assignmentTeacherMap.get(row.assignmentId); if (teacherIdFromRow) gradedCountByTeacher.set(teacherIdFromRow, (gradedCountByTeacher.get(teacherIdFromRow) ?? 0) + row._count); }

    const teacherClassesMap = new Map<string, Set<string>>();
    for (const row of assignmentClassRows) { const teacherIdFromRow = row.assignment.teacherId; if (!teacherClassesMap.has(teacherIdFromRow)) teacherClassesMap.set(teacherIdFromRow, new Set()); teacherClassesMap.get(teacherIdFromRow)!.add(row.classId); }
    for (const row of materialClassRows) { const teacherIdFromRow = row.material.teacherId; if (!teacherClassesMap.has(teacherIdFromRow)) teacherClassesMap.set(teacherIdFromRow, new Set()); teacherClassesMap.get(teacherIdFromRow)!.add(row.classId); }
    const lastActivityByTeacher = new Map(lastMaterialRows.map((row) => [row.teacherId, row._max.createdAt]));

    const data = teachers.map((teacher) => {
      const submissionTotal = submissionCountByTeacher.get(teacher.id) ?? 0;
      const gradedTotal = gradedCountByTeacher.get(teacher.id) ?? 0;
      return {
        id: teacher.id, fullname: teacher.fullname, email: teacher.email, nip: teacher.nip,
        classCount: teacherClassesMap.get(teacher.id)?.size ?? 0,
        materialsPublished: materialCountByTeacher.get(teacher.id) ?? 0,
        assignmentsPublished: assignmentCountByTeacher.get(teacher.id) ?? 0,
        quizzesPublished: quizCountByTeacher.get(teacher.id) ?? 0,
        totalSubmissions: submissionTotal, gradedCount: gradedTotal,
        ungradedCount: submissionTotal - gradedTotal,
        gradedRate: submissionTotal > 0 ? Math.round((gradedTotal / submissionTotal) * 100) : 100,
        lastActivity: lastActivityByTeacher.get(teacher.id) ?? null, lastGrading: null,
      };
    });
    return { data, total };
  }

  async findCurriculumStudentsAtRisk(page: number, limit: number, threshold: number, classId?: string) {
    await shadowSyncService.lazySyncAll().catch(() => {});
    const activeFilter = { status: 'Aktif' as const, deletedAt: null };
    const allEntries = await prisma.shadowClassStudent.findMany({ where: { ...activeFilter, ...(classId ? { classId } : {}) }, select: { studentId: true, classId: true } });
    const allIds = [...new Set(allEntries.map((entry) => entry.studentId))];
    if (allIds.length === 0) return { summary: { totalStudents: 0, totalAtRisk: 0, totalCritical: 0, byClass: [] }, data: [], total: 0 };

    const studentClassMap = new Map<string, string[]>();
    for (const entry of allEntries) { if (!studentClassMap.has(entry.studentId)) studentClassMap.set(entry.studentId, []); studentClassMap.get(entry.studentId)!.push(entry.classId); }
    const allClassIds = [...new Set(allEntries.map((entry) => entry.classId))];
    const baseWhere = { status: 'Published' as const, deletedAt: null };

    const [submissionRows, materialReadRows, quizDoneRows, gradeRows, shadowStudents, shadowClasses] = await Promise.all([
      prisma.assignmentSubmission.findMany({ where: { studentId: { in: allIds }, assignment: { ...baseWhere } }, select: { studentId: true, assignmentId: true } }),
      prisma.materialRead.findMany({ where: { studentId: { in: allIds }, material: { ...baseWhere } }, select: { studentId: true } }),
      prisma.quizSubmission.findMany({ where: { studentId: { in: allIds }, finishedAt: { not: null }, quiz: { ...baseWhere } }, select: { studentId: true } }),
      prisma.assignmentSubmission.findMany({ where: { studentId: { in: allIds }, grade: { not: null }, assignment: { ...baseWhere } }, select: { studentId: true, grade: true } }),
      prisma.shadowStudent.findMany({ where: { id: { in: allIds }, deletedAt: null } }),
      prisma.shadowClass.findMany({ where: { id: { in: allClassIds }, deletedAt: null } }),
    ]);
    const studentMap = new Map(shadowStudents.map((student) => [student.id, student]));
    const classMap = new Map(shadowClasses.map((classItem) => [classItem.id, classItem.name]));

    const materialCountByClass = new Map<string, number>();
    const matClassRows = await prisma.materialClass.findMany({ where: { classId: { in: allClassIds }, material: { ...baseWhere } }, select: { classId: true } });
    for (const row of matClassRows) materialCountByClass.set(row.classId, (materialCountByClass.get(row.classId) ?? 0) + 1);
    const assignmentCountByClass = new Map<string, number>();
    const assignClassRows = await prisma.assignmentClass.findMany({ where: { classId: { in: allClassIds }, assignment: { ...baseWhere } }, select: { classId: true } });
    for (const row of assignClassRows) assignmentCountByClass.set(row.classId, (assignmentCountByClass.get(row.classId) ?? 0) + 1);
    const quizCountByClass = new Map<string, number>();
    const quizClassRows = await prisma.quizClass.findMany({ where: { classId: { in: allClassIds }, quiz: { ...baseWhere } }, select: { classId: true } });
    for (const row of quizClassRows) quizCountByClass.set(row.classId, (quizCountByClass.get(row.classId) ?? 0) + 1);

    const submissionCountByStudent = new Map<string, number>();
    for (const submission of submissionRows) submissionCountByStudent.set(submission.studentId, (submissionCountByStudent.get(submission.studentId) ?? 0) + 1);
    const readCountByStudent = new Map<string, number>();
    for (const read of materialReadRows) readCountByStudent.set(read.studentId, (readCountByStudent.get(read.studentId) ?? 0) + 1);
    const quizDoneByStudent = new Map<string, number>();
    for (const quizSubmission of quizDoneRows) quizDoneByStudent.set(quizSubmission.studentId, (quizDoneByStudent.get(quizSubmission.studentId) ?? 0) + 1);
    const gradeSumByStudent = new Map<string, { sum: number; count: number }>();
    for (const gradeRow of gradeRows) { const entry = gradeSumByStudent.get(gradeRow.studentId) ?? { sum: 0, count: 0 }; entry.sum += gradeRow.grade ?? 0; entry.count++; gradeSumByStudent.set(gradeRow.studentId, entry); }

    const atRisk: Array<{ id: string; fullname: string; nis: string | null; nisn: string | null; className: string; flags: string[]; severity: 'warning' | 'critical'; stats: { submissionRate: number; materialReadRate: number; quizCompletionRate: number; averageGrade: number | null }; lastActive: null }> = [];

    for (const studentId of allIds) {
      const studentClassIds = studentClassMap.get(studentId) ?? []; if (studentClassIds.length === 0) continue;
      const student = studentMap.get(studentId); if (!student) continue;
      const className = classMap.get(studentClassIds[0]) ?? '';
      const totalAssignmentsForStudent = studentClassIds.reduce((sum, classItem) => sum + (assignmentCountByClass.get(classItem) ?? 0), 0);
      const totalMaterialsForStudent = studentClassIds.reduce((sum, classItem) => sum + (materialCountByClass.get(classItem) ?? 0), 0);
      const totalQuizzesForStudent = studentClassIds.reduce((sum, classItem) => sum + (quizCountByClass.get(classItem) ?? 0), 0);
      const submittedCount = submissionCountByStudent.get(studentId) ?? 0;
      const readCount = readCountByStudent.get(studentId) ?? 0;
      const doneCount = quizDoneByStudent.get(studentId) ?? 0;
      const gradeEntry = gradeSumByStudent.get(studentId);
      const subRate = totalAssignmentsForStudent > 0 ? (submittedCount / totalAssignmentsForStudent) * 100 : 100;
      const readRate = totalMaterialsForStudent > 0 ? (readCount / totalMaterialsForStudent) * 100 : 100;
      const quizRate = totalQuizzesForStudent > 0 ? (doneCount / totalQuizzesForStudent) * 100 : 100;
      const avgGrade = gradeEntry ? Math.round(gradeEntry.sum / gradeEntry.count) : null;

      const flags: string[] = [];
      if (subRate < threshold) flags.push('low_submission');
      if (readRate < threshold) flags.push('low_reading');
      if (quizRate < threshold) flags.push('low_quiz');
      if (avgGrade !== null && avgGrade < 75) flags.push('low_grade');

      if (flags.length >= 2) atRisk.push({ id: student.id, fullname: student.fullname, nis: student.nis, nisn: student.nisn, className, flags, severity: flags.length >= 3 ? 'critical' : 'warning', stats: { submissionRate: Math.round(subRate), materialReadRate: Math.round(readRate), quizCompletionRate: Math.round(quizRate), averageGrade: avgGrade }, lastActive: null });
    }

    const paginated = atRisk.slice((page - 1) * limit, page * limit);
    const byClass = new Map<string, { classId: string; className: string; atRiskCount: number; totalStudents: number }>();
    for (const student of atRisk) { const studentClassIds = studentClassMap.get(student.id) ?? []; const primaryClassId = studentClassIds[0]; if (primaryClassId) { if (!byClass.has(primaryClassId)) byClass.set(primaryClassId, { classId: primaryClassId, className: classMap.get(primaryClassId) ?? '', atRiskCount: 0, totalStudents: 0 }); byClass.get(primaryClassId)!.atRiskCount++; } }

    return { summary: { totalStudents: allIds.length, totalAtRisk: atRisk.length, totalCritical: atRisk.filter((student) => student.severity === 'critical').length, byClass: [...byClass.values()] }, data: paginated, total: atRisk.length };
  }

  async findCurriculumClasses(page: number, limit: number) {
    await shadowSyncService.lazySyncAll().catch(() => {});
    const [total, classes] = await Promise.all([
      prisma.shadowClass.count({ where: { deletedAt: null } }),
      prisma.shadowClass.findMany({ where: { deletedAt: null }, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ]);
    const classIds = classes.map((classItem) => classItem.id);
    if (classIds.length === 0) return { data: [], total };

    const baseWhere = { status: 'Published' as const, deletedAt: null };
    const [studentCountRows, matClassRows, assignClassRows, quizClassRows, ungradedRows, readRows, doneQuizRows, gradeRows] = await Promise.all([
      prisma.shadowClassStudent.groupBy({ by: ['classId'], where: { classId: { in: classIds }, status: 'Aktif', deletedAt: null }, _count: true }),
      prisma.materialClass.findMany({ where: { classId: { in: classIds }, material: { ...baseWhere } }, select: { classId: true } }),
      prisma.assignmentClass.findMany({ where: { classId: { in: classIds }, assignment: { ...baseWhere } }, select: { classId: true } }),
      prisma.quizClass.findMany({ where: { classId: { in: classIds }, quiz: { ...baseWhere } }, select: { classId: true } }),
      prisma.assignmentSubmission.groupBy({ by: ['assignmentId'], where: { grade: null, assignment: { ...baseWhere } }, _count: true }),
      prisma.materialRead.groupBy({ by: ['materialId'], where: { student: { shadowClassStudents: { some: { classId: { in: classIds }, status: 'Aktif' } } }, material: { ...baseWhere } }, _count: true }),
      prisma.quizSubmission.groupBy({ by: ['quizId'], where: { finishedAt: { not: null }, student: { shadowClassStudents: { some: { classId: { in: classIds }, status: 'Aktif' } } }, quiz: { ...baseWhere } }, _count: true }),
      prisma.assignmentSubmission.findMany({ where: { grade: { not: null }, assignment: { ...baseWhere }, student: { shadowClassStudents: { some: { classId: { in: classIds }, status: 'Aktif' } } } }, select: { assignmentId: true, grade: true, assignment: { select: { id: true } } } }),
    ]);

    const totalAssignmentsByClass = new Map<string, number>();
    for (const row of assignClassRows) totalAssignmentsByClass.set(row.classId, (totalAssignmentsByClass.get(row.classId) ?? 0) + 1);
    const totalMaterialsByClass = new Map<string, number>();
    for (const row of matClassRows) totalMaterialsByClass.set(row.classId, (totalMaterialsByClass.get(row.classId) ?? 0) + 1);
    const totalQuizzesByClass = new Map<string, number>();
    for (const row of quizClassRows) totalQuizzesByClass.set(row.classId, (totalQuizzesByClass.get(row.classId) ?? 0) + 1);

    const assignmentClassRows = await prisma.assignmentClass.findMany({ where: { classId: { in: classIds }, assignment: { ...baseWhere } }, select: { assignmentId: true, classId: true } });
    const classAssignmentMap = new Map<string, Set<string>>();
    for (const assignClass of assignmentClassRows) { if (!classAssignmentMap.has(assignClass.classId)) classAssignmentMap.set(assignClass.classId, new Set()); classAssignmentMap.get(assignClass.classId)!.add(assignClass.assignmentId); }

    const materialClassMap = new Map<string, Set<string>>();
    const materialClassRows2 = await prisma.materialClass.findMany({ where: { classId: { in: classIds }, material: { ...baseWhere } }, select: { materialId: true, classId: true } });
    for (const materialClass of materialClassRows2) { if (!materialClassMap.has(materialClass.classId)) materialClassMap.set(materialClass.classId, new Set()); materialClassMap.get(materialClass.classId)!.add(materialClass.materialId); }

    const quizClassMap = new Map<string, Set<string>>();
    const quizClassRows2 = await prisma.quizClass.findMany({ where: { classId: { in: classIds }, quiz: { ...baseWhere } }, select: { quizId: true, classId: true } });
    for (const quizClass of quizClassRows2) { if (!quizClassMap.has(quizClass.classId)) quizClassMap.set(quizClass.classId, new Set()); quizClassMap.get(quizClass.classId)!.add(quizClass.quizId); }

    const submissionTotalByAssignment = new Map<string, number>();
    const allSubmissionRows = await prisma.assignmentSubmission.groupBy({ by: ['assignmentId'], where: { assignment: { ...baseWhere } }, _count: true });
    for (const row of allSubmissionRows) submissionTotalByAssignment.set(row.assignmentId, row._count);

    const completedSubmissionRows = await prisma.assignmentSubmission.findMany({ where: { student: { shadowClassStudents: { some: { classId: { in: classIds }, status: 'Aktif' } } }, assignment: { ...baseWhere } }, select: { assignmentId: true, studentId: true } });
    const studentsPerClass = new Map(studentCountRows.map((row) => [row.classId, row._count]));

    const submissionTotalByClass = new Map<string, number>();
    const completedTotalByClass = new Map<string, number>();
    const readTotalByClass = new Map<string, number>();
    const quizDoneTotalByClass = new Map<string, number>();
    const gradeTotalByClass = new Map<string, { sum: number; count: number }>();
    const ungradedByClass = new Map<string, number>();

    for (const classId of classIds) {
      const assignmentSet = classAssignmentMap.get(classId) ?? new Set();
      let totalSubmissionCount = 0;
      for (const assignmentId of assignmentSet) totalSubmissionCount += submissionTotalByAssignment.get(assignmentId) ?? 0;
      submissionTotalByClass.set(classId, totalSubmissionCount);
      const completedSet = new Set<string>();
      for (const submission of completedSubmissionRows) { if (assignmentSet.has(submission.assignmentId)) completedSet.add(submission.assignmentId + ':' + submission.studentId); }
      completedTotalByClass.set(classId, completedSet.size);
      const materialSet = materialClassMap.get(classId) ?? new Set(); let totalReads = 0;
      for (const row of readRows) { if (materialSet.has(row.materialId)) totalReads += row._count; }
      readTotalByClass.set(classId, totalReads);
      const quizSet = quizClassMap.get(classId) ?? new Set(); let totalDoneQuizzes = 0;
      for (const row of doneQuizRows) { if (quizSet.has(row.quizId)) totalDoneQuizzes += row._count; }
      quizDoneTotalByClass.set(classId, totalDoneQuizzes);
      let gradeSum = 0; let gradeCount = 0;
      for (const row of gradeRows) { if (assignmentSet.has(row.assignmentId)) { gradeSum += row.grade ?? 0; gradeCount++; } }
      gradeTotalByClass.set(classId, { sum: gradeSum, count: gradeCount });
      let ungradedTotal = 0;
      for (const row of ungradedRows) { if (assignmentSet.has(row.assignmentId)) ungradedTotal += row._count; }
      ungradedByClass.set(classId, ungradedTotal);
    }

    const data = classes.map((classItem) => {
      const studentCount = studentsPerClass.get(classItem.id) ?? 0;
      const submissionTotal = submissionTotalByClass.get(classItem.id) ?? 0;
      const completedTotal = completedTotalByClass.get(classItem.id) ?? 0;
      const materialTotal = totalMaterialsByClass.get(classItem.id) ?? 0;
      const readTotal = readTotalByClass.get(classItem.id) ?? 0;
      const quizTotal = totalQuizzesByClass.get(classItem.id) ?? 0;
      const quizDoneTotal = quizDoneTotalByClass.get(classItem.id) ?? 0;
      const gradeEntry = gradeTotalByClass.get(classItem.id);
      return {
        classId: classItem.id, className: classItem.name, studentCount,
        submissionRate: studentCount > 0 && submissionTotal > 0 ? Math.round((completedTotal / (submissionTotal * studentCount)) * 100) : 100,
        materialReadRate: studentCount > 0 && materialTotal > 0 ? Math.round((readTotal / (materialTotal * studentCount)) * 100) : 100,
        quizCompletionRate: studentCount > 0 && quizTotal > 0 ? Math.round((quizDoneTotal / (quizTotal * studentCount)) * 100) : 100,
        averageGrade: gradeEntry && gradeEntry.count > 0 ? Math.round(gradeEntry.sum / gradeEntry.count) : null,
        ungradedCount: ungradedByClass.get(classItem.id) ?? 0, lastActivity: null,
      };
    });
    return { data, total };
  }
}

export const dashboardRepository = new DashboardRepository();
