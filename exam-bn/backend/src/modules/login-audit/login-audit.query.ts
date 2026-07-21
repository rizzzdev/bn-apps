export interface LoginAuditGetByIdQuery {
  user?: boolean;
}

export interface LoginAuditGetAllQuery extends LoginAuditGetByIdQuery {
  userId?: string;
  page?: number;
  limit?: number;
}
