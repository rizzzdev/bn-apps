export interface ExamAnswerGetByIdQuery {}

export interface ExamAnswerGetAllQuery extends ExamAnswerGetByIdQuery {
  examRoomId?: string;
  userId?: string;
  questionId?: string;
  page?: number;
  limit?: number;
}
