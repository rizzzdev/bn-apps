import { ClassStudentRepository, classStudentRepository } from '@academic/modules/class-students/repository';
import { MajorStudentRepository, majorStudentRepository } from '@academic/modules/major-students/repository';
import { NotFoundError, BadRequestError } from '@app/index.js';
import { BaseService } from '@academic/utils/index.js';
import type { CreateClassStudentDto, UpdateClassStudentDto } from '@academic/modules/class-students/domain';

import { getOrchestrator } from '@app/orchestrator.js';
import { prisma } from '@academic/database/index.js';

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

    return resultRecord;
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
          }
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

        result.success.push({ studentId, message: 'Berhasil lulus' });
      } catch (error) {
        result.failed.push({ studentId, message: error instanceof Error ? error.message : 'Terjadi kesalahan' });
      }
    }

    return result;
  }
}

export const classStudentsService = new ClassStudentService(
  classStudentRepository,
  majorStudentRepository,
);
