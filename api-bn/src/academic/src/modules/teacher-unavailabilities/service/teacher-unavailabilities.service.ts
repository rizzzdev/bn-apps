import { teacherUnavailabilityRepository } from '../repository';
import type { TeacherUnavailabilityRepository } from '../repository';
import type { CreateTeacherUnavailabilityDto, BulkSetTeacherUnavailabilityDto } from '../domain';
import { buildExcelExport, parseExcel, buildHeaderLabelMap, generateExcelTemplate } from '#app';
import type { HeaderSpec } from '#app';
import { getOrchestrator } from '#app/orchestrator.js';
import { prisma } from '#academic/database/index.js';

const TEACHER_UNAVAILABILITY_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Email Guru', key: 'email', width: 32 },
  { label: 'Hari', key: 'day', width: 12 },
  { label: 'Jam ke-', key: 'lessonHourName', width: 14 },
];

const WORK_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export class TeacherUnavailabilityService {
  constructor(private repository: TeacherUnavailabilityRepository) {}

  async getAll(teacherId?: string) {
    return this.repository.findAll(teacherId);
  }

  async create(data: CreateTeacherUnavailabilityDto) {
    return this.repository.create(data);
  }

  async bulkSet(data: BulkSetTeacherUnavailabilityDto) {
    return this.repository.bulkSet(data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }

  async bulkDelete(ids: string[]) {
    return this.repository.bulkSoftDelete(ids);
  }

  /** Generate template Excel kosong (label Indonesia + sample row + dropdown hari & jam ke-). */
  async getExcelTemplate(): Promise<Buffer> {
    const lessonHours = await prisma.lessonHour.findMany({ where: { deletedAt: null } });
    const hourNames = lessonHours.map((h) => h.name).filter((h): h is string => Boolean(h));
    return generateExcelTemplate(TEACHER_UNAVAILABILITY_EXCEL_HEADERS, 'Halangan Guru', {
      email: 'guru@example.com',
      day: 'Senin',
      lessonHourName: hourNames[0] ?? 'Jam 1',
    }, {
      day: WORK_DAYS,
      lessonHourName: hourNames,
    });
  }

  /**
   * Import halangan guru dari Excel (long format: 1 baris = 1 slot terblokir).
   * Lookup guru via email (orchestrator master), jam via lesson_hours.name.
   * Baris dikelompokkan per guru lalu memanggil bulkSet (mode replace, konsisten
   * dengan perilaku "Simpan Halangan" di UI). Baris gagal masuk `failedRows`.
   */
  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = Record<string, unknown>;
    const rows = await parseExcel<RawRow>(
      buffer,
      ['email', 'day', 'lessonHourName'],
      buildHeaderLabelMap(TEACHER_UNAVAILABILITY_EXCEL_HEADERS),
    );

    const [masterTeachers, lessonHours] = await Promise.all([
      getOrchestrator().masterTeacher.findAll(),
      prisma.lessonHour.findMany({ where: { deletedAt: null } }),
    ]);

    const teacherByEmail = new Map<string, string>();
    for (const t of masterTeachers) {
      if (t.email) teacherByEmail.set(t.email.trim().toLowerCase(), t.id);
    }
    const hourByName = new Map<string, string>();
    for (const h of lessonHours) {
      hourByName.set(h.name.trim().toLowerCase(), h.id);
    }

    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const rowsByTeacher = new Map<string, Array<{ day: string; lessonHourId: string }>>();

    for (const raw of rows) {
      const email = raw['email'] ? String(raw['email']).trim().toLowerCase() : '';
      const day = raw['day'] ? String(raw['day']).trim() : '';
      const lessonHourName = raw['lessonHourName'] ? String(raw['lessonHourName']).trim() : '';

      const rowData: Record<string, unknown> = {
        email: raw['email'],
        day: raw['day'],
        lessonHourName: raw['lessonHourName'],
      };

      const teacherId = teacherByEmail.get(email);
      if (!teacherId) {
        failedRows.push({ ...rowData, reason: `Guru dengan email ${email} tidak ditemukan` });
        continue;
      }
      if (!WORK_DAYS.includes(day)) {
        failedRows.push({ ...rowData, reason: `Hari tidak valid: ${day} (harus ${WORK_DAYS.join(' / ')})` });
        continue;
      }
      const lessonHourId = hourByName.get(lessonHourName.toLowerCase());
      if (!lessonHourId) {
        failedRows.push({ ...rowData, reason: `Jam pelajaran "${raw['lessonHourName']}" tidak ditemukan` });
        continue;
      }

      const list = rowsByTeacher.get(teacherId) || [];
      list.push({ day, lessonHourId });
      rowsByTeacher.set(teacherId, list);
    }

    const successRows: Array<any> = [];
    await Promise.all(
      Array.from(rowsByTeacher.entries()).map(async ([teacherId, slots]) => {
        // Dedupe slot (day + hour) dalam satu guru.
        const seen = new Set<string>();
        const uniq = slots.filter((s) => {
          const key = `${s.day}_${s.lessonHourId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        try {
          const items = await this.bulkSet({ teacherId, unavailabilities: uniq });
          successRows.push(...items);
        } catch (err: any) {
          failedRows.push({
            email: teacherId,
            reason: err?.message ?? 'Gagal menyimpan halangan guru',
          });
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


  /** Export seluruh halangan guru (tanpa pagination), kompatibel untuk di-import ulang. */
  async getExcelExport() {
    const items = await prisma.teacherUnavailability.findMany({
      where: { deletedAt: null },
      include: { lessonHour: true },
    });
    const teacherIds = [...new Set(items.map((i) => i.teacherId).filter((id): id is string => Boolean(id)))];
    const masterTeachers = teacherIds.length ? await getOrchestrator().masterTeacher.findByIds(teacherIds) : [];
    const emailByTeacherId = new Map(masterTeachers.map((t) => [t.id, t.email ?? '']));
    return buildExcelExport(
      'Halangan Guru',
      TEACHER_UNAVAILABILITY_EXCEL_HEADERS,
      items.map((r) => ({
        email: emailByTeacherId.get(r.teacherId) ?? '',
        day: r.day,
        lessonHourName: r.lessonHour?.name ?? '',
      })),
    );
  }
}

export const teacherUnavailabilityService = new TeacherUnavailabilityService(teacherUnavailabilityRepository);
