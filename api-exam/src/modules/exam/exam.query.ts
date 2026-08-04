export interface ExamGetByIdQuery {
  examRooms?: boolean;
}

export interface ExamGetAllQuery extends ExamGetByIdQuery {
  name?: string;
  questionCreatorId?: string;
  page?: number;
  limit?: number;
}
