import { prisma } from '#master/database/index.js';
import { sentriAuth } from '#auth';
import { studentService } from '#master/modules/student/service';
import type { Teacher as PrismaTeacher, Student as PrismaStudent, AcademicYear, Class, Subject, Major } from '#master/database/index.js';
import type {
  MasterAcademicYear,
  MasterClass,
  MasterTeacher,
  MasterSubject,
  MasterMajor,
  MasterStudent,
  IMasterAcademicYearRepository,
  IMasterClassRepository,
  IMasterTeacherRepository,
  IMasterSubjectRepository,
  IMasterMajorRepository,
  IMasterStudentRepository,
  IMasterAuthRepository,
  Role,
} from '#app/ports/master-data.port.js';

export class MasterAcademicYearRepository implements IMasterAcademicYearRepository {
  private async map(year: AcademicYear & { semesters?: Array<{ type: string }> } | null): Promise<MasterAcademicYear | null> {
    if (!year) return null;
    return {
      id: year.id,
      code: year.code,
      semesterType: year.semesters?.[0]?.type ?? '',
      status: year.status,
    };
  }

  async findActive(): Promise<MasterAcademicYear | null> {
    const year = await prisma.academicYear.findFirst({
      where: { status: 'Aktif', deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { semesters: { where: { deletedAt: null } } },
    });
    return this.map(year);
  }

  async findById(id: string): Promise<MasterAcademicYear | null> {
    const year = await prisma.academicYear.findFirst({
      where: { id, deletedAt: null },
      include: { semesters: { where: { deletedAt: null } } },
    });
    return this.map(year);
  }

  async findLatest(): Promise<MasterAcademicYear | null> {
    const year = await prisma.academicYear.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { semesters: { where: { deletedAt: null } } },
    });
    return this.map(year);
  }

  async findAll(): Promise<MasterAcademicYear[]> {
    const years = await prisma.academicYear.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { semesters: { where: { deletedAt: null } } },
    });
    const mapped = await Promise.all(years.map((y) => this.map(y)));
    return mapped.filter((y): y is MasterAcademicYear => y !== null);
  }
}

export class MasterClassRepository implements IMasterClassRepository {
  async findById(id: string): Promise<MasterClass | null> {
    const cls = await prisma.class.findFirst({
      where: { id, deletedAt: null },
    });
    if (!cls) return null;
    return { id: cls.id, name: cls.name, majorId: cls.majorId };
  }

  async findByIds(ids: string[]): Promise<MasterClass[]> {
    const classes = await prisma.class.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
    return classes.map((c) => ({ id: c.id, name: c.name, majorId: c.majorId }));
  }

  async findAll(): Promise<MasterClass[]> {
    const classes = await prisma.class.findMany({
      where: { deletedAt: null },
      include: { major: true },
    });
    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      majorId: c.majorId,
      majorCode: (c as any).major?.code ?? null,
      academicYear: (c as any).academicYear?.code ?? null,
      semester: (c as any).semester ?? 1,
    }));
  }
}

export class MasterTeacherRepository implements IMasterTeacherRepository {
  async findById(id: string): Promise<MasterTeacher | null> {
    const teacher = await prisma.teacher.findFirst({
      where: { id, deletedAt: null },
      include: { picture: true },
    });
    if (!teacher) return null;
    return this.toDomain(teacher);
  }

  async findByUserId(userId: string): Promise<MasterTeacher | null> {
    const teacher = await prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
      include: { picture: true },
    });
    if (!teacher) return null;
    return this.toDomain(teacher);
  }

  async findByEmail(email: string): Promise<MasterTeacher | null> {
    const teacher = await prisma.teacher.findFirst({
      where: { email, deletedAt: null },
      include: { picture: true },
    });
    if (!teacher) return null;
    return this.toDomain(teacher);
  }

  async findByIds(ids: string[]): Promise<MasterTeacher[]> {
    const teachers = await prisma.teacher.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: { picture: true },
    });
    return teachers.map((t) => this.toDomain(t));
  }

  async findAll(): Promise<MasterTeacher[]> {
    const teachers = await prisma.teacher.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { picture: true },
    });
    return teachers.map((t) => this.toDomain(t));
  }

  async findAllActive(): Promise<MasterTeacher[]> {
    const teachers = await prisma.teacher.findMany({
      where: { deletedAt: null, status: 'Aktif' },
      orderBy: { createdAt: 'desc' },
      include: { picture: true },
    });
    return teachers.map((t) => this.toDomain(t));
  }

  private toDomain(teacher: PrismaTeacher & { picture?: { url: string } | null }): MasterTeacher {
    return {
      id: teacher.id,
      fullname: teacher.fullname,
      prefixTitle: teacher.prefixTitle,
      suffixTitle: teacher.suffixTitle,
      gender: teacher.gender ?? null,
      nip: teacher.nip,
      email: teacher.email,
      userId: teacher.userId,
      status: teacher.status ?? null,
      pictureUrl: teacher.picture?.url ?? null,
    };
  }
}

