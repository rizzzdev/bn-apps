import { MajorStudentRepository, majorStudentRepository } from '#academic/modules/major-students/repository';
import { ClassStudentRepository, classStudentRepository } from '#academic/modules/class-students/repository';
import { NotFoundError, BadRequestError, buildExcelExport, parseExcel, buildHeaderLabelMap, generateExcelTemplate } from '#app';
import type { HeaderSpec } from '#app';
import { BaseService } from '#academic/utils/index.js';
import type { CreateMajorStudentDto, UpdateMajorStudentDto } from '#academic/modules/major-students/domain';
import { getOrchestrator } from '#app/orchestrator.js';
import { prisma } from '#academic/database/index.js';

const MAJOR_STUDENT_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Email Murid', key: 'email', width: 32 },
  { label: 'Kode Jurusan', key: 'majorCode', width: 16 },
  { label: 'Status', key: 'status', width: 14 },
];

const MAJOR_STUDENT_STATUSES = ['Aktif', 'TidakAktif', 'Pindah', 'Lulus'];

export class MajorStudentService extends BaseService<any, CreateMajorStudentDto, UpdateMajorStudentDto> {
  constructor(
    protected repository: MajorStudentRepository,
    private classStudentRepository: ClassStudentRepository,
  ) {
    super(repository as any, 'Major Student');
  }

  override async create(data: CreateMajorStudentDto) {
    // Validate: student must not already have an active major
    const activeMajorStudent = await prisma.majorStudent.findFirst({
      where: {
        studentId: data.studentId,
        status: 'Aktif',
        deletedAt: null,
      },
    });

    if (activeMajorStudent) {
      throw new BadRequestError('Murid sudah memiliki jurusan aktif');
    }

    const resultRecord = await this.repository.create(data as any);
    const recordStatus = (data as any).status ?? 'Aktif';
    if (recordStatus === 'Aktif') {
      await getOrchestrator().masterStudent.updateCurrentMajor(data.studentId, data.majorId);
      await getOrchestrator().masterStudent.updateStatus(data.studentId, 'Aktif');
    }

    return resultRecord;
  }

  override async update(id: string, data: UpdateMajorStudentDto) {
    const updated = await this.repository.update(id, data as any);
    if (updated) {
      if (updated.status === 'Aktif') {
        await getOrchestrator().masterStudent.updateCurrentMajor(updated.studentId, updated.majorId);
        await getOrchestrator().masterStudent.updateStatus(updated.studentId, 'Aktif');
      } else if (updated.status === 'Lulus') {
        await getOrchestrator().masterStudent.updateCurrentMajor(updated.studentId, null);
        await getOrchestrator().masterStudent.updateStatus(updated.studentId, 'Lulus');
      } else {
        await getOrchestrator().masterStudent.updateCurrentMajor(updated.studentId, null);
        await getOrchestrator().masterStudent.updateStatus(updated.studentId, 'Tidak_Aktif');
      }
    }
    return updated;
  }

  override async createBulk(items: CreateMajorStudentDto[]) {
    if (!items || !Array.isArray(items) || items.length === 0) return { created: 0 };

    let count = 0;
    for (const item of items) {
      if (item && item.studentId && item.majorId) {
        await this.create(item);
        count++;
      }
    }
    return { created: count };
  }

