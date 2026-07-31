// =============================================================================
//  internship-data.service.ts  —  concrete impls of internship-data port
//  (type-safe: toleransi schema drift tanpa `as any` liar)
// =============================================================================
import { prisma, PlacementStatus } from '@internship/database/index.js';
import {
  InternshipIndustryMentor,
  InternshipStudent,
  InternshipTeacher,
  InternshipCompany,
  InternshipPlacement,
  IInternshipIndustryMentorRepository,
  IInternshipStudentRepository,
  IInternshipTeacherRepository,
  IInternshipCompanyRepository,
  IInternshipPlacementRepository,
} from '@app/ports/internship-data.port.js';

// -- helpers -----------------------------------------------------------------
function nulStr(v: unknown): string | null { return typeof v === 'string' ? v : null; }
function numOrNull(v: unknown): number | null { return typeof v === 'number' ? v : null; }

export class InternshipIndustryMentorRepository implements IInternshipIndustryMentorRepository {
  async findById(id: string): Promise<InternshipIndustryMentor | null> {
    const m = await prisma.industryMentor.findFirst({ where: { id, deletedAt: null } });
    if (!m) return null;
    return { id: m.id, name: m.name, email: m.email, userId: m.userId, companyId: m.companyId };
  }
  async findByUserId(userId: string): Promise<InternshipIndustryMentor | null> {
    const m = await prisma.industryMentor.findFirst({ where: { userId, deletedAt: null } });
    if (!m) return null;
    return { id: m.id, name: m.name, email: m.email, userId: m.userId, companyId: m.companyId };
  }
  async findByEmail(email: string): Promise<InternshipIndustryMentor | null> {
    const m = await prisma.industryMentor.findFirst({ where: { email, deletedAt: null } });
    if (!m) return null;
    return { id: m.id, name: m.name, email: m.email, userId: m.userId, companyId: m.companyId };
  }
}

export class InternshipStudentRepository implements IInternshipStudentRepository {
  async findById(id: string): Promise<InternshipStudent | null> {
    const s = await prisma.student.findFirst({ where: { id, deletedAt: null } });
    if (!s) return null;
    return { id: s.id, name: s.name, email: s.email, nisn: s.nisn, userId: s.userId };
  }
  async findByUserId(userId: string): Promise<InternshipStudent | null> {
    const s = await prisma.student.findFirst({ where: { userId, deletedAt: null } });
    if (!s) return null;
    return { id: s.id, name: s.name, email: s.email, nisn: s.nisn, userId: s.userId };
  }
  async findByEmail(email: string): Promise<InternshipStudent | null> {
    const s = await prisma.student.findFirst({ where: { email, deletedAt: null } });
    if (!s) return null;
    return { id: s.id, name: s.name, email: s.email, nisn: s.nisn, userId: s.userId };
  }
}

export class InternshipTeacherRepository implements IInternshipTeacherRepository {
  async findById(id: string): Promise<InternshipTeacher | null> {
    const t = await prisma.teacher.findFirst({ where: { id, deletedAt: null } });
    if (!t) return null;
    return { id: t.id, name: t.name, email: t.email, nip: t.nip, userId: t.userId };
  }
  async findByUserId(userId: string): Promise<InternshipTeacher | null> {
    const t = await prisma.teacher.findFirst({ where: { userId, deletedAt: null } });
    if (!t) return null;
    return { id: t.id, name: t.name, email: t.email, nip: t.nip, userId: t.userId };
  }
  async findByEmail(email: string): Promise<InternshipTeacher | null> {
    const t = await prisma.teacher.findFirst({ where: { email, deletedAt: null } });
    if (!t) return null;
    return { id: t.id, name: t.name, email: t.email, nip: t.nip, userId: t.userId };
  }
}

export class InternshipCompanyRepository implements IInternshipCompanyRepository {
  async findById(id: string): Promise<InternshipCompany | null> {
    const c = await prisma.company.findFirst({ where: { id, deletedAt: null } });
    if (!c) return null;
    return { id: c.id, name: c.name, address: c.address, quota: numOrNull(c.quota) };
  }
}

export class InternshipPlacementRepository implements IInternshipPlacementRepository {
  // Use Prisma's generated PlacementStatus enum (active string) — no hard-coded literals.
  async findActiveByStudentId(studentId: string): Promise<InternshipPlacement | null> {
    const p = await prisma.internshipPlacement.findFirst({
      where: { studentId, status: PlacementStatus.active, deletedAt: null },
    });
    return p ? this.toDomain(p) : null;
  }

  async findById(id: string): Promise<InternshipPlacement | null> {
    const p = await prisma.internshipPlacement.findFirst({ where: { id, deletedAt: null } });
    return p ? this.toDomain(p) : null;
  }

  private toDomain(p: {
    id: string; studentId: string; companyId: string; teacherId: string;
    industryMentorId: string | null; status: string; startDate: Date; endDate: Date;
  }): InternshipPlacement {
    return {
      id: p.id,
      studentId: p.studentId,
      companyId: p.companyId,
      teacherId: p.teacherId,
      industryMentorId: p.industryMentorId,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
    };
  }
}
