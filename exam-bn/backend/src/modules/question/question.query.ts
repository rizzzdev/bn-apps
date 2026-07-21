export interface QuestionGetByIdQuery {
  options?: boolean;
  allOptions?: boolean;
  correctAnswer?: boolean;
}

export interface QuestionGetAllQuery extends QuestionGetByIdQuery {
  type?: string;
  page?: number;
  limit?: number;
}
