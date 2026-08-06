import { ClassStudentRepository, classStudentRepository } from '#academic/modules/class-students/repository';
import { MajorStudentRepository, majorStudentRepository } from '#academic/modules/major-students/repository';
import { NotFoundError, BadRequestError, buildExcelExport, parseExcel, buildHeaderLabelMap, generateExcelTemplate } from '#app';
import type { HeaderSpec } from '#app';
import { BaseService } from '#academic/utils/index.js';
import type { CreateClassStudentDto, UpdateClassStudentDto } from '#academic/modules/class-students/domain';

import { getOrchestrator } from '#app/orchestrator.js';
import { prisma } from '#academic/database/index.js';

const CLASS_STUDENT_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Email Murid', key: 'email', width: 32 },
  { label: 'Nama Kelas', key: 'className', width: 18 },
  { label: 'Status', key: 'status', width: 14 },
];

const CLASS_STUDENT_STATUSES = ['Aktif', 'TidakAktif', 'NaikKelas', 'TinggalKelas', 'Pindah', 'Lulus'];

export class ClassStudentService extends BaseService<any, CreateClassStudentDto, UpdateClassStudentDto> {
  constructor(
    protected repository: ClassStudentRepository,
    private majorStudentRepository: MajorStudentRepository,
  ) {
    super(repository as any, 'Class Student');
  }

