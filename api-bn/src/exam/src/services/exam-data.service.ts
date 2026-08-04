// =============================================================================
//  exam-data.service.ts  —  concrete impls of exam-data port (type-safe)
//  Lokasi: src/exam/src/services/  (sesuai path alias #exam/* → ./src/exam/src/*)
// =============================================================================
import { prisma } from '#exam/database/index.js';
import {
  ExamRoomData,
  ExamData,
  ExamParticipantData,
  ExamSupervisorData,
  IExamRoomRepository,
  IExamRepository,
  IExamParticipantRepository,
  IExamSupervisorRepository,
} from '#app/ports/exam-data.port.js';

export class ExamRoomRepository implements IExamRoomRepository {
  async findById(id: string): Promise<ExamRoomData | null> {
    const r = await prisma.examRoom.findFirst({ where: { id, deletedAt: null } });
    if (!r) return null;
    return { id: r.id, examId: r.examId, status: r.status };
  }

  async listByExamId(examId: string): Promise<ExamRoomData[]> {
    const rows = await prisma.examRoom.findMany({ where: { examId, deletedAt: null } });
    return rows.map((r) => ({ id: r.id, examId: r.examId, status: r.status }));
  }
}

export class ExamRepository implements IExamRepository {
  async findById(id: string): Promise<ExamData | null> {
    const e = await prisma.exam.findFirst({ where: { id, deletedAt: null } });
    if (!e) return null;
    return { id: e.id, name: e.name, startTime: e.startTime, endTime: e.endTime };
  }
}

export class ExamParticipantRepository implements IExamParticipantRepository {
  async findByRoomAndUser(examRoomId: string, userId: string): Promise<ExamParticipantData | null> {
    const p = await prisma.examParticipant.findFirst({ where: { examRoomId, userId } });
    if (!p) return null;
    return { id: p.id, examRoomId: p.examRoomId, userId: p.userId, status: p.status };
  }

  async listByRoom(examRoomId: string): Promise<ExamParticipantData[]> {
    const rows = await prisma.examParticipant.findMany({ where: { examRoomId } });
    return rows.map((p) => ({ id: p.id, examRoomId: p.examRoomId, userId: p.userId, status: p.status }));
  }
}

export class ExamSupervisorRepository implements IExamSupervisorRepository {
  async findByRoomAndUser(examRoomId: string, userId: string): Promise<ExamSupervisorData | null> {
    const s = await prisma.examSupervisor.findFirst({ where: { examRoomId, userId } });
    if (!s) return null;
    return { id: s.id, examRoomId: s.examRoomId, userId: s.userId };
  }

  async listByRoom(examRoomId: string): Promise<ExamSupervisorData[]> {
    const rows = await prisma.examSupervisor.findMany({ where: { examRoomId } });
    return rows.map((s) => ({ id: s.id, examRoomId: s.examRoomId, userId: s.userId }));
  }
}
