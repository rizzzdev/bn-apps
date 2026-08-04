// =============================================================================
//  exam-data.port.ts  —  cross-module outbound port for exam data
//  Modul lain (future integrations, master read-only analytics) membaca konteks
//  exam lewat port ini — tidak import langsung prisma exam.
// =============================================================================

export interface ExamRoomData {
  id: string;
  examId: string;
  status: string;
}

export interface ExamData {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  status?: string;
}

export interface ExamParticipantData {
  id: string;
  examRoomId: string;
  userId: string;
  status: string;
}

export interface ExamSupervisorData {
  id: string;
  examRoomId: string;
  userId: string;
}

// -- Repository ports ---------------------------------------------------------
export interface IExamRoomRepository {
  findById(id: string): Promise<ExamRoomData | null>;
  listByExamId(examId: string): Promise<ExamRoomData[]>;
}

export interface IExamRepository {
  findById(id: string): Promise<ExamData | null>;
}

export interface IExamParticipantRepository {
  findByRoomAndUser(examRoomId: string, userId: string): Promise<ExamParticipantData | null>;
  listByRoom(examRoomId: string): Promise<ExamParticipantData[]>;
}

export interface IExamSupervisorRepository {
  findByRoomAndUser(examRoomId: string, userId: string): Promise<ExamSupervisorData | null>;
  listByRoom(examRoomId: string): Promise<ExamSupervisorData[]>;
}
