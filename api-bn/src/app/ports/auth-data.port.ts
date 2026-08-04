export type Role = "super_admin" | "teacher" | "student" | "industry_mentor";

export interface AuthUserIdentifier {
  id: string;
  userId: string;
  type: string;
  value: string;
}

export interface AuthUser {
  id: string;
  roles: Role[];
  identifiers: AuthUserIdentifier[];
  createdAt: Date;
}

export interface IAuthDataRepository {
  register(data: {
    identifiers: Array<{ type: string; value: string }>;
    password: string;
    roles: Role[];
  }): Promise<{ userId: string }>;
  bulkRegister(data: Array<{
    identifiers: Array<{ type: string; value: string }>;
    password: string;
    roles: Role[];
  }>): Promise<Array<{ userId: string; email: string }>>;
  updateIdentifiers(userId: string, identifiers: Array<{ type: string; value: string }>): Promise<void>;
  changePassword(userId: string, newPassword: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  bulkDeleteUsers(userIds: string[]): Promise<void>;
  findUserById(userId: string): Promise<AuthUser | null>;
  findUsersByIds(userIds: string[]): Promise<AuthUser[]>;
  getUserIdentifiers(userId: string): Promise<AuthUserIdentifier[]>;
  findAllByRoles(roles: Role[]): Promise<Array<{ id: string; email: string | null }>>;
}
