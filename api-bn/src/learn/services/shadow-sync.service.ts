import { prisma } from '@learn/database/index.js';
import { getOrchestrator } from '@app/orchestrator.js';

function buildTeacherFullname(teacher: {
  fullname?: string | null;
  prefixTitle?: string | null;
  suffixTitle?: string | null;
}): string {
  const prefix = teacher.prefixTitle?.trim() ? `${teacher.prefixTitle.trim()} ` : '';
  const suffix = teacher.suffixTitle?.trim() ? `, ${teacher.suffixTitle.trim()}` : '';
  return `${prefix}${teacher.fullname?.trim() ?? ''}${suffix}`;
}

export class ShadowSyncService {
  private lastSyncTime: number = 0;
  private readonly syncIntervalMs: number = 60 * 1000; // 60 detik throttle

  /**
   * Sync master students to ShadowStudent table.
   */
  async syncStudents(): Promise<number> {
    try {
      const orchestrator = getOrchestrator();
      const masterStudents = await orchestrator.masterStudent.findAll();
      const activeIds = masterStudents.map((s) => s.id);
      const now = new Date();

      let count = 0;
      for (const s of masterStudents) {
        if (!s.id || !s.userId) continue;
        await prisma.shadowStudent.upsert({
          where: { id: s.id },
          update: {
            userId: s.userId,
            fullname: s.fullname,
            nis: s.nis ?? null,
            nisn: s.nisn ?? null,
            deletedAt: null,
            lastSyncAt: now,
          },
          create: {
            id: s.id,
            userId: s.userId,
            fullname: s.fullname,
            nis: s.nis ?? null,
            nisn: s.nisn ?? null,
            lastSyncAt: now,
          },
        }).catch(() => {});
        count++;
      }

      if (activeIds.length > 0) {
        await prisma.shadowStudent.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: { deletedAt: now },
        }).catch(() => {});
      }

      return count;
    } catch (error) {
      console.error('[ShadowSyncService] Failed to sync students from Master:', error);
      return 0;
    }
  }

  /**
   * Sync master teachers to ShadowTeacher table.
   * Gelar (prefixTitle & suffixTitle) langsung digabung ke fullname.
   */
  async syncTeachers(): Promise<number> {
    try {
      const orchestrator = getOrchestrator();
      const masterTeachers = await orchestrator.masterTeacher.findAll();
      const activeIds = masterTeachers.map((t) => t.id);
      const now = new Date();

      let count = 0;
      for (const t of masterTeachers) {
        if (!t.id || !t.userId) continue;
        const fullnameWithTitle = buildTeacherFullname(t);

        await prisma.shadowTeacher.upsert({
          where: { id: t.id },
          update: {
            userId: t.userId,
            fullname: fullnameWithTitle,
            email: t.email ?? null,
            nip: t.nip ?? null,
            deletedAt: null,
            lastSyncAt: now,
          },
          create: {
            id: t.id,
            userId: t.userId,
            fullname: fullnameWithTitle,
            email: t.email ?? null,
            nip: t.nip ?? null,
            lastSyncAt: now,
          },
        }).catch(() => {});
        count++;
      }

      if (activeIds.length > 0) {
        await prisma.shadowTeacher.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: { deletedAt: now },
        }).catch(() => {});
      }

      return count;
    } catch (error) {
      console.error('[ShadowSyncService] Failed to sync teachers from Master:', error);
      return 0;
    }
  }

  /**
   * Sync master classes to ShadowClass table.
   */
  async syncClasses(): Promise<number> {
    try {
      const orchestrator = getOrchestrator();
      const masterClasses = await orchestrator.masterClass.findAll();
      const activeIds = masterClasses.map((c) => c.id);
      const now = new Date();

      let count = 0;
      for (const c of masterClasses) {
        if (!c.id) continue;
        await prisma.shadowClass.upsert({
          where: { id: c.id },
          update: {
            name: c.name,
            majorId: c.majorId ?? null,
            academicYearId: c.academicYear ?? null,
            deletedAt: null,
            lastSyncAt: now,
          },
          create: {
            id: c.id,
            name: c.name,
            majorId: c.majorId ?? null,
            academicYearId: c.academicYear ?? null,
            lastSyncAt: now,
          },
        }).catch(() => {});
        count++;
      }

      if (activeIds.length > 0) {
        await prisma.shadowClass.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: { deletedAt: now },
        }).catch(() => {});
      }

      return count;
    } catch (error) {
      console.error('[ShadowSyncService] Failed to sync classes from Master:', error);
      return 0;
    }
  }

  /**
   * Sync class-student relations to ShadowClassStudent table.
   */
  async syncClassStudents(): Promise<number> {
    try {
      const orchestrator = getOrchestrator();
      const classStudents = await orchestrator.academicClassStudent.findMany({});
      const activeIds = classStudents.map((cs) => cs.id);
      const now = new Date();

      let count = 0;
      for (const cs of classStudents) {
        if (!cs.id || !cs.classId || !cs.studentId) continue;
        await prisma.shadowClassStudent.upsert({
          where: { id: cs.id },
          update: {
            classId: cs.classId,
            studentId: cs.studentId,
            status: cs.status ?? 'Aktif',
            deletedAt: null,
            lastSyncAt: now,
          },
          create: {
            id: cs.id,
            classId: cs.classId,
            studentId: cs.studentId,
            status: cs.status ?? 'Aktif',
            lastSyncAt: now,
          },
        }).catch(() => {});
        count++;
      }

      if (activeIds.length > 0) {
        await prisma.shadowClassStudent.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: { deletedAt: now },
        }).catch(() => {});
      }

      return count;
    } catch (error) {
      console.error('[ShadowSyncService] Failed to sync class-students from Academic:', error);
      return 0;
    }
  }

  /**
   * Lazy Sync All: Runs sync only if syncIntervalMs has elapsed since last sync,
   * or if force=true. Fail-safe & non-blocking.
   */
  async lazySyncAll(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastSyncTime < this.syncIntervalMs) {
      return;
    }

    this.lastSyncTime = now;
    await Promise.allSettled([
      this.syncStudents(),
      this.syncTeachers(),
      this.syncClasses(),
      this.syncClassStudents(),
    ]);
  }
}

export const shadowSyncService = new ShadowSyncService();
