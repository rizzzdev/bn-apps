// =============================================================================
//  learn-data.service.ts  —  concrete impls of learn-data port (type-safe)
//  Lokasi: src/learn/services/  (sesuai path alias @learn/* → ./src/learn/*)
// =============================================================================
import { prisma } from '@learn/database/index.js';
import {
  LearnMaterial,
  LearnAssignment,
  LearnQuiz,
  LearnSubmission,
  LearnAttachment,
  ILearnMaterialRepository,
  ILearnAssignmentRepository,
  ILearnQuizRepository,
  ILearnSubmissionRepository,
  ILearnAttachmentRepository,
} from '@app/ports/learn-data.port.js';

// Helper: robust read of optional number / string fields, tolerating schema drift
// across learn_* migrations without forcing `as any`.
function num(v: unknown): number | null {
  return typeof v === 'number' ? v : null;
}
function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export class LearnMaterialRepository implements ILearnMaterialRepository {
  async findById(id: string): Promise<LearnMaterial | null> {
    const m = await prisma.material.findFirst({
      where: { id, deletedAt: null },
      include: { classes: true },
    });
    if (!m) return null;
    return {
      id: m.id,
      title: m.title,
      classIds: m.classes.map((c) => c.classId),
      status: (m as any).status ?? 'Draft',
    };
  }

  async listByClassId(classId: string): Promise<LearnMaterial[]> {
    const rows = await prisma.material.findMany({
      where: {
        deletedAt: null,
        classes: { some: { classId } },
      },
      include: { classes: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((m) => ({
      id: m.id,
      title: m.title,
      classIds: m.classes.map((c) => c.classId),
      status: (m as any).status ?? 'Draft',
    }));
  }
}

export class LearnAssignmentRepository implements ILearnAssignmentRepository {
  async findById(id: string): Promise<LearnAssignment | null> {
    const a = await prisma.assignment.findFirst({
      where: { id, deletedAt: null },
      include: { classes: true },
    });
    if (!a) return null;
    return {
      id: a.id,
      title: a.title,
      classIds: a.classes.map((c) => c.classId),
      deadline: (a as any).deadline ?? null,
      status: (a as any).status ?? 'Draft',
    };
  }

  async listByClassId(classId: string): Promise<LearnAssignment[]> {
    const rows = await prisma.assignment.findMany({
      where: {
        deletedAt: null,
        classes: { some: { classId } },
      },
      include: { classes: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((a) => ({
      id: a.id,
      title: a.title,
      classIds: a.classes.map((c) => c.classId),
      deadline: (a as any).deadline ?? null,
      status: (a as any).status ?? 'Draft',
    }));
  }
}

export class LearnQuizRepository implements ILearnQuizRepository {
  async findById(id: string): Promise<LearnQuiz | null> {
    const q = await prisma.quiz.findFirst({
      where: { id, deletedAt: null },
      include: { classes: true },
    });
    if (!q) return null;
    return {
      id: q.id,
      title: q.title,
      classIds: q.classes.map((c) => c.classId),
      timeLimit: num((q as any).timeLimit),
      status: (q as any).status ?? 'Draft',
    };
  }

  async listByClassId(classId: string): Promise<LearnQuiz[]> {
    const rows = await prisma.quiz.findMany({
      where: {
        deletedAt: null,
        classes: { some: { classId } },
      },
      include: { classes: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((q) => ({
      id: q.id,
      title: q.title,
      classIds: q.classes.map((c) => c.classId),
      timeLimit: num((q as any).timeLimit),
      status: (q as any).status ?? 'Draft',
    }));
  }
}

export class LearnSubmissionRepository implements ILearnSubmissionRepository {
  async findMyForAssignment(assignmentId: string, studentUserId: string): Promise<LearnSubmission | null> {
    const s = await prisma.assignmentSubmission.findFirst({
      where: { assignmentId, studentId: studentUserId },
    });
    if (!s) return null;
    return {
      id: s.id,
      studentUserId: s.studentId,
      score: (s as any).grade ?? null,
      status: 'submitted',
    };
  }
  async findMyForQuiz(quizId: string, studentUserId: string): Promise<LearnSubmission | null> {
    const s = await prisma.quizSubmission.findFirst({
      where: { quizId, studentId: studentUserId },
    });
    if (!s) return null;
    return {
      id: s.id,
      studentUserId: s.studentId,
      score: (s as any).score ?? null,
      status: s.finishedAt ? 'finished' : 'in_progress',
    };
  }
}

export class LearnAttachmentRepository implements ILearnAttachmentRepository {
  async findById(id: string): Promise<LearnAttachment | null> {
    const a = await prisma.attachment.findFirst({ where: { id, deletedAt: null } });
    if (!a) return null;
    return {
      id: a.id,
      filename: (a as any).filename ?? '',
      url: (a as any).url ?? '',
      mimeType: (a as any).mimetype ?? (a as any).mimeType ?? null,
      size: (a as any).size ?? null,
    };
  }
}
