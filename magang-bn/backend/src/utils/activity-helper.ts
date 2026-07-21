import { prisma } from '@/database/index.js';

export async function getAdminName(actorId?: string | null): Promise<string> {
  if (!actorId) return 'Super Admin';
  const [teacher, mentor, student] = await Promise.all([
    prisma.teacher.findFirst({ where: { userId: actorId, deletedAt: null } }),
    prisma.industryMentor.findFirst({ where: { userId: actorId, deletedAt: null } }),
    prisma.student.findFirst({ where: { userId: actorId, deletedAt: null } })
  ]);
  if (teacher) return `Admin ${teacher.name}`;
  if (mentor) return `Admin ${mentor.name}`;
  if (student) return `Admin ${student.name}`;
  return 'Super Admin';
}

export async function getReviewerName(actorId?: string | null): Promise<string> {
  if (!actorId) return 'Reviewer';
  const [teacher, mentor] = await Promise.all([
    prisma.teacher.findFirst({ where: { userId: actorId, deletedAt: null } }),
    prisma.industryMentor.findFirst({ where: { userId: actorId, deletedAt: null } })
  ]);
  if (teacher) return teacher.name;
  if (mentor) return mentor.name;
  return 'Reviewer';
}
