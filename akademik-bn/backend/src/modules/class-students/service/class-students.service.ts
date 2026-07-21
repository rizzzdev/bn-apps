import { ClassStudentRepository, classStudentRepository } from '@/modules/class-students/repository';
import { MajorStudentRepository, majorStudentRepository } from '@/modules/major-students/repository';
import { AcademicYearRepository, academicYearRepository } from '@/modules/academic-years/repository';
import { NotFoundError, BadRequestError } from '@/errors';
import { BaseService } from '@/utils';
import { graduateStudentInMaster, syncStudents } from '@/utils/master-api';
import type { CreateClassStudentDto, UpdateClassStudentDto } from '@/modules/class-students/domain';

import { prisma } from '@/database';

export class ClassStudentService extends BaseService<any, CreateClassStudentDto, UpdateClassStudentDto> {
  constructor(
    protected repository: ClassStudentRepository,
    private majorStudentRepository: MajorStudentRepository,
    private academicYearRepository: AcademicYearRepository,
  ) {
    super(repository as any, 'Class Student');
  }

  override async create(data: CreateClassStudentDto) {
    // Validate: class's majorId must match student's active major
    const classRecord = await prisma.class.findUnique({
      where: { id: data.classId },
    });
    if (!classRecord) {
      throw new NotFoundError('Kelas tidak ditemukan');
    }

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

    const existing = await prisma.classStudent.findFirst({
      where: {
        studentId: data.studentId,
        ...(data.academicYearId ? { academicYearId: data.academicYearId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    let resultRecord;
    if (existing) {
      resultRecord = await this.repository.update(existing.id, {
        classId: data.classId,
        academicYearId: data.academicYearId || existing.academicYearId,
        status: (data.status as any) || 'Aktif',
        deletedAt: null,
      } as any);
    } else {
      resultRecord = await this.repository.create(data as any);
    }

    // Deactivate any other active class_students records for this student
    await prisma.classStudent.updateMany({
      where: {
        studentId: data.studentId,
        id: { not: resultRecord.id },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        status: 'Pindah' as any,
      },
    });

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

        const currentAcademicYear = await this.academicYearRepository.findById(activeClassStudent.academicYearId);
        if (!currentAcademicYear) {
          result.failed.push({ studentId, message: 'Data academic year tidak ditemukan' });
          continue;
        }

        const activeAcademicYear = await this.academicYearRepository.findActive();
        if (!activeAcademicYear) {
          result.failed.push({ studentId, message: 'Tidak ada academic year aktif' });
          continue;
        }

        if (activeAcademicYear.id === currentAcademicYear.id) {
          result.failed.push({ studentId, message: 'Semester masih sama, tidak bisa naik kelas' });
          continue;
        }

        await this.repository.update(activeClassStudent.id, { status: 'NaikKelas' as any });

        await this.repository.create({
          classId: targetClassId,
          studentId,
          academicYearId: activeAcademicYear.id,
          status: 'Aktif' as any,
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

        const currentAcademicYear = await this.academicYearRepository.findById(activeClassStudent.academicYearId);
        if (!currentAcademicYear) {
          result.failed.push({ studentId, message: 'Data academic year tidak ditemukan' });
          continue;
        }

        const activeAcademicYear = await this.academicYearRepository.findActive();
        if (!activeAcademicYear) {
          result.failed.push({ studentId, message: 'Tidak ada academic year aktif' });
          continue;
        }

        if (activeAcademicYear.id === currentAcademicYear.id) {
          result.failed.push({ studentId, message: 'Semester masih sama, tidak bisa tinggal kelas' });
          continue;
        }

        await this.repository.update(activeClassStudent.id, { status: 'TinggalKelas' as any });

        await this.repository.create({
          classId: targetClassId,
          studentId,
          academicYearId: activeAcademicYear.id,
          status: 'Aktif' as any,
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

        await this.repository.update(activeClassStudent.id, { status: 'Pindah' as any });

        const linkedMajor = await this.majorStudentRepository.findByStudentAndAcademicYear(
          studentId,
          activeClassStudent.academicYearId,
        );
        if (linkedMajor) {
          await this.majorStudentRepository.update(linkedMajor.id, { status: 'Pindah' as any });
        }

        if (targetClassId) {
          const activeAcademicYear = await this.academicYearRepository.findActive();
          if (activeAcademicYear) {
            await this.repository.create({
              classId: targetClassId,
              studentId,
              academicYearId: activeAcademicYear.id,
              status: 'Aktif' as any,
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

        await this.repository.update(activeClassStudent.id, { status: 'Lulus' as any });

        const linkedMajor = await this.majorStudentRepository.findByStudentAndAcademicYear(
          studentId,
          activeClassStudent.academicYearId,
        );
        if (linkedMajor) {
          await this.majorStudentRepository.update(linkedMajor.id, { status: 'Lulus' as any });
        }

        // Update student status in master API (non-blocking)
        await graduateStudentInMaster(studentId);

        result.success.push({ studentId, message: 'Berhasil lulus' });
      } catch (error) {
        result.failed.push({ studentId, message: error instanceof Error ? error.message : 'Terjadi kesalahan' });
      }
    }

    // Sync all students data from master API (non-blocking)
    await syncStudents();

    return result;
  }
}

export const classStudentsService = new ClassStudentService(
  classStudentRepository,
  majorStudentRepository,
  academicYearRepository,
);
