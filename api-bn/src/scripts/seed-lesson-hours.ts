import 'dotenv/config';
import { prisma } from '../academic/src/database/index.js';

/**
 * Seed data jam pelajaran (LessonHour) ke-1 s.d. ke-11.
 * Berjalan idempotent: update jika nama/order sudah ada, insert jika belum.
 *
 * Cara pakai:
 *   npm run db:seed:academic
 */
const LESSON_HOURS = [
  { name: 'Jam ke-1', startTime: '07:00', endTime: '07:45', order: 1 },
  { name: 'Jam ke-2', startTime: '07:45', endTime: '08:30', order: 2 },
  { name: 'Jam ke-3', startTime: '08:30', endTime: '09:15', order: 3 },
  { name: 'Jam ke-4', startTime: '09:15', endTime: '10:00', order: 4 },
  { name: 'Jam ke-5', startTime: '10:15', endTime: '11:00', order: 5 },
  { name: 'Jam ke-6', startTime: '11:00', endTime: '11:45', order: 6 },
  { name: 'Jam ke-7', startTime: '11:45', endTime: '12:30', order: 7 },
  { name: 'Jam ke-8', startTime: '13:00', endTime: '13:45', order: 8 },
  { name: 'Jam ke-9', startTime: '13:45', endTime: '14:30', order: 9 },
  { name: 'Jam ke-10', startTime: '14:30', endTime: '15:15', order: 10 },
  { name: 'Jam ke-11', startTime: '15:15', endTime: '16:00', order: 11 },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const data of LESSON_HOURS) {
    const existing = await prisma.lessonHour.findFirst({
      where: { order: data.order, deletedAt: null },
    });

    if (existing) {
      await prisma.lessonHour.update({
        where: { id: existing.id },
        data,
      });
      updated++;
    } else {
      await prisma.lessonHour.create({ data });
      created++;
    }
  }

  console.log(
    `[seed] LessonHours selesai: ${created} dibuat, ${updated} diperbarui (total ${LESSON_HOURS.length}).`,
  );
}

main()
  .catch((err) => {
    console.error('[seed] Gagal seeding LessonHours:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
