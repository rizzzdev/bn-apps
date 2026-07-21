export interface QuestionCorrectAnswerGetByIdQuery {}

export interface QuestionCorrectAnswerGetAllQuery extends QuestionCorrectAnswerGetByIdQuery {
  questionId?: string;
  page?: number;
  limit?: number;
}
