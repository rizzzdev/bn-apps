import { classSubjectRequirementRepository } from '../repository';
import type { ClassSubjectRequirementRepository } from '../repository';
import type { CreateClassSubjectRequirementDto, UpdateClassSubjectRequirementDto, BulkUpsertClassSubjectRequirementDto } from '../domain';
import { prisma } from '#academic/database/index.js';
import type { Prisma } from '#academic/database/index.js';
import { BadRequestError, buildExcelExport, parseExcel, buildHeaderLabelMap, generateExcelTemplate } from '#app';
import type { HeaderSpec } from '#app';
import { getOrchestrator } from '#app/orchestrator.js';
import { randomUUID } from 'node:crypto';

const CLASS_SUBJECT_REQUIREMENT_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Nama Kelas', key: 'className', width: 18 },
  { label: 'Kode Mapel', key: 'subjectCode', width: 14 },
  { label: 'Email Guru', key: 'email', width: 32 },
  { label: 'JP Mingguan', key: 'weeklyHours', width: 14 },
  { label: 'Max JP / Hari', key: 'maxHoursPerDay', width: 14 },
  { label: 'JP Batch', key: 'batchWeeklyHours', width: 12 },
  { label: 'Kode Grup Batch', key: 'batchGroupId', width: 22 },
];

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

  /** Validasi konsistensi grup batch: semua baris dalam satu batchGroupId harus
   *  memiliki mapel, guru, total JP, JP batch yang identik, serta classId unik. */
  private validateBatchConsistency(requirements: CreateClassSubjectRequirementDto[]) {
    const groups = new Map<string, CreateClassSubjectRequirementDto[]>();
    for (const req of requirements) {
      if (!req.batchGroupId) continue;
      const list = groups.get(req.batchGroupId) || [];
      list.push(req);
      groups.set(req.batchGroupId, list);
    }

    for (const [groupId, rows] of groups) {
      const first = rows[0]!;
      for (const r of rows.slice(1)) {
        if (r.subjectId !== first.subjectId || r.teacherId !== first.teacherId) {
          throw new BadRequestError(
            'Grup batch ' + groupId + ' harus memiliki mapel dan guru yang sama untuk semua kelas.'
          );
        }
        if (
          r.weeklyHours !== first.weeklyHours ||
          (r.batchWeeklyHours ?? 0) !== (first.batchWeeklyHours ?? 0) ||
          r.maxHoursPerDay !== first.maxHoursPerDay
        ) {
          throw new BadRequestError(
            'Grup batch ' +
              groupId +
              ' harus memiliki total JP, JP batch, dan max JP/hari yang sama untuk semua kelas.'
          );
        }
      }
      const classIds = new Set(rows.map((r) => r.classId));
      if (classIds.size !== rows.length) {
        throw new BadRequestError('Grup batch ' + groupId + ' memiliki kelas yang duplikat.');
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
    this.validateBatchConsistency([data]);
    await this.validateTeacherOverload([data]);
    return this.repository.upsert(data);
  }

  async bulkUpsert(data: BulkUpsertClassSubjectRequirementDto) {
    return prisma.$transaction(async (tx) => {
      this.validateBatchConsistency(data.requirements);
      await this.validateMaxHoursPerDay(data.requirements, tx);
      await this.validateTeacherOverload(data.requirements, tx);
      const results = await Promise.all(
        data.requirements.map((req) => this.repository.upsert(req, tx)),
      );
      return results;
    });
  }

  async update(id: string, data: UpdateClassSubjectRequirementDto) {
    const existing = await this.repository.findById(id);
    if (existing) {
      const merged = { ...existing, ...data } as any;
      if ((merged.batchWeeklyHours ?? 0) > merged.weeklyHours) {
        throw new BadRequestError('JP batch tidak boleh melebihi total JP mingguan.');
      }
      if (merged.batchGroupId) {
        const groupRows = await prisma.classSubjectRequirement.findMany({
          where: { batchGroupId: merged.batchGroupId, deletedAt: null },
        });
        const mergedRows = groupRows.map((r) => (r.id === id ? merged : r)) as any;
        this.validateBatchConsistency(mergedRows);
      }
    }
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

  /** Generate template Excel kosong (label Indonesia + sample row + dropdown nama kelas & kode mapel). */
  async getExcelTemplate(): Promise<Buffer> {
    const [subjects, classes] = await Promise.all([
      prisma.shadowSubject.findMany({ where: { deletedAt: null } }),
      prisma.shadowClass.findMany({ where: { deletedAt: null } }),
    ]);
    const subjectCodes = subjects.map((s) => s.code).filter((c): c is string => Boolean(c));
    const classNames = classes.map((c) => c.name).filter((c): c is string => Boolean(c));
    return generateExcelTemplate(CLASS_SUBJECT_REQUIREMENT_EXCEL_HEADERS, 'Alokasi Jam', {
      className: classNames[0] ?? '10 RPL 1',
      subjectCode: subjectCodes[0] ?? 'MTK',
      email: 'guru@example.com',
      weeklyHours: 4,
      maxHoursPerDay: 2,
      batchWeeklyHours: 0,
      batchGroupId: '',
    }, {
      className: classNames,
      subjectCode: subjectCodes,
    });
  }

  /**
   * Import matriks alokasi jam dari Excel.
   * Lookup: kelas via shadow_classes.name, mapel via shadow_subjects.code,
   * guru via orchestrator master (email). Jika JP Batch > 0 tanpa Kode Grup Batch,
   * server membangkitkan satu grup per (mapel + guru) untuk semua kelas batch di upload ini.
   * Validasi per baris; baris gagal masuk `failedRows`. Validasi lintas baris
   * (konsistensi grup batch & beban guru kumulatif) dijalankan setelah loop baris.
   */
  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = Record<string, unknown>;
    const rows = await parseExcel<RawRow>(
      buffer,
      ['className', 'subjectCode', 'email'],
      buildHeaderLabelMap(CLASS_SUBJECT_REQUIREMENT_EXCEL_HEADERS),
    );

    const [masterTeachers, shadowSubjects, shadowClasses] = await Promise.all([
      getOrchestrator().masterTeacher.findAll(),
      prisma.shadowSubject.findMany({ where: { deletedAt: null } }),
      prisma.shadowClass.findMany({ where: { deletedAt: null } }),
    ]);

    const teacherByEmail = new Map<string, string>();
    for (const t of masterTeachers) {
      if (t.email) teacherByEmail.set(t.email.trim().toLowerCase(), t.id);
    }
    const subjectByCode = new Map<string, string>();
    for (const s of shadowSubjects) {
      subjectByCode.set(s.code.trim().toLowerCase(), s.id);
    }
    const classByName = new Map<string, string>();
    for (const c of shadowClasses) {
      classByName.set(c.name.trim().toLowerCase(), c.id);
    }

    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    let preparedRows: Array<CreateClassSubjectRequirementDto & { rowData: Record<string, unknown> }> = [];
    const seenPairs = new Set<string>();
    const autoBatchGroups = new Map<string, string>(); // subjectId|teacherId -> batchGroupId

    const toInt = (v: unknown, fallback: number, min: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= min ? Math.floor(n) : null;
    };

    for (const raw of rows) {
      const className = raw['className'] ? String(raw['className']).trim().toLowerCase() : '';
      const subjectCode = raw['subjectCode'] ? String(raw['subjectCode']).trim().toLowerCase() : '';
      const email = raw['email'] ? String(raw['email']).trim().toLowerCase() : '';

      const rowData: Record<string, unknown> = {
        className: raw['className'],
        subjectCode: raw['subjectCode'],
        email: raw['email'],
        weeklyHours: raw['weeklyHours'],
        maxHoursPerDay: raw['maxHoursPerDay'],
        batchWeeklyHours: raw['batchWeeklyHours'],
        batchGroupId: raw['batchGroupId'],
      };

      const classId = classByName.get(className);
      if (!classId) {
        failedRows.push({ ...rowData, reason: `Kelas dengan nama ${raw['className']} tidak ditemukan` });
        continue;
      }
      const subjectId = subjectByCode.get(subjectCode);
      if (!subjectId) {
        failedRows.push({ ...rowData, reason: `Mapel dengan kode ${raw['subjectCode']} tidak ditemukan` });
        continue;
      }
      const teacherId = teacherByEmail.get(email);
      if (!teacherId) {
        failedRows.push({ ...rowData, reason: `Guru dengan email ${email} tidak ditemukan` });
        continue;
      }

      const weeklyHours = toInt(raw['weeklyHours'], 0, 1);
      if (weeklyHours === null) {
        failedRows.push({ ...rowData, reason: 'JP Mingguan harus berupa angka ≥ 1' });
        continue;
      }
      const maxHoursPerDay = toInt(raw['maxHoursPerDay'] ?? 2, 2, 1);
      if (maxHoursPerDay === null) {
        failedRows.push({ ...rowData, reason: 'Max JP / Hari harus berupa angka ≥ 1' });
        continue;
      }
      const batchWeeklyHours = toInt(raw['batchWeeklyHours'] ?? 0, 0, 0);
      if (batchWeeklyHours === null) {
        failedRows.push({ ...rowData, reason: 'JP Batch harus berupa angka ≥ 0' });
        continue;
      }
      if (batchWeeklyHours > weeklyHours) {
        failedRows.push({ ...rowData, reason: 'JP Batch tidak boleh melebihi JP Mingguan' });
        continue;
      }

      let batchGroupId = raw['batchGroupId'] ? String(raw['batchGroupId']).trim() : '';
      if (batchWeeklyHours > 0 && !batchGroupId) {
        const key = `${subjectId}|${teacherId}`;
        if (!autoBatchGroups.has(key)) autoBatchGroups.set(key, randomUUID());
        batchGroupId = autoBatchGroups.get(key)!;
      }

      const pairKey = `${classId}_${subjectId}_${teacherId}`;
      if (seenPairs.has(pairKey)) {
        failedRows.push({ ...rowData, reason: 'Duplikat dalam file (kelas + mapel + guru sama)' });
        continue;
      }
      seenPairs.add(pairKey);

      preparedRows.push({
        classId,
        subjectId,
        teacherId,
        weeklyHours,
        maxHoursPerDay,
        batchWeeklyHours,
        batchGroupId: batchGroupId || null,
        rowData,
      });
    }

    // Phase 1.5: validasi lintas baris — konsistensi tiap grup batch (semua kelas
    // dalam satu grup harus punya mapel, guru, JP, JP batch, dan max/hari yang sama).
    // Grup yang tidak konsisten dilaporkan per-baris tanpa membatalkan baris lain.
    const rowsByBatchGroup = new Map<string, Array<(typeof preparedRows)[number]>>();
    let validRows: Array<(typeof preparedRows)[number]> = [];
    for (const row of preparedRows) {
      if (row.batchGroupId) {
        const list = rowsByBatchGroup.get(row.batchGroupId) ?? [];
        list.push(row);
        rowsByBatchGroup.set(row.batchGroupId, list);
      } else {
        validRows.push(row);
      }
    }
    for (const [groupId, rows] of rowsByBatchGroup) {
      try {
        this.validateBatchConsistency(
          rows.map(({ rowData: _rd, ...dto }) => dto as CreateClassSubjectRequirementDto),
        );
        validRows.push(...rows);
      } catch (err) {
        const reason = err instanceof Error ? err.message : `Grup batch ${groupId} tidak konsisten`;
        for (const r of rows) failedRows.push({ ...r.rowData, reason });
      }
    }
    preparedRows = validRows;

    // Phase 1.6: validasi beban guru kumulatif untuk SELURUH baris file sekaligus
    // (per-row `upsert()` hanya melihat 1 baris; beban gabungan lintas baris baru
    // terlihat di sini). Jika melanggar, seluruh baris file masuk laporan.
    if (preparedRows.length > 0) {
      try {
        await this.validateTeacherOverload(
          preparedRows.map(({ rowData: _rd, ...dto }) => dto as CreateClassSubjectRequirementDto),
        );
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'Validasi beban guru lintas baris gagal';
        for (const r of preparedRows) failedRows.push({ ...r.rowData, reason });
        preparedRows = [];
      }
    }

    const successRows: Array<any> = [];
    await Promise.all(
      preparedRows.map(async (row) => {
        const { rowData, ...dto } = row;
        try {
          const item = await this.upsert(dto as CreateClassSubjectRequirementDto);
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


  /** Export seluruh matriks alokasi jam (tanpa pagination), kompatibel untuk di-import ulang. */
  async getExcelExport() {
    const [items, shadowSubjects, shadowClasses] = await Promise.all([
      prisma.classSubjectRequirement.findMany({ where: { deletedAt: null } }),
      prisma.shadowSubject.findMany({ where: { deletedAt: null } }),
      prisma.shadowClass.findMany({ where: { deletedAt: null } }),
    ]);
    const teacherIds = [...new Set(items.map((i) => i.teacherId).filter((id): id is string => Boolean(id)))];
    const masterTeachers = teacherIds.length ? await getOrchestrator().masterTeacher.findByIds(teacherIds) : [];
    const emailByTeacherId = new Map(masterTeachers.map((t) => [t.id, t.email ?? '']));
    const codeBySubjectId = new Map(shadowSubjects.map((s) => [s.id, s.code ?? '']));
    const nameByClassId = new Map(shadowClasses.map((c) => [c.id, c.name ?? '']));
    return buildExcelExport(
      'Alokasi Jam',
      CLASS_SUBJECT_REQUIREMENT_EXCEL_HEADERS,
      items.map((r) => ({
        className: nameByClassId.get(r.classId) ?? '',
        subjectCode: codeBySubjectId.get(r.subjectId) ?? '',
        email: r.teacherId ? (emailByTeacherId.get(r.teacherId) ?? '') : '',
        weeklyHours: r.weeklyHours,
        maxHoursPerDay: r.maxHoursPerDay,
        batchWeeklyHours: r.batchWeeklyHours,
        batchGroupId: r.batchGroupId ?? '',
      })),
    );
  }
}

export const classSubjectRequirementService = new ClassSubjectRequirementService(classSubjectRequirementRepository);
