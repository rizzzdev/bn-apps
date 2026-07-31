import { prisma } from '@academic/database/index.js';
import { getOrchestrator } from '@app/orchestrator.js';
import { clearCachePattern } from '@app/index.js';

export class ShadowSyncService {
  async syncAcademicYears(): Promise<number> {
    try {
      const orchestrator = getOrchestrator();
      const masterYears = await orchestrator.masterAcademicYear.findAll();
      const activeIds = masterYears.map((y) => y.id);
      const now = new Date();

      let upsertedCount = 0;
      for (const y of masterYears) {
        await prisma.shadowAcademicYear.upsert({
          where: { id: y.id },
          update: {
            code: y.code,
            semesterType: y.semesters?.[0]?.type ?? 'Ganjil',
            status: y.status,
            deletedAt: null, // restore if previously soft-deleted
            lastSyncAt: now,
          },
          create: {
            id: y.id,
            code: y.code,
            semesterType: y.semesters?.[0]?.type ?? 'Ganjil',
            status: y.status,
            lastSyncAt: now,
          },
        });
        upsertedCount++;
      }

      if (activeIds.length > 0) {
        await prisma.shadowAcademicYear.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: { deletedAt: now },
        });
      }

      await clearCachePattern('academic:shadow:academic-year:*');
      return upsertedCount;
    } catch (e) {
      console.error('[ShadowSync] Failed to sync academic years:', e);
      return 0;
    }
  }

  async syncMajors(): Promise<number> {
    try {
      const orchestrator = getOrchestrator();
      const masterMajors = await orchestrator.masterMajor.findAll();
      const activeIds = masterMajors.map((m) => m.id);
      const now = new Date();

      let upsertedCount = 0;
      for (const m of masterMajors) {
        await prisma.shadowMajor.upsert({
          where: { id: m.id },
          update: {
            code: m.code,
            name: m.name,
            deletedAt: null,
            lastSyncAt: now,
          },
          create: {
            id: m.id,
            code: m.code,
            name: m.name,
            lastSyncAt: now,
          },
        });
        upsertedCount++;
      }

      if (activeIds.length > 0) {
        await prisma.shadowMajor.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: { deletedAt: now },
        });
      }

      await clearCachePattern('academic:shadow:major:*');
      return upsertedCount;
    } catch (e) {
      console.error('[ShadowSync] Failed to sync majors:', e);
      return 0;
    }
  }

  async syncClasses(): Promise<number> {
    try {
      const orchestrator = getOrchestrator();
      const masterClasses = await orchestrator.masterClass.findAll();
      const activeIds = masterClasses.map((c) => c.id);
      const now = new Date();

      let upsertedCount = 0;
      for (const c of masterClasses) {
        await prisma.shadowClass.upsert({
          where: { id: c.id },
          update: {
            name: c.name,
            majorId: c.majorId,
            majorCode: c.majorCode,
            academicYear: c.academicYear,
            semester: c.semester,
            deletedAt: null,
            lastSyncAt: now,
          },
          create: {
            id: c.id,
            name: c.name,
            majorId: c.majorId,
            majorCode: c.majorCode,
            academicYear: c.academicYear,
            semester: c.semester,
            lastSyncAt: now,
          },
        });
        upsertedCount++;
      }

      if (activeIds.length > 0) {
        await prisma.shadowClass.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: { deletedAt: now },
        });
      }

      await clearCachePattern('academic:shadow:class:*');
      return upsertedCount;
    } catch (e) {
      console.error('[ShadowSync] Failed to sync classes:', e);
      return 0;
    }
  }

  async syncTeachers(): Promise<number> {
    try {
      const orchestrator = getOrchestrator();
      const masterTeachers = await orchestrator.masterTeacher.findAll();
      const activeIds = masterTeachers.map((t) => t.id);
      const now = new Date();

      let upsertedCount = 0;
      for (const t of masterTeachers) {
        await prisma.shadowTeacher.upsert({
          where: { id: t.id },
          update: {
            fullname: t.fullname,
            nip: t.nip ?? null,
            phone: (t as any).phone ?? null,
            photoUrl: (t as any).photoUrl ?? null,
            userId: t.userId,
            deletedAt: null,
            lastSyncAt: now,
          },
          create: {
            id: t.id,
            fullname: t.fullname,
            nip: t.nip ?? null,
            phone: (t as any).phone ?? null,
            photoUrl: (t as any).photoUrl ?? null,
            userId: t.userId,
            lastSyncAt: now,
          },
        });
        upsertedCount++;
      }

      if (activeIds.length > 0) {
        await prisma.shadowTeacher.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: { deletedAt: now },
        });
      }

      await clearCachePattern('academic:shadow:teacher:*');
      return upsertedCount;
    } catch (e) {
      console.error('[ShadowSync] Failed to sync teachers:', e);
      return 0;
    }
  }

  async syncStudents(): Promise<number> {
    try {
      const orchestrator = getOrchestrator();
      const masterStudents = await orchestrator.masterStudent.findAll();
      const activeIds = masterStudents.map((s) => s.id);
      const now = new Date();

      let upsertedCount = 0;
      for (const s of masterStudents) {
        await prisma.shadowStudent.upsert({
          where: { id: s.id },
          update: {
            fullname: s.fullname,
            nis: s.nis ?? null,
            nisn: s.nisn ?? null,
            classId: (s as any).classId ?? null,
            className: (s as any).className ?? null,
            majorId: (s as any).majorId ?? null,
            majorName: (s as any).majorName ?? null,
            photoUrl: (s as any).photoUrl ?? null,
            userId: s.userId,
            deletedAt: null,
            lastSyncAt: now,
          },
          create: {
            id: s.id,
            fullname: s.fullname,
            nis: s.nis ?? null,
            nisn: s.nisn ?? null,
            classId: (s as any).classId ?? null,
            className: (s as any).className ?? null,
            majorId: (s as any).majorId ?? null,
            majorName: (s as any).majorName ?? null,
            photoUrl: (s as any).photoUrl ?? null,
            userId: s.userId,
            lastSyncAt: now,
          },
        });
        upsertedCount++;
      }

      if (activeIds.length > 0) {
        await prisma.shadowStudent.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: { deletedAt: now },
        });
      }

      await clearCachePattern('academic:shadow:student:*');
      return upsertedCount;
    } catch (e) {
      console.error('[ShadowSync] Failed to sync students:', e);
      return 0;
    }
  }

  async syncSubjects(): Promise<number> {
    try {
      const orchestrator = getOrchestrator();
      const masterSubjects = await orchestrator.masterSubject.findAll();
      const activeIds = masterSubjects.map((s) => s.id);
      const now = new Date();

      let upsertedCount = 0;
      for (const s of masterSubjects) {
        await prisma.shadowSubject.upsert({
          where: { id: s.id },
          update: {
            code: s.code,
            name: s.name,
            deletedAt: null,
            lastSyncAt: now,
          },
          create: {
            id: s.id,
            code: s.code,
            name: s.name,
            lastSyncAt: now,
          },
        });
        upsertedCount++;
      }

      if (activeIds.length > 0) {
        await prisma.shadowSubject.updateMany({
          where: {
            id: { notIn: activeIds },
            deletedAt: null,
          },
          data: { deletedAt: now },
        });
      }

      await clearCachePattern('academic:shadow:subject:*');
      return upsertedCount;
    } catch (e) {
      console.error('[ShadowSync] Failed to sync subjects:', e);
      return 0;
    }
  }

  async syncAll() {
    const [academicYears, majors, classes, teachers, students, subjects] = await Promise.all([
      this.syncAcademicYears(),
      this.syncMajors(),
      this.syncClasses(),
      this.syncTeachers(),
      this.syncStudents(),
      this.syncSubjects(),
    ]);

    return [
      { module: 'academic-years', upserted: academicYears },
      { module: 'majors', upserted: majors },
      { module: 'classes', upserted: classes },
      { module: 'teachers', upserted: teachers },
      { module: 'students', upserted: students },
      { module: 'subjects', upserted: subjects },
    ];
  }
}

export const shadowSyncService = new ShadowSyncService();