export class MasterSubjectRepository implements IMasterSubjectRepository {
  async findById(id: string): Promise<MasterSubject | null> {
    const subject = await prisma.subject.findFirst({
      where: { id, deletedAt: null },
    });
    if (!subject) return null;
    return { id: subject.id, code: subject.code, name: subject.name };
  }

  async findByIds(ids: string[]): Promise<MasterSubject[]> {
    const subjects = await prisma.subject.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
    return subjects.map((s) => ({ id: s.id, code: s.code, name: s.name }));
  }

  async findAll(): Promise<MasterSubject[]> {
    const subjects = await prisma.subject.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return subjects.map((s) => ({ id: s.id, code: s.code, name: s.name }));
  }
}

export class MasterMajorRepository implements IMasterMajorRepository {
  async findById(id: string): Promise<MasterMajor | null> {
    const major = await prisma.major.findFirst({
      where: { id, deletedAt: null },
    });
    if (!major) return null;
    return { id: major.id, code: major.code, name: major.name };
  }

  async findByIds(ids: string[]): Promise<MasterMajor[]> {
    const majors = await prisma.major.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
    return majors.map((m) => ({ id: m.id, code: m.code, name: m.name }));
  }

  async findAll(): Promise<MasterMajor[]> {
    const majors = await prisma.major.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return majors.map((m) => ({ id: m.id, code: m.code, name: m.name }));
  }
}

export class MasterStudentRepository implements IMasterStudentRepository {
  async findById(id: string): Promise<MasterStudent | null> {
    const student = await prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: { picture: true },
    });
    if (!student) return null;
    return this.toDomain(student);
  }

  async findByUserId(userId: string): Promise<MasterStudent | null> {
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      include: { picture: true },
    });
    if (!student) return null;
    return this.toDomain(student);
  }

  async findByEmail(email: string): Promise<MasterStudent | null> {
    const student = await prisma.student.findFirst({
      where: { email, deletedAt: null },
      include: { picture: true },
    });
    if (!student) return null;
    return this.toDomain(student);
  }

  async findByIds(ids: string[]): Promise<MasterStudent[]> {
    const students = await prisma.student.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: { picture: true },
    });
    return students.map((s) => this.toDomain(s));
  }

  async findAll(): Promise<MasterStudent[]> {
    const students = await prisma.student.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { picture: true },
    });
    return students.map((s) => this.toDomain(s));
  }

  async findAllActive(): Promise<MasterStudent[]> {
    const students = await prisma.student.findMany({
      where: { deletedAt: null, status: 'Aktif' },
      orderBy: { createdAt: 'desc' },
      include: { picture: true },
    });
    return students.map((s) => this.toDomain(s));
  }

  async updateCurrentClass(studentId: string, currentClassId: string | null, autoMajorId?: string | null): Promise<void> {
    await studentService.updateCurrentClass(studentId, { currentClassId });
    if (autoMajorId !== undefined) {
      await studentService.updateCurrentMajor(studentId, { currentMajorId: autoMajorId });
    }
  }

  async updateCurrentMajor(studentId: string, currentMajorId: string | null): Promise<void> {
    await studentService.updateCurrentMajor(studentId, { currentMajorId });
  }

  async updateStatus(studentId: string, status: 'Aktif' | 'Tidak_Aktif' | 'Lulus'): Promise<void> {
    await studentService.updateStatus(studentId, status as any);
  }

  private toDomain(student: PrismaStudent & { picture?: { url: string } | null }): MasterStudent {
    return {
      id: student.id,
      fullname: student.fullname,
      gender: student.gender ?? null,
      nis: student.nis,
      nisn: student.nisn,
      email: student.email,
      userId: student.userId,
      status: student.status ?? null,
      pictureUrl: student.picture?.url ?? null,
    };
  }
}


import { authDataService } from '#auth/services/auth-data.service.js';

export class MasterAuthRepository implements IMasterAuthRepository {
  register(data: { identifiers: Array<{ type: string; value: string }>; password: string; roles: Role[] }) {
    return authDataService.register(data);
  }
  bulkRegister(data: Array<{ identifiers: Array<{ type: string; value: string }>; password: string; roles: Role[] }>) {
    return authDataService.bulkRegister(data);
  }
  updateIdentifiers(userId: string, identifiers: Array<{ type: string; value: string }>) {
    return authDataService.updateIdentifiers(userId, identifiers);
  }
  changePassword(userId: string, newPassword: string) {
    return authDataService.changePassword(userId, newPassword);
  }
  deleteUser(userId: string) {
    return authDataService.deleteUser(userId);
  }
  bulkDeleteUsers(userIds: string[]) {
    return authDataService.bulkDeleteUsers(userIds);
  }
}
