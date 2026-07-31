import {
  TeacherRepository,
  teacherRepository,
} from '@master/modules/teacher/repository';
import { CreateTeacherDto, UpdateTeacherDto } from '@master/modules/teacher/domain';
import { BadRequestError, NotFoundError } from '@app/index.js';
import { prisma } from '@master/database/index.js';
import { sentriAuth } from '@auth/index.js';
import { TeacherStatus } from '@master/database/index.js';
import { parseExcel, generateExcelTemplate, buildHeaderLabelMap, type HeaderSpec } from '@app/index.js';
import { withCache, clearCachePattern, setCache } from '@app/index.js';
import { createTeacherSchema } from '@master/modules/teacher/domain/schemas';
import { attachmentRepository } from '@master/modules/attachment/repository';
import { attachmentService } from '@master/modules/attachment/service';
import { randomUUID } from "crypto";
import { getOrchestrator } from '@app/orchestrator.js';

const TEACHER_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Nama Lengkap', key: 'fullname' },
  { label: 'NIK', key: 'nik' },
  { label: 'Tempat Lahir', key: 'birthplace' },
  { label: 'Tanggal Lahir', key: 'birthdate' },
  { label: 'Jenis Kelamin', key: 'gender' },
  { label: 'Agama', key: 'religion' },
  { label: 'Suku', key: 'ethnic_group' },
  { label: 'Status', key: 'status' },
  { label: 'Gelar Depan', key: 'prefix_title' },
  { label: 'Gelar Belakang', key: 'suffix_title' },
  { label: 'NIP', key: 'nip' },
  { label: 'Tinggi (cm)', key: 'height' },
  { label: 'Berat (kg)', key: 'weight' },
  { label: 'Nomor Telepon', key: 'phone_number' },
  { label: 'Email', key: 'email' },
  { label: 'Password', key: 'password' },
];

const TEACHER_EXCEL_SAMPLE: Record<string, unknown> = {
  fullname: "Budi Santoso",
  nik: "3201010101800001",
  birthplace: "Jakarta",
  birthdate: "1980-01-01",
  gender: "L",
  religion: "Islam",
  ethnic_group: "Jawa",
  status: "Aktif",
  prefix_title: "Drs.",
  suffix_title: "M.Pd.",
  nip: "198001012005011001",
  height: 170,
  weight: 65,
  phone_number: "08123456789",
  email: "budi.santoso@example.com",
  password: "password123",
};

export class TeacherService {
  constructor(private repository: TeacherRepository) { }

