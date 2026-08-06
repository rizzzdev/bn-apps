import { TeacherPicketScheduleRepository, teacherPicketScheduleRepository } from '#academic/modules/teacher-picket-schedules/repository';
import { NotFoundError, parseExcel, buildHeaderLabelMap, generateExcelTemplate, buildExcelExport } from '#app';
import type { HeaderSpec } from '#app';
import type { CreateTeacherPicketScheduleDto, UpdateTeacherPicketScheduleDto } from '#academic/modules/teacher-picket-schedules/domain';
import { getOrchestrator } from '#app/orchestrator.js';
import { prisma } from '#academic/database/index.js';

const TEACHER_PICKET_SCHEDULE_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Email Guru', key: 'email', width: 32 },
  { label: 'Hari', key: 'day', width: 12 },
];

// Sesuai enum day di schema (z.enum(['Senin','Selasa','Rabu','Kamis','Jumat'])).
const PICKET_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export class TeacherPicketScheduleService {
  constructor(private repository: TeacherPicketScheduleRepository) {}

  async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, limit),
      this.repository.count(),
    ]);
    return { data, total };
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Teacher picket schedule tidak ditemukan');
    return item;
  }

  async create(data: CreateTeacherPicketScheduleDto) {
    // Check if teacher already has ANY schedule (one teacher = one day per week)
    const existingAnyDay = await prisma.teacherPicketSchedule.findFirst({
      where: {
        teacherId: data.teacherId,
        deletedAt: null,
      },
    });

    if (existingAnyDay) {
      if (existingAnyDay.day === data.day) {
        // Same day → reactivate if soft-deleted, or just return existing
        return this.repository.update(existingAnyDay.id, {
          status: data.status || 'Aktif',
          deletedAt: null,
        } as any);
      }
      throw new Error(`Guru sudah memiliki jadwal piket di hari ${existingAnyDay.day}`);
    }

    return this.repository.create(data as any);
  }

  async update(id: string, data: UpdateTeacherPicketScheduleDto) {
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

  async createBulk(items: CreateTeacherPicketScheduleDto[]) {
    if (!items || items.length === 0) return { created: 0 };

    let count = 0;
    for (const item of items) {
      await this.create(item);
      count++;
    }
    return { created: count };
  }

  /** Generate template Excel kosong (label Indonesia + sample row + dropdown hari). */
  async getExcelTemplate(): Promise<Buffer> {
    return generateExcelTemplate(TEACHER_PICKET_SCHEDULE_EXCEL_HEADERS, 'Jadwal Piket', {
      email: 'guru@example.com',
      day: 'Senin',
    }, {
      day: PICKET_DAYS,
    });
  }

  /** Export seluruh jadwal piket (tanpa pagination). Email guru via lookup id → master. */
  async getExcelExport() {
    const items = await this.repository.findAll(0, 100000);

    const teacherIds = [...new Set(items.map((i) => i.teacherId))];
    const masterTeachers = teacherIds.length
      ? await getOrchestrator().masterTeacher.findByIds(teacherIds)
      : [];
    const emailByTeacherId = new Map(masterTeachers.map((t) => [t.id, t.email ?? '']));
    const fullnameByTeacherId = new Map(masterTeachers.map((t) => [t.id, t.fullname]));

    const specs: HeaderSpec[] = [
      { label: 'Email Guru', key: 'email', width: 32 },
      { label: 'Hari', key: 'day', width: 12 },
      { label: 'Nama Guru', key: 'fullname', width: 30 },
      { label: 'Status', key: 'status', width: 12 },
    ];

    return buildExcelExport(
      'Jadwal Piket',
      specs,
      items.map((p) => ({
        email: emailByTeacherId.get(p.teacherId) ?? '',
        day: p.day,
        fullname: fullnameByTeacherId.get(p.teacherId) ?? '',
        status: p.status ?? 'Aktif',
      })),
    );
  }

  /**
   * Import jadwal piket guru dari Excel (1 baris = 1 guru di 1 hari).
   * Lookup guru via EMAIL (orchestrator master — shadow_teachers tidak menyimpan
   * email, tetapi ID shadow == ID master).
   * Diproses berurutan agar deterministik: konflik "guru sudah punya piket di hari
   * lain" (aturan 1 guru = 1 hari di service `create`) masuk `failedRows`;
   * hari sama → reactivate (dianggap sukses, duplicate-safe).
   */
  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = Record<string, unknown>;
    const rows = await parseExcel<RawRow>(
      buffer,
      ['email', 'day'],
      buildHeaderLabelMap(TEACHER_PICKET_SCHEDULE_EXCEL_HEADERS),
    );

    const masterTeachers = await getOrchestrator().masterTeacher.findAll();

    const teacherByEmail = new Map<string, string>();
    for (const t of masterTeachers) {
      if (t.email) teacherByEmail.set(t.email.trim().toLowerCase(), t.id);
    }

    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const preparedRows: Array<CreateTeacherPicketScheduleDto & { rowData: Record<string, unknown> }> = [];
    const seenPairs = new Set<string>();

    for (const raw of rows) {
      const email = raw['email'] ? String(raw['email']).trim().toLowerCase() : '';
      const day = raw['day'] ? String(raw['day']).trim() : '';

      const rowData: Record<string, unknown> = {
        email: raw['email'],
        day: raw['day'],
      };

      const teacherId = teacherByEmail.get(email);
      if (!teacherId) {
        failedRows.push({ ...rowData, reason: `Guru dengan email ${email} tidak ditemukan` });
        continue;
      }
      if (!PICKET_DAYS.includes(day)) {
        failedRows.push({ ...rowData, reason: `Hari tidak valid: ${day} (harus ${PICKET_DAYS.join(' / ')})` });
        continue;
      }

      const pairKey = `${teacherId}_${day}`;
      if (seenPairs.has(pairKey)) {
        failedRows.push({ ...rowData, reason: 'Duplikat dalam file (guru + hari sama)' });
        continue;
      }
      seenPairs.add(pairKey);

      preparedRows.push({
        teacherId,
        day: day as CreateTeacherPicketScheduleDto['day'],
        status: 'Aktif' as CreateTeacherPicketScheduleDto['status'],
        rowData,
      });
    }

    const successRows: Array<any> = [];
    // Berurutan (bukan paralel) agar pengecekan "1 guru = 1 hari" deterministik.
    for (const row of preparedRows) {
      const { rowData, ...dto } = row;
      try {
        const item = await this.create(dto as CreateTeacherPicketScheduleDto);
        successRows.push(item);
      } catch (err: any) {
        failedRows.push({ ...rowData, reason: err?.message ?? 'Gagal menyimpan baris' });
      }
    }

    return {
      createdItems: successRows,
      successCount: successRows.length,
      successRows,
      failedRows,
    };
  }
}

export const teacherPicketSchedulesService = new TeacherPicketScheduleService(teacherPicketScheduleRepository);