  override async create(data: CreateClassStudentDto) {
    const classRecord = await getOrchestrator().masterClass.findById(data.classId);
    if (!classRecord) {
      throw new NotFoundError('Kelas tidak ditemukan');
    }

    const activeAcademicYear = await getOrchestrator().masterAcademicYear.findActive();
    if (!activeAcademicYear) {
      throw new BadRequestError('Tidak ada tahun ajaran aktif');
    }

    // Validate: student must have an active major matching the class's major
    const activeMajorStudent = await prisma.majorStudent.findFirst({
      where: {
        studentId: data.studentId,
        status: 'Aktif',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeMajorStudent) {
      throw new BadRequestError('Murid tidak memiliki jurusan aktif');
    }

    if (activeMajorStudent.majorId !== classRecord.majorId) {
      throw new BadRequestError(
        'Jurusan murid tidak sesuai dengan jurusan kelas',
      );
    }

    // Validate: student must not already have an active class
    const activeClassStudent = await prisma.classStudent.findFirst({
      where: {
        studentId: data.studentId,
        status: 'Aktif',
        deletedAt: null,
      },
    });

    if (activeClassStudent) {
      throw new BadRequestError('Murid sudah memiliki kelas aktif');
    }

    const resultRecord = await this.repository.create(data as any);
    const recordStatus = (data as any).status ?? 'Aktif';
    if (recordStatus === 'Aktif') {
      await getOrchestrator().masterStudent.updateCurrentClass(data.studentId, data.classId, classRecord.majorId);
      await getOrchestrator().masterStudent.updateStatus(data.studentId, 'Aktif');
    }

    return resultRecord;
  }

  override async update(id: string, data: UpdateClassStudentDto) {
    const updated = await this.repository.update(id, data as any);
    if (updated) {
      if (updated.status === 'Aktif') {
        const classRecord = await getOrchestrator().masterClass.findById(updated.classId);
        await getOrchestrator().masterStudent.updateCurrentClass(updated.studentId, updated.classId, classRecord?.majorId);
        await getOrchestrator().masterStudent.updateStatus(updated.studentId, 'Aktif');
      } else if (updated.status === 'Lulus') {
        await getOrchestrator().masterStudent.updateCurrentClass(updated.studentId, null, null);
        await getOrchestrator().masterStudent.updateStatus(updated.studentId, 'Lulus');
      } else {
        await getOrchestrator().masterStudent.updateCurrentClass(updated.studentId, null, null);
        await getOrchestrator().masterStudent.updateStatus(updated.studentId, 'Tidak_Aktif');
      }
    }
    return updated;
  }

  override async createBulk(items: CreateClassStudentDto[]) {
    if (!items || !Array.isArray(items) || items.length === 0) return { created: 0 };

    let count = 0;
    for (const item of items) {
      if (item && item.studentId && item.classId) {
        await this.create(item);
        count++;
      }
    }
    return { created: count };
  }

  async promote(studentIds: string[], targetClassId: string) {
    const result: { success: { studentId: string; message: string }[]; failed: { studentId: string; message: string }[] } = {
      success: [],
      failed: [],
    };

    const targetClass = await getOrchestrator().masterClass.findById(targetClassId);

    for (const studentId of studentIds) {
      try {
        const activeClassStudent = await this.repository.findActiveByStudentId(studentId);
        if (!activeClassStudent) {
          result.failed.push({ studentId, message: 'Tidak memiliki data class student aktif' });
          continue;
        }

        const activeAcademicYear = (await getOrchestrator().masterAcademicYear.findActive())
          ?? await getOrchestrator().masterAcademicYear.findById(activeClassStudent.academicYearId);

        if (!activeAcademicYear) {
          result.failed.push({ studentId, message: 'Tidak ada academic year aktif' });
          continue;
        }

        await this.repository.update(activeClassStudent.id, { status: 'NaikKelas' as const });

        await this.repository.create({
          classId: targetClassId,
          studentId,
          academicYearId: activeAcademicYear.id,
          status: 'Aktif' as const,
        });

        await getOrchestrator().masterStudent.updateCurrentClass(studentId, targetClassId, targetClass?.majorId);
        await getOrchestrator().masterStudent.updateStatus(studentId, 'Aktif');

        result.success.push({ studentId, message: 'Berhasil naik kelas' });
      } catch (error) {
        result.failed.push({ studentId, message: error instanceof Error ? error.message : 'Terjadi kesalahan' });
      }
    }

    return result;
  }

  async hold(studentIds: string[], targetClassId: string) {
    const result: { success: { studentId: string; message: string }[]; failed: { studentId: string; message: string }[] } = {
      success: [],
      failed: [],
    };

    const targetClass = await getOrchestrator().masterClass.findById(targetClassId);

    for (const studentId of studentIds) {
      try {
        const activeClassStudent = await this.repository.findActiveByStudentId(studentId);
        if (!activeClassStudent) {
          result.failed.push({ studentId, message: 'Tidak memiliki data class student aktif' });
          continue;
        }

        const activeAcademicYear = (await getOrchestrator().masterAcademicYear.findActive())
          ?? await getOrchestrator().masterAcademicYear.findById(activeClassStudent.academicYearId);

        if (!activeAcademicYear) {
          result.failed.push({ studentId, message: 'Tidak ada academic year aktif' });
          continue;
        }

        await this.repository.update(activeClassStudent.id, { status: 'TinggalKelas' as const });

        await this.repository.create({
          classId: targetClassId,
          studentId,
          academicYearId: activeAcademicYear.id,
          status: 'Aktif' as const,
        });

        await getOrchestrator().masterStudent.updateCurrentClass(studentId, targetClassId, targetClass?.majorId);
        await getOrchestrator().masterStudent.updateStatus(studentId, 'Aktif');

        result.success.push({ studentId, message: 'Berhasil tinggal kelas' });
      } catch (error) {
        result.failed.push({ studentId, message: error instanceof Error ? error.message : 'Terjadi kesalahan' });
      }
    }

    return result;
  }

  async transfer(studentIds: string[], targetClassId?: string) {
    const result: { success: { studentId: string; message: string }[]; failed: { studentId: string; message: string }[] } = {
      success: [],
      failed: [],
    };

    for (const studentId of studentIds) {
      try {
        const activeClassStudent = await this.repository.findActiveByStudentId(studentId);
        if (!activeClassStudent) {
          result.failed.push({ studentId, message: 'Tidak memiliki data class student aktif' });
          continue;
        }

        await this.repository.update(activeClassStudent.id, { status: 'Pindah' as const });

        const linkedMajor = await this.majorStudentRepository.findByStudentAndAcademicYear(
          studentId,
          activeClassStudent.academicYearId,
        );
        if (linkedMajor) {
          await this.majorStudentRepository.update(linkedMajor.id, { status: 'Pindah' as const });
        }

        if (targetClassId) {
          const activeAcademicYear = await getOrchestrator().masterAcademicYear.findActive();
          if (activeAcademicYear) {
            await this.repository.create({
              classId: targetClassId,
              studentId,
              academicYearId: activeAcademicYear.id,
              status: 'Aktif' as const,
            });
            const targetClass = await getOrchestrator().masterClass.findById(targetClassId);
            await getOrchestrator().masterStudent.updateCurrentClass(studentId, targetClassId, targetClass?.majorId);
            await getOrchestrator().masterStudent.updateStatus(studentId, 'Aktif');
          }
        } else {
          await getOrchestrator().masterStudent.updateCurrentClass(studentId, null, null);
          await getOrchestrator().masterStudent.updateStatus(studentId, 'Tidak_Aktif');
        }

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
        const activeClassStudent = await this.repository.findActiveByStudentId(studentId);
        if (!activeClassStudent) {
          result.failed.push({ studentId, message: 'Tidak memiliki data class student aktif' });
          continue;
        }

        await this.repository.update(activeClassStudent.id, { status: 'Lulus' as const });

        const linkedMajor = await this.majorStudentRepository.findByStudentAndAcademicYear(
          studentId,
          activeClassStudent.academicYearId,
        );
        if (linkedMajor) {
          await this.majorStudentRepository.update(linkedMajor.id, { status: 'Lulus' as const });
        }

        await getOrchestrator().masterStudent.updateCurrentClass(studentId, null, null);
        await getOrchestrator().masterStudent.updateStatus(studentId, 'Lulus');

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
      await getOrchestrator().masterStudent.updateCurrentClass(item.studentId, null, null);
      await getOrchestrator().masterStudent.updateStatus(item.studentId, 'Tidak_Aktif');
    }
  }

  override async deleteBulk(ids: string[]) {
    const items = await prisma.classStudent.findMany({ where: { id: { in: ids } } });
    const { count } = await this.repository.softDeleteMany(ids);
    for (const item of items) {
      if (item && item.studentId) {
        await getOrchestrator().masterStudent.updateCurrentClass(item.studentId, null, null);
        await getOrchestrator().masterStudent.updateStatus(item.studentId, 'Tidak_Aktif');
      }
    }
    return { deleted: count };
  }

  /** Generate template Excel kosong (label Indonesia + sample row + dropdown nama kelas & status). */
  async getExcelTemplate(): Promise<Buffer> {
    const classes = await prisma.shadowClass.findMany({ where: { deletedAt: null } });
    const classNames = classes.map((c) => c.name).filter((c): c is string => Boolean(c));
    return generateExcelTemplate(CLASS_STUDENT_EXCEL_HEADERS, 'Kelas Murid', {
      email: 'murid@example.com',
      className: classNames[0] ?? '10 RPL 1',
      status: 'Aktif',
    }, {
      className: classNames,
      status: CLASS_STUDENT_STATUSES,
    });
  }

  /**
   * Import data kelas murid dari Excel.
   * Lookup murid via EMAIL (orchestrator master — shadow_students tidak menyimpan
   * email, tetapi ID shadow == ID master). Lookup kelas via shadow_classes.name.
   * Tahun ajaran = tahun ajaran aktif (perilaku sama dengan UI).
   * Validasi bisnis `create()` (jurusan aktif sesuai kelas, belum punya kelas aktif)
   * tetap dijalankan per baris; baris gagal masuk `failedRows`.
   * Dedupe per studentId: satu murid hanya boleh memiliki satu kelas aktif.
   */
  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = Record<string, unknown>;
    const rows = await parseExcel<RawRow>(
      buffer,
      ['email', 'className'],
      buildHeaderLabelMap(CLASS_STUDENT_EXCEL_HEADERS),
    );

    const [masterStudents, shadowClasses, activeAcademicYear] = await Promise.all([
      getOrchestrator().masterStudent.findAll(),
      prisma.shadowClass.findMany({ where: { deletedAt: null } }),
      getOrchestrator().masterAcademicYear.findActive(),
    ]);

    if (!activeAcademicYear) {
      throw new BadRequestError('Tidak ada tahun ajaran aktif');
    }

    const studentByEmail = new Map<string, string>();
    for (const s of masterStudents) {
      if (s.email) studentByEmail.set(s.email.trim().toLowerCase(), s.id);
    }
    const classByName = new Map<string, string>();
    for (const c of shadowClasses) {
      classByName.set(c.name.trim().toLowerCase(), c.id);
    }

    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const preparedRows: Array<CreateClassStudentDto & { rowData: Record<string, unknown> }> = [];
    const seenStudents = new Set<string>();

    for (const raw of rows) {
      const email = raw['email'] ? String(raw['email']).trim().toLowerCase() : '';
      const className = raw['className'] ? String(raw['className']).trim().toLowerCase() : '';
      const status = raw['status'] ? String(raw['status']).trim() : 'Aktif';

      const rowData: Record<string, unknown> = {
        email: raw['email'],
        className: raw['className'],
        status: raw['status'],
      };

      const studentId = studentByEmail.get(email);
      if (!studentId) {
        failedRows.push({ ...rowData, reason: `Murid dengan email ${email} tidak ditemukan` });
        continue;
      }
      const classId = classByName.get(className);
      if (!classId) {
        failedRows.push({ ...rowData, reason: `Kelas dengan nama ${raw['className']} tidak ditemukan` });
        continue;
      }
      if (!CLASS_STUDENT_STATUSES.includes(status)) {
        failedRows.push({ ...rowData, reason: `Status tidak valid: ${status} (harus ${CLASS_STUDENT_STATUSES.join(' / ')})` });
        continue;
      }

      // Dedupe per murid (bukan per pasangan murid+kelas): satu murid hanya boleh
      // punya satu kelas aktif, sehingga muncul 2× dalam file = kesalahan user.
      if (seenStudents.has(studentId)) {
        failedRows.push({ ...rowData, reason: 'Duplikat dalam file (murid sama muncul lebih dari sekali)' });
        continue;
      }
      seenStudents.add(studentId);

      preparedRows.push({
        studentId,
        classId,
        academicYearId: activeAcademicYear.id,
        status: status as CreateClassStudentDto['status'],
        rowData,
      });
    }

    const successRows: Array<any> = [];
    await Promise.all(
      preparedRows.map(async (row) => {
        const { rowData, ...dto } = row;
        try {
          const item = await this.create(dto as CreateClassStudentDto);
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


  /** Export seluruh kelas murid (tanpa pagination), kompatibel untuk di-import ulang. */
  async getExcelExport() {
    const [items, shadowClasses] = await Promise.all([
      prisma.classStudent.findMany({ where: { deletedAt: null } }),
      prisma.shadowClass.findMany({ where: { deletedAt: null } }),
    ]);
    const studentIds = [...new Set(items.map((i) => i.studentId).filter((id): id is string => Boolean(id)))];
    const masterStudents = studentIds.length ? await getOrchestrator().masterStudent.findByIds(studentIds) : [];
    const emailByStudentId = new Map(masterStudents.map((s) => [s.id, s.email ?? '']));
    const nameByClassId = new Map(shadowClasses.map((c) => [c.id, c.name ?? '']));
    return buildExcelExport(
      'Kelas Murid',
      CLASS_STUDENT_EXCEL_HEADERS,
      items.map((r) => ({
        email: emailByStudentId.get(r.studentId) ?? '',
        className: nameByClassId.get(r.classId) ?? '',
        status: r.status,
      })),
    );
  }
}

export const classStudentsService = new ClassStudentService(
  classStudentRepository,
  majorStudentRepository,
);
