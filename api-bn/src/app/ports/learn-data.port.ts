// =============================================================================
//  learn-data.port.ts  —  cross-module outbound port for learn (LMS) data
//  Modul lain (future integrations, master read-only analytics) membaca konteks
//  LMS lewat port ini — tidak import langsung prisma learn.
// =============================================================================

export interface LearnMaterial {
  id: string;
  title: string;
  classIds: string[];
  status: string;
}

export interface LearnAssignment {
  id: string;
  title: string;
  classIds: string[];
  deadline: Date | null;
  status: string;
}

export interface LearnQuiz {
  id: string;
  title: string;
  classIds: string[];
  timeLimit: number | null;
  status: string;
}

export interface LearnSubmission {
  id: string;
  studentUserId: string;
  score: number | null;
  status: string;
}

export interface LearnAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string | null;
  size: number | null;
}

// -- Repository ports ---------------------------------------------------------
export interface ILearnMaterialRepository {
  findById(id: string): Promise<LearnMaterial | null>;
  listByClassId(classId: string): Promise<LearnMaterial[]>;
}

export interface ILearnAssignmentRepository {
  findById(id: string): Promise<LearnAssignment | null>;
  listByClassId(classId: string): Promise<LearnAssignment[]>;
}

export interface ILearnQuizRepository {
  findById(id: string): Promise<LearnQuiz | null>;
  listByClassId(classId: string): Promise<LearnQuiz[]>;
}

export interface ILearnSubmissionRepository {
  findMyForAssignment(assignmentId: string, studentUserId: string): Promise<LearnSubmission | null>;
  findMyForQuiz(quizId: string, studentUserId: string): Promise<LearnSubmission | null>;
}

export interface ILearnAttachmentRepository {
  findById(id: string): Promise<LearnAttachment | null>;
}
