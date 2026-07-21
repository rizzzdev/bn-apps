export interface ExamScoreGetByIdQuery {}

export interface ExamScoreGetAllQuery extends ExamScoreGetByIdQuery {
  examRoomId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}