  async transfer(studentIds: string[]) {
    const result: { success: { studentId: string; message: string }[]; failed: { studentId: string; message: string }[] } = {
      success: [],
      failed: [],
    };

    for (const studentId of studentIds) {
      try {
        const target = await prisma.majorStudent.findFirst({
          where: {
            studentId,
            status: 'Aktif',
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!target) {
          result.failed.push({ studentId, message: 'Tidak memiliki data major student aktif' });
          continue;
        }

        await prisma.majorStudent.update({
          where: { id: target.id },
          data: { status: 'Pindah' as const },
        });
        await getOrchestrator().masterStudent.updateCurrentMajor(studentId, null);
        await getOrchestrator().masterStudent.updateStatus(studentId, 'Tidak_Aktif');

        await prisma.classStudent.updateMany({
          where: {
            studentId,
            status: 'Aktif',
            deletedAt: null,
          },
          data: { status: 'Pindah' as const },
        });

        result.success.push({ studentId, message: 'Berhasil pindah' });
      } catch (error) {
        result.failed.push({ studentId, message: error instanceof Error ? error.message : 'Terjadi kesalahan' });
      }
    }

    return result;
  }

  async graduate(studentIds: string[]) {
    const result: { success: { studentId: string; message: string }[]; failed: { studentId: string; message: string }[] } = {
      success: [],
      failed: [],
    };

    for (const studentId of studentIds) {
      try {
        const target = await prisma.majorStudent.findFirst({
          where: {
            studentId,
            status: 'Aktif',
            deletedAt: null,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!target) {
          result.failed.push({ studentId, message: 'Tidak memiliki data major student aktif' });
          continue;
        }

        await prisma.majorStudent.update({
          where: { id: target.id },
          data: { status: 'Lulus' as const },
        });
        await getOrchestrator().masterStudent.updateCurrentMajor(studentId, null);
        await getOrchestrator().masterStudent.updateStatus(studentId, 'Lulus');

        await prisma.classStudent.updateMany({
          where: {
            studentId,
            status: 'Aktif',
            deletedAt: null,
          },
          data: { status: 'Lulus' as const },
        });

        result.success.push({ studentId, message: 'Berhasil lulus' });
      } catch (error) {
        result.failed.push({ studentId, message: error instanceof Error ? error.message : 'Terjadi kesalahan' });
      }
    }

    return result;
  }

  override async delete(id: string) {
    const item = await this.getById(id);
    await this.repository.softDelete(id);
    if (item && item.studentId) {
      await getOrchestrator().masterStudent.updateCurrentMajor(item.studentId, null);
      await getOrchestrator().masterStudent.updateStatus(item.studentId, 'Tidak_Aktif');
    }
  }

  override async deleteBulk(ids: string[]) {
    const items = await prisma.majorStudent.findMany({ where: { id: { in: ids } } });
    const { count } = await this.repository.softDeleteMany(ids);
    for (const item of items) {
      if (item && item.studentId) {
        await getOrchestrator().masterStudent.updateCurrentMajor(item.studentId, null);
        await getOrchestrator().masterStudent.updateStatus(item.studentId, 'Tidak_Aktif');
      }
    }
    return { deleted: count };
  }

  /** Generate template Excel kosong (label Indonesia + sample row + dropdown kode jurusan & status). */
  async getExcelTemplate(): Promise<Buffer> {
    const majors = await prisma.shadowMajor.findMany({ where: { deletedAt: null } });
    const majorCodes = majors.map((m) => m.code).filter((c): c is string => Boolean(c));
    return generateExcelTemplate(MAJOR_STUDENT_EXCEL_HEADERS, 'Jurusan Murid', {
      email: 'murid@example.com',
      majorCode: majorCodes[0] ?? 'RPL',
      status: 'Aktif',
    }, {
      majorCode: majorCodes,
      status: MAJOR_STUDENT_STATUSES,
    });
  }

  /**
   * Import data jurusan murid dari Excel.
   * Lookup murid via EMAIL (orchestrator master — shadow_students tidak menyimpan
   * email, tetapi ID shadow == ID master). Lookup jurusan via shadow_majors.code.
   * Tahun ajaran = tahun ajaran aktif (perilaku sama dengan UI).
   * Validasi per baris; baris gagal (termasuk murid yang sudah punya jurusan aktif)
   * dikumpulkan di `failedRows`, tidak membatalkan baris lain.
   * Dedupe per studentId: satu murid hanya boleh memiliki satu jurusan aktif.
   */
  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = Record<string, unknown>;
    const rows = await parseExcel<RawRow>(
      buffer,
      ['email', 'majorCode'],
      buildHeaderLabelMap(MAJOR_STUDENT_EXCEL_HEADERS),
    );

    const [masterStudents, shadowMajors, activeAcademicYear] = await Promise.all([
      getOrchestrator().masterStudent.findAll(),
      prisma.shadowMajor.findMany({ where: { deletedAt: null } }),
      getOrchestrator().masterAcademicYear.findActive(),
    ]);

    if (!activeAcademicYear) {
      throw new BadRequestError('Tidak ada tahun ajaran aktif');
    }

    const studentByEmail = new Map<string, string>();
    for (const s of masterStudents) {
      if (s.email) studentByEmail.set(s.email.trim().toLowerCase(), s.id);
    }
    const majorByCode = new Map<string, string>();
    for (const m of shadowMajors) {
      majorByCode.set(m.code.trim().toLowerCase(), m.id);
    }

    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const preparedRows: Array<CreateMajorStudentDto & { rowData: Record<string, unknown> }> = [];
    const seenStudents = new Set<string>();

    for (const raw of rows) {
      const email = raw['email'] ? String(raw['email']).trim().toLowerCase() : '';
      const majorCode = raw['majorCode'] ? String(raw['majorCode']).trim().toLowerCase() : '';
      const status = raw['status'] ? String(raw['status']).trim() : 'Aktif';

      const rowData: Record<string, unknown> = {
        email: raw['email'],
        majorCode: raw['majorCode'],
        status: raw['status'],
      };

      const studentId = studentByEmail.get(email);
      if (!studentId) {
        failedRows.push({ ...rowData, reason: `Murid dengan email ${email} tidak ditemukan` });
        continue;
      }
      const majorId = majorByCode.get(majorCode);
      if (!majorId) {
        failedRows.push({ ...rowData, reason: `Jurusan dengan kode ${raw['majorCode']} tidak ditemukan` });
        continue;
      }
      if (!MAJOR_STUDENT_STATUSES.includes(status)) {
        failedRows.push({ ...rowData, reason: `Status tidak valid: ${status} (harus ${MAJOR_STUDENT_STATUSES.join(' / ')})` });
        continue;
      }

      // Dedupe per murid (bukan per pasangan murid+jurusan): satu murid hanya boleh
      // punya satu jurusan aktif, sehingga muncul 2× dalam file = kesalahan user.
      if (seenStudents.has(studentId)) {
        failedRows.push({ ...rowData, reason: 'Duplikat dalam file (murid sama muncul lebih dari sekali)' });
        continue;
      }
      seenStudents.add(studentId);

      preparedRows.push({
        studentId,
        majorId,
        academicYearId: activeAcademicYear.id,
        status: status as CreateMajorStudentDto['status'],
        rowData,
      });
    }

    const successRows: Array<any> = [];
    await Promise.all(
      preparedRows.map(async (row) => {
        const { rowData, ...dto } = row;
        try {
          const item = await this.create(dto as CreateMajorStudentDto);
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


  /** Export seluruh jurusan murid (tanpa pagination), kompatibel untuk di-import ulang. */
  async getExcelExport() {
    const [items, shadowMajors] = await Promise.all([
      prisma.majorStudent.findMany({ where: { deletedAt: null } }),
      prisma.shadowMajor.findMany({ where: { deletedAt: null } }),
    ]);
    const studentIds = [...new Set(items.map((i) => i.studentId).filter((id): id is string => Boolean(id)))];
    const masterStudents = studentIds.length ? await getOrchestrator().masterStudent.findByIds(studentIds) : [];
    const emailByStudentId = new Map(masterStudents.map((s) => [s.id, s.email ?? '']));
    const codeByMajorId = new Map(shadowMajors.map((m) => [m.id, m.code ?? '']));
    return buildExcelExport(
      'Jurusan Murid',
      MAJOR_STUDENT_EXCEL_HEADERS,
      items.map((r) => ({
        email: emailByStudentId.get(r.studentId) ?? '',
        majorCode: codeByMajorId.get(r.majorId) ?? '',
        status: r.status,
      })),
    );
  }
}

export const majorStudentsService = new MajorStudentService(majorStudentRepository, classStudentRepository);
