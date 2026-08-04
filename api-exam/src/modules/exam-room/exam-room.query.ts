export interface ExamRoomGetByIdQuery {}

export interface ExamRoomGetAllQuery extends ExamRoomGetByIdQuery {
  examId?: string;
  roomId?: string;
  page?: number;
  limit?: number;
}
