export interface ExamSupervisorGetByIdQuery {}

export interface ExamSupervisorGetAllQuery extends ExamSupervisorGetByIdQuery {
  examRoomId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}
