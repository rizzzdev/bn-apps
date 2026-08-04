export interface ExamQuestionGetByIdQuery {}

export interface ExamQuestionGetAllQuery extends ExamQuestionGetByIdQuery {
  examRoomId?: string;
  questionId?: string;
  page?: number;
  limit?: number;
}
