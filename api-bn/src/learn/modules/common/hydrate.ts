import { prisma } from '@learn/database/index.js';
import { shadowSyncService } from '../../services/shadow-sync.service.js';
import { getOrchestrator } from '@app/orchestrator.js';

export { getOrchestrator };

export async function computeClassStudentCounts(classIds: string[]): Promise<Map<string, number>> {
  if (classIds.length === 0) return new Map();

  await shadowSyncService.lazySyncAll().catch(() => {});

  const records = await prisma.shadowClassStudent.findMany({
    where: {
      classId: { in: [...new Set(classIds)] },
      status: 'Aktif',
      deletedAt: null,
    },
  });

  const map = new Map<string, number>();
  for (const r of records) {
    map.set(r.classId, (map.get(r.classId) ?? 0) + 1);
  }
  return map;
}

export async function fetchStudentNames(studentIds: string[]) {
  const unique = [...new Set(studentIds.filter(Boolean))];
  if (unique.length === 0) return new Map<string, { id: string; fullname: string; nis: string | null; nisn: string | null; pictureUrl: string | null }>();

  await shadowSyncService.lazySyncAll().catch(() => {});

  const students = await prisma.shadowStudent.findMany({
    where: {
      id: { in: unique },
      deletedAt: null,
    },
  });

  return new Map(
    students.map((s) => [
      s.id,
      {
        id: s.id,
        fullname: s.fullname,
        nis: s.nis,
        nisn: s.nisn,
        pictureUrl: s.pictureUrl,
      },
    ])
  );
}

