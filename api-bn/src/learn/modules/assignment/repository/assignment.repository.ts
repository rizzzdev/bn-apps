import { prisma } from '#learn/database/index.js';
import { shadowSyncService } from '../../../services/shadow-sync.service.js';
import { CreateAssignmentDto, UpdateAssignmentDto } from '../domain/schemas.js';
import { computeClassStudentCounts } from '../../common/hydrate.js';

export class AssignmentRepository {
  async create(data: CreateAssignmentDto, teacherId: string) {
    const assignment = await prisma.assignment.create({
      data: {
        title: data.title, description: data.description, deadline: new Date(data.deadline),
        status: data.status || 'Draft', teacherId,
        attachments: { create: data.attachments || [] },
        classes: { create: data.classIds.map((classId) => ({ classId })) },
      },
      include: { attachments: true, classes: true },
    });
    const hydrated = await this.hydrate([assignment]);
    return hydrated[0];
  }

  async findAllByTeacher(teacherId: string) {
    const assignments = await prisma.assignment.findMany({
      where: { teacherId, deletedAt: null },
      include: { attachments: true, classes: true, _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return this.hydrateAll(assignments as any[]);
  }

  async findAllByClass(classId: string, isStudent = false, studentId?: string) {
    const assignments = await prisma.assignment.findMany({
      where: {
        classes: { some: { classId } }, deletedAt: null,
        ...(isStudent && { status: 'Published' }),
      },
      include: {
        attachments: true, classes: true,
        _count: { select: { submissions: true } },
        ...(studentId ? { submissions: { where: { studentId }, select: { id: true, grade: true, createdAt: true } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.hydrateAll(assignments as any[], studentId);
  }

  async findById(id: string) {
    const assignment = await prisma.assignment.findFirst({
      where: { id, deletedAt: null },
      include: { attachments: true, classes: true, _count: { select: { submissions: true } } },
    });
    if (!assignment) return null;
    const hydrated = await this.hydrateAll([assignment as any]);
    return hydrated[0] ?? null;
  }

  async update(id: string, data: UpdateAssignmentDto) {
    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.deadline && { deadline: new Date(data.deadline) }),
        ...(data.status && { status: data.status }),
        ...(data.classIds !== undefined && { classes: { deleteMany: {}, create: data.classIds.map((classId) => ({ classId })) } }),
        ...(data.attachments && { attachments: { deleteMany: {}, create: data.attachments } }),
      },
      include: { attachments: true, classes: true },
    });
    const hydrated = await this.hydrate([assignment]);
    return hydrated[0];
  }

  async delete(id: string) {
    return prisma.assignment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async bulkDelete(ids: string[]) {
    return prisma.assignment.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  }

  private async fetchClassMap(classIds: string[]) {
    if (classIds.length === 0) return new Map<string, string>();
    await shadowSyncService.lazySyncAll().catch(() => {});
    const classes = await prisma.shadowClass.findMany({
      where: { id: { in: classIds }, deletedAt: null },
    });
    return new Map(classes.map((c) => [c.id, c.name]));
  }

  private async fetchTeacherMap(teacherIds: string[]) {
    if (teacherIds.length === 0) return new Map<string, any>();
    await shadowSyncService.lazySyncAll().catch(() => {});
    const teachers = await prisma.shadowTeacher.findMany({
      where: { id: { in: teacherIds }, deletedAt: null },
    });
    return new Map(teachers.map((t) => [t.id, t]));
  }

  private async hydrate(items: any[]) {
    const allClassIds = [...new Set(items.flatMap((a: any) => (a.classes || []).map((c: any) => c.classId)))];
    const allTeacherIds = [...new Set(items.map((a: any) => a.teacherId).filter(Boolean))];
    const [classMap, teacherMap] = await Promise.all([this.fetchClassMap(allClassIds), this.fetchTeacherMap(allTeacherIds)]);
    return items.map((a) => ({
      ...a,
      teacher: teacherMap.get(a.teacherId) ?? { id: a.teacherId, fullname: '' },
      classes: (a.classes || []).map((c: any) => ({
        ...c, class: classMap.has(c.classId) ? { id: c.classId, name: classMap.get(c.classId) } : { id: c.classId, name: '' },
      })),
    }));
  }

  private async hydrateAll(items: any[], studentId?: string) {
    if (items.length === 0) return [];
    const allClassIds = [...new Set(items.flatMap((a: any) => (a.classes || []).map((c: any) => c.classId)))];
    const allTeacherIds = [...new Set(items.map((a: any) => a.teacherId).filter(Boolean))];
    const [classMap, teacherMap, countMap] = await Promise.all([
      this.fetchClassMap(allClassIds),
      this.fetchTeacherMap(allTeacherIds),
      computeClassStudentCounts(allClassIds),
    ]);

    return items.map((a: any) => {
      const submittedCount = a._count?.submissions ?? 0;
      const totalStudents = (a.classes || []).reduce((sum: number, c: any) => sum + (countMap.get(c.classId) ?? 0), 0);
      const submissionStats = { submittedCount, totalStudents };

      const base: any = {
        ...a,
        teacher: teacherMap.get(a.teacherId) ?? { id: a.teacherId, fullname: '' },
        classes: (a.classes || []).map((c: any) => ({
          ...c, class: classMap.has(c.classId) ? { id: c.classId, name: classMap.get(c.classId) } : { id: c.classId, name: '' },
        })),
        submissionStats,
      };

      if (studentId) {
        const mySubmission = a.submissions?.[0] ?? null;
        return { ...base, isSubmitted: !!mySubmission, mySubmission };
      }

      return base;
    });
  }
}

export const assignmentRepository = new AssignmentRepository();
