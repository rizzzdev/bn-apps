export interface OptionGetByIdQuery {}

export interface OptionGetAllQuery extends OptionGetByIdQuery {
  questionId?: string;
  page?: number;
  limit?: number;
}
