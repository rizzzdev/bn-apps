// =============================================================================
//  internship-data.port.ts  —  cross-module outbound port for internship data
//  Modules lain (master, academic, learn) membaca konteks magang lewat port
//  ini — tidak boleh import langsung prisma internship.
// =============================================================================

export interface InternshipIndustryMentor {
  id: string;
  name: string;
  email: string | null;
  userId: string | null;
  companyId: string | null;
}

export interface InternshipStudent {
  id: string;
  name: string;
  email: string | null;
  nisn: string | null;
  userId: string | null;
}

export interface InternshipTeacher {
  id: string;
  name: string;
  email: string | null;
  nip: string | null;
  userId: string | null;
}

export interface InternshipCompany {
  id: string;
  name: string;
  address: string | null;
  quota: number | null;
}

// -- Repository ports ---------------------------------------------------------
export interface IInternshipIndustryMentorRepository {
  findById(id: string): Promise<InternshipIndustryMentor | null>;
  findByUserId(userId: string): Promise<InternshipIndustryMentor | null>;
  findByEmail(email: string): Promise<InternshipIndustryMentor | null>;
}

export interface IInternshipStudentRepository {
  findById(id: string): Promise<InternshipStudent | null>;
  findByUserId(userId: string): Promise<InternshipStudent | null>;
  findByEmail(email: string): Promise<InternshipStudent | null>;
}

export interface IInternshipTeacherRepository {
  findById(id: string): Promise<InternshipTeacher | null>;
  findByUserId(userId: string): Promise<InternshipTeacher | null>;
  findByEmail(email: string): Promise<InternshipTeacher | null>;
}

export interface IInternshipCompanyRepository {
  findById(id: string): Promise<InternshipCompany | null>;
}

export interface IInternshipPlacementRepository {
  findActiveByStudentId(studentId: string): Promise<InternshipPlacement | null>;
  findById(id: string): Promise<InternshipPlacement | null>;
}

export interface InternshipPlacement {
  id: string;
  studentId: string;
  companyId: string;
  teacherId: string;
  industryMentorId: string | null;
  status: string;
  startDate: Date;
  endDate: Date;
}
