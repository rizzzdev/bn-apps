import { SubjectTeacherRepository, subjectTeacherRepository } from '#academic/modules/subject-teachers/repository';
import { NotFoundError, buildExcelExport, parseExcel, buildHeaderLabelMap, generateExcelTemplate } from '#app';
import type { HeaderSpec } from '#app';
import type { CreateSubjectTeacherDto, UpdateSubjectTeacherDto } from '#academic/modules/subject-teachers/domain';
import { getOrchestrator } from '#app/orchestrator.js';

import { prisma } from '#academic/database/index.js';

const SUBJECT_TEACHER_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Email Guru', key: 'email', width: 32 },
  { label: 'Kode Mapel', key: 'subjectCode', width: 16 },
  { label: 'Target Beban JP', key: 'targetHours', width: 20 },
  { label: 'Status', key: 'status', width: 14 },
];

const SUBJECT_TEACHER_STATUSES = ['Aktif', 'TidakAktif', 'Lulus'];

export class SubjectTeacherService {
  constructor(private repository: SubjectTeacherRepository) {}

  async getAll(page: number, limit: number, subjectId?: string, status?: string) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, limit, subjectId, status),
      this.repository.count(subjectId, status),
    ]);
    return { data, total };
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Subject teacher tidak ditemukan');
    return item;
  }

  async create(data: CreateSubjectTeacherDto) {
    const existing = await prisma.subjectTeacher.findFirst({
      where: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
      },
    });

    if (existing) {
      return this.repository.update(existing.id, {
        status: data.status || 'Aktif',
        targetHours: data.targetHours !== undefined ? data.targetHours : existing.targetHours,
        deletedAt: null,
      } as any);
    }

    return this.repository.create(data as any);
  }

  async update(id: string, data: UpdateSubjectTeacherDto) {
    await this.getById(id);
    return this.repository.update(id, data as any);
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repository.softDelete(id);
  }

  async deleteBulk(ids: string[]) {
    const { count } = await this.repository.softDeleteMany(ids);
    return { deleted: count };
  }

  async updateStatusBulk(ids: string[], status: string) {
    const { count } = await this.repository.updateStatusMany(ids, status);
    return { updated: count };
  }

  async updateTargetHoursBulk(ids: string[], targetHours: number) {
    const { count } = await this.repository.updateTargetHoursMany(ids, targetHours);
    return { updated: count };
  }

  /** Bulk create JSON (endpoint POST /batch). Duplikat ditangani sama seperti `create()`. */
  async bulkCreate(items: CreateSubjectTeacherDto[]) {
    if (!items || items.length === 0) return { created: 0, failed: [] };

    const failed: Array<{ item: CreateSubjectTeacherDto; reason: string }> = [];
    let created = 0;
    for (const item of items) {
      try {
        await this.create(item);
        created++;
      } catch (err: any) {
        failed.push({ item, reason: err?.message ?? 'Gagal membuat data' });
      }
    }
    return { created, failed };
  }

  /** Generate template Excel kosong (label Indonesia + sample row + dropdown kode mapel & status). */
  async getExcelTemplate(): Promise<Buffer> {
    const subjects = await prisma.shadowSubject.findMany({ where: { deletedAt: null } });
    const subjectCodes = subjects.map((s) => s.code).filter((c): c is string => Boolean(c));
    return generateExcelTemplate(SUBJECT_TEACHER_EXCEL_HEADERS, 'Guru Mapel', {
      email: 'guru@example.com',
      subjectCode: subjectCodes[0] ?? 'MTK',
      targetHours: 24,
      status: 'Aktif',
    }, {
      subjectCode: subjectCodes,
      status: SUBJECT_TEACHER_STATUSES,
    });
  }

  /**
   * Import relasi guru-mapel dari Excel.
   * Lookup guru memakai EMAIL (via orchestrator master — shadow_teachers tidak
   * menyimpan email, tetapi ID shadow == ID master, sehingga id master dipakai
   * sebagai teacherId). Lookup mapel memakai kode di shadow_subjects.
   * Validasi per baris: baris gagal dikumpulkan di `failedRows`, tidak membatalkan baris lain.
   */
  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = Record<string, unknown>;
    const rows = await parseExcel<RawRow>(
      buffer,
      ['email', 'subjectCode'],
      buildHeaderLabelMap(SUBJECT_TEACHER_EXCEL_HEADERS),
    );

    // Phase 0: muat referensi sekali untuk lookup O(1).
    const [masterTeachers, shadowSubjects] = await Promise.all([
      getOrchestrator().masterTeacher.findAll(),
      prisma.shadowSubject.findMany({ where: { deletedAt: null } }),
    ]);

    const teacherByEmail = new Map<string, { id: string; fullname: string }>();
    for (const t of masterTeachers) {
      if (t.email) teacherByEmail.set(t.email.trim().toLowerCase(), { id: t.id, fullname: t.fullname });
    }
    const subjectByCode = new Map<string, { id: string; name: string }>();
    for (const s of shadowSubjects) {
      subjectByCode.set(s.code.trim().toLowerCase(), { id: s.id, name: s.name });
    }

    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const preparedRows: Array<CreateSubjectTeacherDto & { rowData: Record<string, unknown> }> = [];
    const seenPairs = new Set<string>(); // dedupe (teacherId, subjectId) dalam satu file

    // Phase 1: validasi setiap baris tanpa melempar exception.
    for (const raw of rows) {
      const email = raw['email'] ? String(raw['email']).trim().toLowerCase() : '';
      const subjectCode = raw['subjectCode'] ? String(raw['subjectCode']).trim().toLowerCase() : '';
      const status = raw['status'] ? String(raw['status']).trim() : 'Aktif';
      const targetHoursRaw = raw['targetHours'];
      const targetHours = targetHoursRaw === '' || targetHoursRaw === undefined || targetHoursRaw === null
        ? 0
        : Number(targetHoursRaw);

      const rowData: Record<string, unknown> = {
        email: raw['email'],
        subjectCode: raw['subjectCode'],
        targetHours: targetHoursRaw,
        status: raw['status'],
      };

      const teacher = teacherByEmail.get(email);
      if (!teacher) {
        failedRows.push({ ...rowData, reason: `Guru dengan email ${email} tidak ditemukan` });
        continue;
      }
      const subject = subjectByCode.get(subjectCode);
      if (!subject) {
        failedRows.push({ ...rowData, reason: `Mapel dengan kode ${raw['subjectCode']} tidak ditemukan` });
        continue;
      }
      if (!Number.isFinite(targetHours) || targetHours < 0) {
        failedRows.push({ ...rowData, reason: 'Target Beban JP harus berupa angka ≥ 0' });
        continue;
      }
      if (!SUBJECT_TEACHER_STATUSES.includes(status)) {
        failedRows.push({ ...rowData, reason: `Status tidak valid: ${status} (harus ${SUBJECT_TEACHER_STATUSES.join(' / ')})` });
        continue;
      }

      const pairKey = `${teacher.id}_${subject.id}`;
      if (seenPairs.has(pairKey)) {
        failedRows.push({ ...rowData, reason: 'Duplikat dalam file (guru + mapel sama)' });
        continue;
      }
      seenPairs.add(pairKey);

      preparedRows.push({
        teacherId: teacher.id,
        subjectId: subject.id,
        status: status as CreateSubjectTeacherDto['status'],
        targetHours: Math.floor(targetHours),
        rowData,
      });
    }

    // Phase 2: simpan per baris secara paralel (pasangan sudah unik di dalam file;
    // `create()` menangani duplikasi dengan data yang sudah ada di DB).
    const successRows: Array<any> = [];
    await Promise.all(
      preparedRows.map(async (row) => {
        const { rowData, ...dto } = row;
        try {
          const item = await this.create(dto as CreateSubjectTeacherDto);
          successRows.push(item);
        } catch (err: any) {
          failedRows.push({ ...rowData, reason: err?.message ?? 'Gagal menyimpan baris' });
        }
      }),
    );

    return {
      createdItems: successRows,
      successCount: successRows.length,
      successRows,
      failedRows,
    };
  }


  /** Export seluruh relasi guru-mapel (tanpa pagination), kompatibel untuk di-import ulang. */
  async getExcelExport() {
    const [items, shadowSubjects] = await Promise.all([
      prisma.subjectTeacher.findMany({ where: { deletedAt: null } }),
      prisma.shadowSubject.findMany({ where: { deletedAt: null } }),
    ]);
    const teacherIds = [...new Set(items.map((i) => i.teacherId).filter((id): id is string => Boolean(id)))];
    const masterTeachers = teacherIds.length ? await getOrchestrator().masterTeacher.findByIds(teacherIds) : [];
    const emailByTeacherId = new Map(masterTeachers.map((t) => [t.id, t.email ?? '']));
    const codeBySubjectId = new Map(shadowSubjects.map((s) => [s.id, s.code ?? '']));
    return buildExcelExport(
      'Guru Mapel',
      SUBJECT_TEACHER_EXCEL_HEADERS,
      items.map((r) => ({
        email: emailByTeacherId.get(r.teacherId) ?? '',
        subjectCode: codeBySubjectId.get(r.subjectId) ?? '',
        targetHours: r.targetHours,
        status: r.status,
      })),
    );
  }
}

export const subjectTeachersService = new SubjectTeacherService(subjectTeacherRepository);
