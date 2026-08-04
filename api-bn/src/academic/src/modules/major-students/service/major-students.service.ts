import { MajorStudentRepository, majorStudentRepository } from '#academic/modules/major-students/repository';
import { ClassStudentRepository, classStudentRepository } from '#academic/modules/class-students/repository';
import { NotFoundError, BadRequestError } from '#app';
import { BaseService } from '#academic/utils/index.js';
import type { CreateMajorStudentDto, UpdateMajorStudentDto } from '#academic/modules/major-students/domain';
import { getOrchestrator } from '#app/orchestrator.js';
import { prisma } from '#academic/database/index.js';

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
}

export const majorStudentsService = new MajorStudentService(majorStudentRepository, classStudentRepository);
