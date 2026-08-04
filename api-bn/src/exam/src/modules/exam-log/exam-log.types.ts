export type ExamLog = {
  id: string;
  examRoomId: string;
  userId: string | null;
  type: string;
  message: string;
  createdAt: Date;
};

export type CreateExamLogDto = {
  examRoomId: string;
  userId?: string | null;
  type: string;
  message: string;
};
