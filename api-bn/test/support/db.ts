import { prisma } from '../../src/master/src/database/index.ts';

const MASTER_TABLES = [
  'academic_years',
  'semesters',
  'majors',
  'classes',
  'teachers',
  'students',
  'subjects',
  'attachments',
  'applications',
];

/**
 * Mengosongkan semua tabel module `master` di database test. Dipanggil di
 * `beforeEach` supaya tiap test mulai dari state kosong & tidak saling
 * mempengaruhi (independen dari urutan eksekusi test).
 */
export async function resetMasterDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${MASTER_TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE;`
  );
}
