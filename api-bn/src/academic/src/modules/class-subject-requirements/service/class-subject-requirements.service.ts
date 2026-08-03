import { classSubjectRequirementRepository } from '../repository';
import type { ClassSubjectRequirementRepository } from '../repository';
import type { CreateClassSubjectRequirementDto, UpdateClassSubjectRequirementDto, BulkUpsertClassSubjectRequirementDto } from '../domain';
import { prisma } from '@academic/database/index.js';
import type { Prisma } from '@academic/database/index.js';
import { BadRequestError } from '@app/index.js';
import { getOrchestrator } from '@app/orchestrator.js';

export class ClassSubjectRequirementService {
  constructor(private repository: ClassSubjectRequirementRepository) {}

  private async validateTeacherOverload(requirements: CreateClassSubjectRequirementDto[], tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const teacherIds = Array.from(
      new Set(requirements.map((r) => r.teacherId).filter((id): id is string => Boolean(id)))
    );

    if (teacherIds.length === 0) return;

    const [teachers, subjectTeachers, existingReqs] = await Promise.all([
      getOrchestrator().masterTeacher.findByIds(teacherIds),
      client.subjectTeacher.findMany({
        where: { teacherId: { in: teacherIds }, status: 'Aktif', deletedAt: null },
      }),
      client.classSubjectRequirement.findMany({
        where: { deletedAt: null },
      }),
    ]);

    const proposedMap = new Map<string, CreateClassSubjectRequirementDto>();
    for (const r of requirements) {
      proposedMap.set(`${r.classId}_${r.subjectId}_${r.teacherId || ''}`, r);
    }

    const mergedReqs: { classId: string; subjectId: string; teacherId: string; weeklyHours: number }[] = [];

    for (const existing of existingReqs) {
      const key = `${existing.classId}_${existing.subjectId}_${existing.teacherId || ''}`;
      if (proposedMap.has(key)) continue;
      if (existing.teacherId && teacherIds.includes(existing.teacherId)) {
        mergedReqs.push({
          classId: existing.classId,
          subjectId: existing.subjectId,
          teacherId: existing.teacherId,
          weeklyHours: existing.weeklyHours,
        });
      }
    }

    for (const prop of requirements) {
      if (prop.teacherId) {
        mergedReqs.push({
          classId: prop.classId,
          subjectId: prop.subjectId,
          teacherId: prop.teacherId,
          weeklyHours: prop.weeklyHours,
        });
      }
    }

    for (const teacherId of teacherIds) {
      const teacher = teachers.find((t) => t.id === teacherId);
      const teacherName = teacher ? teacher.fullname : teacherId;
      const stForTeacher = subjectTeachers.filter((st) => st.teacherId === teacherId);

      // Per-subject max "per single class" weekly hours. Dalam batch/team teaching,
      // satu guru mengampu mapel yang sama untuk banyak kelas pada slot yang sama,
      // sehingga beban tidak dihitung dengan mengalikan jumlah kelas.
      const teacherReqs = mergedReqs.filter((r) => r.teacherId === teacherId);
      const perSubjectMax = new Map<string, number>();
      for (const r of teacherReqs) {
        const current = perSubjectMax.get(r.subjectId) ?? 0;
        perSubjectMax.set(r.subjectId, Math.max(current, r.weeklyHours));
      }

      // 1. Check per-subject target hours overload (per single class)
      for (const st of stForTeacher) {
        const allocatedForSubject = perSubjectMax.get(st.subjectId) ?? 0;
        const targetForSubject = st.targetHours || 0;

        if (allocatedForSubject > targetForSubject) {
          throw new BadRequestError(
            `Guru ${teacherName} melebihi batas beban mengajar per kelas! (Dialokasikan: ${allocatedForSubject} JP, Target Beban: ${targetForSubject} JP)`
          );
        }
      }

      // 2. Check total teacher target hours overload (per class per subject)
      const totalAllocated = Array.from(perSubjectMax.values()).reduce((sum, v) => sum + v, 0);
      const totalTarget = stForTeacher.reduce((sum, st) => sum + (st.targetHours || 0), 0);

      if (totalAllocated > totalTarget) {
        throw new BadRequestError(
          `Guru ${teacherName} melebihi total batas beban mengajar! (Total Dialokasikan: ${totalAllocated} JP, Total Target Beban: ${totalTarget} JP)`
        );
      }
    }
  }

  private async validateMaxHoursPerDay(requirements: CreateClassSubjectRequirementDto[], tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const totalHours = await client.lessonHour.count({ where: { deletedAt: null } });
    for (const req of requirements) {
      if (req.maxHoursPerDay > totalHours) {
        throw new BadRequestError(
          `Max JP per hari (${req.maxHoursPerDay}) tidak boleh melebihi jumlah jam pelajaran aktif (${totalHours})`
        );
      }
    }
  }

  async getAll(filters?: { classId?: string; subjectId?: string; teacherId?: string }) {
    return this.repository.findAll(filters);
  }

  async getById(id: string) {
    return this.repository.findById(id);
  }

  async upsert(data: CreateClassSubjectRequirementDto) {
    await this.validateTeacherOverload([data]);
    return this.repository.upsert(data);
  }

  async bulkUpsert(data: BulkUpsertClassSubjectRequirementDto) {
    return prisma.$transaction(async (tx) => {
      await this.validateMaxHoursPerDay(data.requirements, tx);
      await this.validateTeacherOverload(data.requirements, tx);
      const results = await Promise.all(
        data.requirements.map((req) => this.repository.upsert(req, tx)),
      );
      return results;
    });
  }

  async update(id: string, data: UpdateClassSubjectRequirementDto) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    return this.repository.softDelete(id);
  }

  async bulkDelete(ids: string[]) {
    return this.repository.bulkSoftDelete(ids);
  }

  async clearAll() {
    return this.repository.clearAll();
  }
}

export const classSubjectRequirementService = new ClassSubjectRequirementService(classSubjectRequirementRepository);
