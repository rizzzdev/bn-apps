import { MajorHeadRepository, majorHeadRepository } from '@academic/modules/major-heads/repository';
import { NotFoundError } from '@app/index.js';
import { BaseService } from '@academic/utils/index.js';
import type { CreateMajorHeadDto, UpdateMajorHeadDto } from '@academic/modules/major-heads/domain';

import { getOrchestrator } from '@app/orchestrator.js';
import { prisma } from '@academic/database/index.js';

export class MajorHeadService extends BaseService<any, CreateMajorHeadDto, UpdateMajorHeadDto> {
  constructor(protected repository: MajorHeadRepository) {
    super(repository as any, 'Ketua Jurusan');
  }

  override async create(data: CreateMajorHeadDto) {
    const result = await this.assignHead({
      majorId: data.majorId,
      teacherId: data.teacherId,
      academicYearId: data.academicYearId,
    });
    return result.data;
  }

  async getFiltered(page: number, limit: number, filters: { majorId?: string | undefined; academicYearId?: string | undefined; status?: string | undefined }) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, limit, filters),
      this.repository.count(filters),
    ]);
    return { data, total };
  }

  async assignHead(dto: { majorId: string; teacherId: string; academicYearId?: string }) {
    let academicYearId = dto.academicYearId;

    if (!academicYearId) {
      const activeAy = await getOrchestrator().masterAcademicYear.findActive();
      academicYearId = activeAy?.id;
    }

    if (!academicYearId) {
      const latestAy = await getOrchestrator().masterAcademicYear.findLatest();
      academicYearId = latestAy?.id;
    }

    if (!academicYearId) {
      throw new NotFoundError('Tahun ajaran aktif tidak ditemukan');
    }

    const currentHead = await prisma.majorHead.findFirst({
      where: {
        majorId: dto.majorId,
        academicYearId,
        status: 'Aktif',
        deletedAt: null,
      },
    });

    if (currentHead) {
      if (currentHead.teacherId === dto.teacherId) {
        return { message: 'Kepala jurusan tidak berubah', data: currentHead, changed: false };
      }

      await prisma.majorHead.update({
        where: { id: currentHead.id },
        data: { status: 'TidakAktif' },
      });
    }

    const newHead = await prisma.majorHead.create({
      data: {
        majorId: dto.majorId,
        teacherId: dto.teacherId,
        academicYearId,
        status: 'Aktif',
      },
    });

    return { message: 'Kepala jurusan berhasil diperbarui', data: newHead, changed: true };
  }
}

export const majorHeadsService = new MajorHeadService(majorHeadRepository);
