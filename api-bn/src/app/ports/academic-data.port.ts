export interface AcademicClassStudent {
  id: string;
  classId: string;
  studentId: string;
  status: string;
}

export interface IAcademicClassStudentRepository {
  findFirst(where: { classId: string; studentId: string; status?: string }): Promise<AcademicClassStudent | null>;
  findMany(where: { classId?: { in: string[] }; studentId?: string; status?: string; deletedAt?: null }): Promise<AcademicClassStudent[]>;
  count(where: { classId?: { in: string[] }; status?: string; deletedAt?: null }): Promise<number>;
}
