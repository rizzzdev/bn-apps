import { prisma } from '@internship/database/index.js';
import { getOrchestrator } from '@app/orchestrator.js';

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

  const orchestrator = getOrchestrator();
  const [masterTeacher, masterStudent] = await Promise.all([
    orchestrator.masterTeacher.findByUserId(actorId),
    orchestrator.masterStudent.findByUserId(actorId)
  ]);

  if (masterTeacher) return `Admin ${masterTeacher.fullname}`;
  if (masterStudent) return `Admin ${masterStudent.fullname}`;

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

  const orchestrator = getOrchestrator();
  const masterTeacher = await orchestrator.masterTeacher.findByUserId(actorId);
  if (masterTeacher) return masterTeacher.fullname;

  return 'Reviewer';
}
