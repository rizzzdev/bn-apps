import { MajorStudentRepository, majorStudentRepository } from '@/modules/major-students/repository';
import { ClassStudentRepository, classStudentRepository } from '@/modules/class-students/repository';
import { NotFoundError } from '@/errors';
import { BaseService } from '@/utils';
import { graduateStudentInMaster, syncStudents } from '@/utils/master-api';
import type { CreateMajorStudentDto, UpdateMajorStudentDto } from '@/modules/major-students/domain';

import { prisma } from '@/database';

export class MajorStudentService extends BaseService<any, CreateMajorStudentDto, UpdateMajorStudentDto> {
  constructor(
    protected repository: MajorStudentRepository,
    private classStudentRepository: ClassStudentRepository,
  ) {
    super(repository as any, 'Major Student');
  }

  override async create(data: CreateMajorStudentDto) {
    const existing = await prisma.majorStudent.findFirst({
      where: {
        studentId: data.studentId,
        ...(data.academicYearId ? { academicYearId: data.academicYearId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    let resultRecord;
    if (existing) {
      resultRecord = await this.repository.update(existing.id, {
        majorId: data.majorId,
        academicYearId: data.academicYearId || existing.academicYearId,
        status: (data.status as any) || 'Aktif',
        deletedAt: null,
      } as any);
    } else {
      resultRecord = await this.repository.create(data as any);
    }

    // Deactivate any other active major_students records for this student
    await prisma.majorStudent.updateMany({
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
          data: { status: 'Pindah' as any },
        });

        await prisma.classStudent.updateMany({
          where: {
            studentId,
            status: 'Aktif',
            deletedAt: null,
          },
          data: { status: 'Pindah' as any },
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
          data: { status: 'Lulus' as any },
        });

        await prisma.classStudent.updateMany({
          where: {
            studentId,
            status: 'Aktif',
            deletedAt: null,
          },
          data: { status: 'Lulus' as any },
        });

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

export const majorStudentsService = new MajorStudentService(majorStudentRepository, classStudentRepository);
