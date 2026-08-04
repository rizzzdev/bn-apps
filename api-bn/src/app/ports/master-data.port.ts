export type Role = "super_admin" | "teacher" | "student" | "industry_mentor";

export interface MasterAcademicYear {
  id: string;
  code: string;
  semesterType: string;
  status: string;
  semesters?: Array<{ type: string }>;
}

export interface MasterClass {
  id: string;
  name: string;
  majorId: string;
  majorCode?: string | null;
  academicYear?: string | null;
  semester?: number;
}

export interface MasterTeacher {
  id: string;
  fullname: string;
  prefixTitle: string | null;
  suffixTitle: string | null;
  gender: string | null;
  nip: string | null;
  email: string | null;
  userId: string;
  status: string | null;
}

export interface MasterStudent {
  id: string;
  fullname: string;
  gender: string | null;
  nis: string | null;
  nisn: string | null;
  email: string | null;
  userId: string;
  status: string | null;
}

export interface MasterSubject {
  id: string;
  code: string;
  name: string;
}

export interface MasterMajor {
  id: string;
  code: string;
  name: string;
}

export interface IMasterAcademicYearRepository {
  findActive(): Promise<MasterAcademicYear | null>;
  findById(id: string): Promise<MasterAcademicYear | null>;
  findLatest(): Promise<MasterAcademicYear | null>;
  findAll(): Promise<MasterAcademicYear[]>;
}

export interface IMasterClassRepository {
  findById(id: string): Promise<MasterClass | null>;
  findByIds(ids: string[]): Promise<MasterClass[]>;
  findAll(): Promise<MasterClass[]>;
}

export interface IMasterTeacherRepository {
  findById(id: string): Promise<MasterTeacher | null>;
  findByIds(ids: string[]): Promise<MasterTeacher[]>;
  findByUserId(userId: string): Promise<MasterTeacher | null>;
  findByEmail(email: string): Promise<MasterTeacher | null>;
  findAll(): Promise<MasterTeacher[]>;
}

export interface IMasterSubjectRepository {
  findById(id: string): Promise<MasterSubject | null>;
  findByIds(ids: string[]): Promise<MasterSubject[]>;
  findAll(): Promise<MasterSubject[]>;
}

export interface IMasterMajorRepository {
  findById(id: string): Promise<MasterMajor | null>;
  findByIds(ids: string[]): Promise<MasterMajor[]>;
  findAll(): Promise<MasterMajor[]>;
}

export interface IMasterStudentRepository {
  findById(id: string): Promise<MasterStudent | null>;
  findByIds(ids: string[]): Promise<MasterStudent[]>;
  findByUserId(userId: string): Promise<MasterStudent | null>;
  findByEmail(email: string): Promise<MasterStudent | null>;
  findAll(): Promise<MasterStudent[]>;
  updateCurrentClass(studentId: string, currentClassId: string | null, autoMajorId?: string | null): Promise<void>;
  updateCurrentMajor(studentId: string, currentMajorId: string | null): Promise<void>;
  updateStatus(studentId: string, status: 'Aktif' | 'Tidak_Aktif' | 'Lulus'): Promise<void>;
}

export interface IMasterAuthRepository {
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
}
