import { prisma } from '#learn/database/index.js';
import { shadowSyncService } from '../../../services/shadow-sync.service.js';
import { CreateMaterialDto, UpdateMaterialDto } from '../domain/schemas.js';
import { computeClassStudentCounts, fetchStudentNames } from '../../common/hydrate.js';

export class MaterialRepository {
  async create(data: CreateMaterialDto, teacherId: string) {
    const targetClassIds = data.classIds && data.classIds.length > 0 ? data.classIds : data.classId ? [data.classId] : [];
    const material = await prisma.material.create({
      data: {
        title: data.title, content: data.content, status: data.status || 'Draft', teacherId,
        attachments: { create: data.attachments || [] },
        classes: { create: targetClassIds.map((classId) => ({ classId })) },
      },
      include: { attachments: true, classes: true },
    });
    const hydrated = await this.hydrate([material]);
    return hydrated[0];
  }

  async findAllByClass(classId: string, isStudent = false, studentId?: string) {
    const materials = await prisma.material.findMany({
      where: {
        classes: { some: { classId } }, deletedAt: null,
        ...(isStudent && { status: 'Published' }),
      },
      include: {
        attachments: true, classes: true,
        _count: { select: { reads: true } },
        ...(studentId ? { reads: { where: { studentId }, select: { readAt: true } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.hydrateAll(materials as any[], studentId);
  }

  async findById(id: string, studentId?: string) {
    const material = await prisma.material.findFirst({
      where: { id, deletedAt: null },
      include: {
        attachments: true, classes: true,
        _count: { select: { reads: true } },
        ...(studentId ? { reads: { where: { studentId }, select: { readAt: true } } } : {
          reads: { select: { id: true, readAt: true, studentId: true }, orderBy: { readAt: 'desc' } },
        }),
      },
    });
    if (!material) return null;

    const m = material as any;
    const classIds = (m.classes || []).map((c: any) => c.classId).filter(Boolean);
    const [classMap, countMap, teacherMap] = await Promise.all([
      this.fetchClassMap(classIds),
      computeClassStudentCounts(classIds),
      this.fetchTeacherMap([m.teacherId].filter(Boolean)),
    ]);

    const totalStudents = [...countMap.values()].reduce((a, b) => a + b, 0);
    const readCount = m._count?.reads ?? 0;
    const readStats = { readCount, totalStudents };

    const result: any = {
      ...material,
      teacher: teacherMap.get(m.teacherId) ?? { id: m.teacherId, fullname: '' },
      classes: (m.classes || []).map((c: any) => ({
        ...c, class: classMap.has(c.classId) ? { id: c.classId, name: classMap.get(c.classId) } : { id: c.classId, name: '' },
      })),
      readStats,
    };

    if (studentId) {
      const readRecord = m.reads?.[0];
      return { ...result, isRead: !!readRecord, readAt: readRecord?.readAt || null };
    }

    if (!studentId && m.classes?.length) {
      await shadowSyncService.lazySyncAll().catch(() => {});
      const csRecords = await prisma.shadowClassStudent.findMany({
        where: {
          classId: { in: classIds }, status: 'Aktif', deletedAt: null,
        },
      });
      const studentIds = [...new Set(csRecords.map((cs) => cs.studentId))];
      const studentMap = await fetchStudentNames(studentIds);
      const readMap = new Map((m.reads || []).map((r: any) => [r.studentId || r.student?.id, r]));
      result.readers = csRecords.map((cs) => {
        const readRecord = readMap.get(cs.studentId);
        return {
          student: studentMap.get(cs.studentId) ?? { id: cs.studentId, fullname: '', nis: null, nisn: null, pictureUrl: null },
          class: classMap.has(cs.classId) ? { id: cs.classId, name: classMap.get(cs.classId) } : { id: cs.classId, name: '' },
          isRead: !!readRecord, readAt: (readRecord as any)?.readAt || null,
        };
      });
    }

    return result;
  }

  async markAsRead(materialId: string, studentId: string) {
    return prisma.materialRead.upsert({
      where: { materialId_studentId: { materialId, studentId } },
      create: { materialId, studentId }, update: { readAt: new Date() },
    });
  }

  async update(id: string, data: UpdateMaterialDto) {
    const targetClassIds = data.classIds !== undefined ? data.classIds : data.classId ? [data.classId] : undefined;
    const material = await prisma.material.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.status && { status: data.status }),
        ...(targetClassIds !== undefined && { classes: { deleteMany: {}, create: targetClassIds.map((classId) => ({ classId })) } }),
        ...(data.attachments && { attachments: { deleteMany: {}, create: data.attachments } }),
      },
      include: { attachments: true, classes: true },
    });
    const hydrated = await this.hydrate([material]);
    return hydrated[0];
  }

  async delete(id: string) {
    return prisma.material.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async bulkDelete(ids: string[]) {
    return prisma.material.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
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

  private async hydrate(materials: any[]) {
    const allClassIds = [...new Set(materials.flatMap((m: any) => (m.classes || []).map((c: any) => c.classId)))];
    const allTeacherIds = [...new Set(materials.map((m: any) => m.teacherId).filter(Boolean))];
    const [classMap, teacherMap] = await Promise.all([
      this.fetchClassMap(allClassIds),
      this.fetchTeacherMap(allTeacherIds),
    ]);
    return materials.map((m) => ({
      ...m,
      teacher: teacherMap.get(m.teacherId) ?? { id: m.teacherId, fullname: '' },
      classes: (m.classes || []).map((c: any) => ({
        ...c, class: classMap.has(c.classId) ? { id: c.classId, name: classMap.get(c.classId) } : { id: c.classId, name: '' },
      })),
    }));
  }

  private async hydrateAll(materials: any[], studentId?: string) {
    if (materials.length === 0) return [];
    const allClassIds = [...new Set(materials.flatMap((m: any) => (m.classes || []).map((c: any) => c.classId)))];
    const allTeacherIds = [...new Set(materials.map((m: any) => m.teacherId).filter(Boolean))];
    const [classMap, teacherMap, countMap] = await Promise.all([
      this.fetchClassMap(allClassIds),
      this.fetchTeacherMap(allTeacherIds),
      computeClassStudentCounts(allClassIds),
    ]);

    return materials.map((m: any) => {
      const readCount = m._count?.reads ?? 0;
      const totalStudents = (m.classes || []).reduce((sum: number, c: any) => sum + (countMap.get(c.classId) ?? 0), 0);
      const readStats = { readCount, totalStudents };
      const base = {
        ...m,
        teacher: teacherMap.get(m.teacherId) ?? { id: m.teacherId, fullname: '' },
        classes: (m.classes || []).map((c: any) => ({
          ...c, class: classMap.has(c.classId) ? { id: c.classId, name: classMap.get(c.classId) } : { id: c.classId, name: '' },
        })),
        readStats,
      };
      if (studentId) {
        const readRecord = m.reads?.[0];
        return { ...base, isRead: !!readRecord, readAt: readRecord?.readAt || null };
      }
      return base;
    });
  }
}

export const materialRepository = new MaterialRepository();