  async getAll(page: number, limit: number, userId?: string, includeUser = false, includePicture = false) {
    return withCache(`teacher:all:page:${page}:limit:${limit}:userId:${userId || 'none'}:includeUser:${includeUser}:includePicture:${includePicture}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, userId, includeUser, includePicture),
        this.repository.count(userId),
      ]);
      return { data, total };
    });
  }

  async getStatistics() {
    return withCache('teacher:statistics', 600, async () => {
      return this.repository.getStatistics();
    });
  }

  async getById(id: string, includePicture = false) {
    return withCache(`teacher:id:${id}:includePicture:${includePicture}`, 600, async () => {
      const item = await this.repository.findById(id, includePicture);
      if (!item) throw new NotFoundError('Guru tidak ditemukan');
      return item;
    });
  }

  async validateUnique(data: Partial<CreateTeacherDto>, excludeId?: string) {
    if (data.nik) {
      const exists = await this.repository.checkUnique('nik', data.nik, excludeId);
      if (exists) throw new BadRequestError('NIK already exists');
    }
    if (data.nip) {
      const exists = await this.repository.checkUnique('nip', data.nip, excludeId);
      if (exists) throw new BadRequestError('NIP already exists');
    }
    if (data.phoneNumber) {
      const exists = await this.repository.checkUnique('phoneNumber', data.phoneNumber, excludeId);
      if (exists) throw new BadRequestError('Phone number already exists');
    }
    if (data.email) {
      const exists = await this.repository.checkUnique('email', data.email, excludeId);
      if (exists) throw new BadRequestError('Email already exists');
    }
    if (data.userId) {
      const exists = await this.repository.checkUnique('userId', data.userId, excludeId);
      if (exists) throw new BadRequestError('User ID already exists');
    }
  }

  async create(data: CreateTeacherDto) {
    await this.validateUnique(data);

    if (data.pictureId) {
      const attachment = await attachmentRepository.findById(data.pictureId);
      if (!attachment) throw new NotFoundError("Picture not found");
    }

    const registerUser = await sentriAuth.register({
      identifiers: [
        { type: "email", value: data.email },
      ],
      password: data.password,
      roles: ["teacher"],
    });
    if (!registerUser.success) {
      throw new BadRequestError(JSON.stringify(registerUser.error));
    }

    const created = await this.repository.create(data, registerUser.user.id);
    await clearCachePattern('teacher:all:*');
    await clearCachePattern('teacher:statistics');
    await setCache(`teacher:id:${created.id}`, created, 600);

    const { user, picture, ...restCreated } = created as any;
    return restCreated;
  }

  async update(id: string, data: UpdateTeacherDto) {
    const item = await this.getById(id);
    await this.validateUnique(data, id);

    if (data.pictureId) {
      const attachment = await attachmentRepository.findById(data.pictureId);
      if (!attachment) throw new NotFoundError("Picture not found");
    }

    // Clean up old picture if replaced or removed
    if (data.pictureId === null && item.pictureId) {
      await attachmentService.delete(item.pictureId).catch((e) => console.warn('[Teacher] Cleanup error:', e));
    } else if (data.pictureId && item.pictureId && data.pictureId !== item.pictureId) {
      await attachmentService.delete(item.pictureId).catch((e) => console.warn('[Teacher] Cleanup error:', e));
    }

    if (item.userId) {
      const updates: Array<{ type: string; value: string }> = [];
      const deletes: string[] = [];

      const currentIdentifiers = await getOrchestrator().authData.getUserIdentifiers(item.userId);

      const handleIdentifier = (type: string, newValue?: string) => {
        if (newValue === undefined) return; // Not touched in this update
        const exist = currentIdentifiers.find((i: any) => i.type === type);

        if (newValue === "") {
          if (exist) deletes.push(exist.id);
        } else {
          if (!exist || exist.value !== newValue) {
            updates.push({ type, value: newValue });
          }
        }
      };

      handleIdentifier("email", data.email);

      if (updates.length > 0 && sentriAuth.bulkUpdateIdentifiers) {
        await sentriAuth.bulkUpdateIdentifiers(item.userId, updates);
      }
      if (deletes.length > 0 && sentriAuth.bulkDeleteIdentifiers) {
        await sentriAuth.bulkDeleteIdentifiers(item.userId, deletes);
      }
    }

    const updated = await this.repository.update(id, data);
    await clearCachePattern('teacher:all:*');
    await clearCachePattern('teacher:statistics');
    await clearCachePattern(`teacher:id:${id}:*`);
    await setCache(`teacher:id:${id}`, updated, 600);

    const { user, picture, ...restUpdated } = updated as any;
    return restUpdated;
  }

  async delete(id: string) {
    const item = await this.getById(id);

    if (item.pictureId) {
      await attachmentService.delete(item.pictureId).catch((e) => console.warn('[Teacher] Cleanup error:', e));
    }

    if (item.userId) {
      await getOrchestrator().authData.deleteUser(item.userId);
    }
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern('teacher:all:*');
    await clearCachePattern('teacher:statistics');
    await clearCachePattern(`teacher:id:${id}:*`);

    const { user, picture, ...restDeleted } = deleted as any;
    return restDeleted;
  }

  async uploadPicture(id: string, file: Express.Multer.File) {
    const item = await this.getById(id, true);

    // Delete old picture if exists
    if (item.pictureId) {
      await attachmentService.delete(item.pictureId).catch((e) => console.warn('[Teacher] Cleanup error:', e));
    }

    // Upload new picture
    const attachment = await attachmentService.upload(file);

    // Update teacher with new pictureId
    const updated = await this.repository.update(id, { pictureId: attachment.id });
    await clearCachePattern('teacher:all:*');
    await clearCachePattern('teacher:statistics');
    await clearCachePattern(`teacher:id:${id}:*`);

    return updated;
  }

  async deletePicture(id: string) {
    const item = await this.getById(id, true);

    if (!item.pictureId) {
      throw new NotFoundError("Picture not found");
    }

    await attachmentService.delete(item.pictureId);
    const updated = await this.repository.update(id, { pictureId: null });
    await clearCachePattern('teacher:all:*');
    await clearCachePattern('teacher:statistics');
    await clearCachePattern(`teacher:id:${id}:*`);

    return updated;
  }

  async getBatchByIds(ids: string[]) {
    const found = await this.repository.findByIds(ids);
    const foundIds = new Set(found.map((a) => a.id));
    const notFound = ids.filter((id) => !foundIds.has(id));
    return { found, notFound };
  }

  async bulkDelete(ids: string[]) {
    return prisma.$transaction(async (tx) => {
      const items = await tx.teacher.findMany({ where: { id: { in: ids }, deletedAt: null } });
      if (items.length !== ids.length) throw new NotFoundError('Beberapa data tidak ditemukan');

      // Clean up pictures
      for (const item of items) {
        if (item.pictureId) {
          await attachmentService.delete(item.pictureId).catch((e) => console.warn('[Teacher] Cleanup error:', e));
        }
      }

      const userIds = items.map(i => i.userId).filter(id => id) as string[];
      if (userIds.length > 0) {
        await getOrchestrator().authData.bulkDeleteUsers(userIds);
      }
      await tx.teacher.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });

      const deletedItems = await tx.teacher.findMany({ where: { id: { in: ids } } });
      await clearCachePattern('teacher:all:*');
      await clearCachePattern('teacher:statistics');
      for (const item of deletedItems) {
        await clearCachePattern(`teacher:id:${item.id}:*`);
      }

      return true;
    });
  }

  async bulkUpdateStatus(ids: string[], status: TeacherStatus) {
    return prisma.$transaction(async (tx) => {
      const items = await tx.teacher.findMany({ where: { id: { in: ids }, deletedAt: null } });
      if (items.length !== ids.length) throw new NotFoundError('Beberapa data tidak ditemukan');

      await tx.teacher.updateMany({ where: { id: { in: ids }, deletedAt: null }, data: { status } });
      const updated = await tx.teacher.findMany({ where: { id: { in: ids }, deletedAt: null } });

      await clearCachePattern('teacher:all:*');
      await clearCachePattern('teacher:statistics');
      for (const item of updated) {
        await setCache(`teacher:id:${item.id}`, item, 600);
      }

      return updated;
    });
  }

  /**
   * Bulk insert teachers WITHOUT a database transaction.
   * Per-row try/catch so a single failure does not abort the rest.
   * Wraps validateUnique throw in try/catch so pre-existing duplicates
   * in the DB surface as failedRows entries instead of crashing the batch.
   * Returns: { createdItems, successCount, successRows, failedRows }
   */
  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = Record<string, unknown>;
    const rows = await parseExcel<RawRow>(
      buffer,
      ['fullname', 'email', 'password'],
      buildHeaderLabelMap(TEACHER_EXCEL_HEADERS),
    );

    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const preparedRows: Array<{
      parsed: Omit<import('@master/database/index.js').Prisma.TeacherUncheckedCreateInput, 'userId'> & { password?: string };
    }> = [];

    // Phase 1: validate each row WITHOUT throwing — push to failedRows on failure.
    for (const raw of rows) {
      const mapped = {
        fullname: raw['fullname'],
        nik: raw['nik'] ? String(raw['nik']) : undefined,
        birthplace: raw['birthplace'] ? String(raw['birthplace']) : undefined,
        birthdate: raw['birthdate'] ? String(raw['birthdate']) : undefined,
        gender: raw['gender'] ? String(raw['gender']) : undefined,
        religion: raw['religion'] ? String(raw['religion']) : undefined,
        ethnicGroup: raw['ethnic_group'] ? String(raw['ethnic_group']) : undefined,
        status: raw['status'] ? String(raw['status']) : undefined,
        prefixTitle: raw['prefix_title'] ? String(raw['prefix_title']) : undefined,
        suffixTitle: raw['suffix_title'] ? String(raw['suffix_title']) : undefined,
        nip: raw['nip'] ? String(raw['nip']) : undefined,
        height: raw['height'] ? Number(raw['height']) : undefined,
        weight: raw['weight'] ? Number(raw['weight']) : undefined,
        phoneNumber: raw['phone_number'] ? String(raw['phone_number']) : undefined,
        email: raw['email'] ? String(raw['email']) : undefined,
        password: raw['password'] ? String(raw['password']) : undefined,
      };

      try {
        const parsed = createTeacherSchema.omit({ userId: true }).parse(mapped);
        await this.validateUnique(parsed);
        preparedRows.push({ parsed });
      } catch (err: any) {
        failedRows.push({
          ...mapped,
          reason: err?.issues?.[0]?.message ?? err?.message ?? 'Validation error',
        });
      }
    }

    if (preparedRows.length === 0) {
      return {
        createdItems: [],
        successCount: 0,
        successRows: [],
        failedRows,
      };
    }

    // Phase 2: bulk-register users via auth (skips duplicates internally).
    const userResults = await getOrchestrator().authData.bulkRegister(
      preparedRows.map((r) => ({
        identifiers: [{ type: 'email', value: r.parsed.email || '' }],
        password: r.parsed.password || '',
        roles: ['teacher'],
      }))
    );

    const emailToUserId = new Map(userResults.map((u) => [u.email, u.userId]));

    // Phase 3: per-row insert teacher (NO transaction). DB lock stays short.
    const successRows: Array<any> = [];
    for (const row of preparedRows) {
      const userId = emailToUserId.get(row.parsed.email || '');
      if (!userId) {
        failedRows.push({
          email: row.parsed.email,
          fullname: row.parsed.fullname,
          reason: 'Auth registration skipped (duplicate email or invalid)',
        });
        continue;
      }
      const { password, ...teacherData } = row.parsed;
      try {
        const teacher = await prisma.teacher.create({ data: { ...teacherData, userId } });
        successRows.push(teacher);
      } catch (err: any) {
        failedRows.push({
          ...row.parsed,
          reason: err?.message ?? 'Teacher insert error',
        });
      }
    }

    // Phase 4: cache invalidation only if at least one succeeded.
    if (successRows.length > 0) {
      await clearCachePattern('teacher:all:*');
      await clearCachePattern('teacher:statistics');
      for (const item of successRows) {
        await setCache(`teacher:id:${item.id}`, item, 600);
      }
    }

    return {
      createdItems: successRows,
      successCount: successRows.length,
      successRows,
      failedRows,
    };
  }

  async getExcelTemplate(): Promise<Buffer> {
    return generateExcelTemplate(TEACHER_EXCEL_HEADERS, 'Teachers', TEACHER_EXCEL_SAMPLE, {
      gender: ["L", "P"],
      religion: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]
    });
  }
}

export const teacherService = new TeacherService(teacherRepository);
