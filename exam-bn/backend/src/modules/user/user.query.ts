export interface UserGetByIdQuery {
  loginAudits?: boolean;
  examParticipants?: boolean;
  examSupervisors?: boolean;
}

export interface UserGetAllQuery extends UserGetByIdQuery {
  username?: string;
  role?: string;
  page?: number;
  limit?: number;
}
