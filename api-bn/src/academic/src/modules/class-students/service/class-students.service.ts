import { ClassStudentRepository, classStudentRepository } from '#academic/modules/class-students/repository';
import { MajorStudentRepository, majorStudentRepository } from '#academic/modules/major-students/repository';
import { NotFoundError, BadRequestError } from '#app';
import { BaseService } from '#academic/utils/index.js';
import type { CreateClassStudentDto, UpdateClassStudentDto } from '#academic/modules/class-students/domain';

import { getOrchestrator } from '#app/orchestrator.js';
import { prisma } from '#academic/database/index.js';

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
}

export const classStudentsService = new ClassStudentService(
  classStudentRepository,
  majorStudentRepository,
);
