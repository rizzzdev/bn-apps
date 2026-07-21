export interface ExamParticipantGetByIdQuery {}

export interface ExamParticipantGetAllQuery extends ExamParticipantGetByIdQuery {
  examRoomId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}
