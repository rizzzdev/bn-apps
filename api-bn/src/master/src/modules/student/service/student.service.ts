import {
  StudentRepository,
  studentRepository,
} from '@master/modules/student/repository';
import { CreateStudentDto, UpdateStudentDto, ChangePasswordDto } from '@master/modules/student/domain';
import { BadRequestError, NotFoundError } from '@app/index.js';
import { prisma } from '@master/database/index.js';
import { sentriAuth } from '@auth/index.js';
import { StudentStatus } from '@master/database/index.js';
import { parseExcel, generateExcelTemplate, buildHeaderLabelMap, putOptionalToNull, type HeaderSpec } from '@app/index.js';
import { createStudentSchema } from '@master/modules/student/domain/schemas';
import { randomUUID } from "crypto";
import { withCache, clearCachePattern, setCache } from '@app/index.js';
import { attachmentRepository } from '@master/modules/attachment/repository';
import { attachmentService } from '@master/modules/attachment/service';
import { getOrchestrator } from '@app/orchestrator.js';

const STUDENT_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Nama Lengkap', key: 'fullname' },
  { label: 'NIK', key: 'nik' },
  { label: 'Tempat Lahir', key: 'birthplace' },
  { label: 'Tanggal Lahir', key: 'birthdate' },
  { label: 'Jenis Kelamin', key: 'gender' },
  { label: 'Agama', key: 'religion' },
  { label: 'Suku', key: 'ethnic_group' },
  { label: 'Status', key: 'status' },
  { label: 'NIS', key: 'nis' },
  { label: 'NISN', key: 'nisn' },
  { label: 'Tinggi (cm)', key: 'height' },
  { label: 'Berat (kg)', key: 'weight' },
  { label: 'Nomor Telepon', key: 'phone_number' },
  { label: 'Email', key: 'email' },
  { label: 'Password', key: 'password' },
];

const STUDENT_EXCEL_SAMPLE: Record<string, unknown> = {
  fullname: "Siti Aminah",
  nik: "3201010101050001",
  birthplace: "Bandung",
  birthdate: "2005-05-15",
  gender: "P",
  religion: "Islam",
  ethnic_group: "Sunda",
  status: "Aktif",
  nis: "2024001",
  nisn: "0123456789",
  height: 160,
  weight: 50,
  phone_number: "08987654321",
  email: "siti.aminah@example.com",
  password: "password123",
};

const STUDENT_NULLABLE_UPDATE_FIELDS = [
  'nik', 'nis', 'nisn',
  'birthplace', 'birthdate', 'ethnicGroup',
  'height', 'weight', 'phoneNumber', 'gender', 'religion',
] as const;

export class StudentService {
  constructor(private repository: StudentRepository) {}

  async getAll(
    page: number,
    limit: number,
    search?: string,
    userId?: string,
    includeCurrentClass = false,
    includeUser = false,
    includePicture = false,
  ) {
    const resultFunc = async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(
          skip,
          limit,
          search,
          userId,
          includeCurrentClass,
          includeUser,
          includePicture,
        ),
        this.repository.count(search, userId),
      ]);
      return { data, total };
    };

    return withCache(
      `student:all:page:${page}:limit:${limit}:search:${search || "none"}:userId:${userId || "none"}:includeClass:${includeCurrentClass}:includeUser:${includeUser}:includePicture:${includePicture}`,
      600,
      resultFunc,
    );
  }

  async getStatistic() {
    return withCache(`student:statistic`, 600, async () => {
      const { stats } = await this.repository.getStatistic();

      let totalSiswa = 0;
      let totalSiswaAktif = 0;
      let totalSiswaTidakAktif = 0;
      let totalSiswaLulus = 0;

      for (const stat of stats) {
        totalSiswa += stat._count._all;
        if (stat.status === "Aktif") {
          totalSiswaAktif += stat._count._all;
        } else if (stat.status === "Tidak_Aktif") {
          totalSiswaTidakAktif += stat._count._all;
        } else if (stat.status === "Lulus") {
          totalSiswaLulus += stat._count._all;
        }
      }

      return {
        totalSiswa,
        totalSiswaAktif,
        totalSiswaTidakAktif,
        totalSiswaLulus,
      };
    });
  }

  async getById(id: string, includeCurrentClass = false, includePicture = false) {
    return withCache(
      `student:id:${id}:includeClass:${includeCurrentClass}:includePicture:${includePicture}`,
      600,
      async () => {
        const item = await this.repository.findById(id, includeCurrentClass, includePicture);
        if (!item) throw new NotFoundError("Siswa tidak ditemukan");
        return item;
      },
    );
  }

  async validateUnique(data: Partial<CreateStudentDto>, excludeId?: string) {
    if (data.nik) {
      const exists = await this.repository.checkUnique(
        "nik",
        data.nik,
        excludeId,
      );
      if (exists) throw new BadRequestError("NIK already exists");
    }
    if (data.nis) {
      const exists = await this.repository.checkUnique(
        "nis",
        data.nis,
        excludeId,
      );
      if (exists) throw new BadRequestError("NIS already exists");
    }
    if (data.nisn) {
      const exists = await this.repository.checkUnique(
        "nisn",
        data.nisn,
        excludeId,
      );
      if (exists) throw new BadRequestError("NISN already exists");
    }
    if (data.phoneNumber) {
      const exists = await this.repository.checkUnique(
        "phoneNumber",
        data.phoneNumber,
        excludeId,
      );
      if (exists) throw new BadRequestError("Phone number already exists");
    }
    if (data.email) {
      const exists = await this.repository.checkUnique(
        "email",
        data.email,
        excludeId,
      );
      if (exists) throw new BadRequestError("Email already exists");
    }
    if (data.userId) {
      const exists = await this.repository.checkUnique(
        "userId",
        data.userId,
        excludeId,
      );
      if (exists) throw new BadRequestError("User ID already exists");
    }
  }

  async create(data: CreateStudentDto) {
    await this.validateUnique(data);

    if (data.pictureId) {
      const attachment = await attachmentRepository.findById(data.pictureId);
      if (!attachment) throw new NotFoundError("Picture not found");
    }

    const registerUser = await sentriAuth.register({
      identifiers: [
        {
          type: "email",
          value: data.email,
        },
      ],
      password: data.password,
      roles: ["student"],
    });
    if (!registerUser.success) {
      throw new BadRequestError(JSON.stringify(registerUser.error));
    }

    const created = await this.repository.create(data, registerUser.user.id);
    await clearCachePattern("student:all:*");
    await setCache(`student:id:${created.id}`, created, 600);

    const { currentClass, currentMajor, user, picture, ...restCreated } = created as any;
    const cleanRest = restCreated;
    return cleanRest;
  }

  async update(id: string, data: UpdateStudentDto) {
    const item = await this.getById(id);
    await this.validateUnique(data, id);

    if (data.pictureId) {
      const attachment = await attachmentRepository.findById(data.pictureId);
      if (!attachment) throw new NotFoundError("Picture not found");
    }

    // Clean up old picture if replaced or removed
    if (data.pictureId === null && item.pictureId) {
      await attachmentService.delete(item.pictureId).catch((e) => console.warn('[Student] Cleanup error:', e));
    } else if (data.pictureId && item.pictureId && data.pictureId !== item.pictureId) {
      await attachmentService.delete(item.pictureId).catch((e) => console.warn('[Student] Cleanup error:', e));
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

    const updated = await this.repository.update(id, putOptionalToNull(data, STUDENT_NULLABLE_UPDATE_FIELDS));
    await clearCachePattern("student:all:*");
    await clearCachePattern(`student:id:${id}:*`);
    await setCache(`student:id:${id}`, updated, 600);
    const { currentClass, currentMajor, user, picture, ...restUpdated } = updated as any;
    const cleanRest = restUpdated;
    return cleanRest;
  }

  async delete(id: string) {
    const item = await this.getById(id);

    if (item.pictureId) {
      await attachmentService.delete(item.pictureId).catch((e) => console.warn('[Student] Cleanup error:', e));
    }

    if (item.userId) {
      await getOrchestrator().authData.deleteUser(item.userId);
    }
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern("student:all:*");
    await clearCachePattern(`student:id:${id}:*`);

    const { currentClass, currentMajor, user, picture, ...restDeleted } = deleted as any;
    const cleanRest = restDeleted;
    return cleanRest;
  }

  async uploadPicture(id: string, file: Express.Multer.File) {
    const item = await this.getById(id, false, true);

    // Delete old picture if exists
    if (item.pictureId) {
      await attachmentService.delete(item.pictureId).catch((e) => console.warn('[Student] Cleanup error:', e));
    }

    // Upload new picture
    const attachment = await attachmentService.upload(file);

    // Update student with new pictureId
    const updated = await this.repository.update(id, { pictureId: attachment.id });
    await clearCachePattern("student:all:*");
    await clearCachePattern(`student:id:${id}:*`);

    return updated;
  }

  async deletePicture(id: string) {
    const item = await this.getById(id, false, true);

    if (!item.pictureId) {
      throw new NotFoundError("Picture not found");
    }

    await attachmentService.delete(item.pictureId);
    const updated = await this.repository.update(id, { pictureId: null });
    await clearCachePattern("student:all:*");
    await clearCachePattern(`student:id:${id}:*`);

    return updated;
  }

  /**
   * Bulk insert students WITHOUT a database transaction.
   * Per-row try/catch so a single failure does not abort the rest.
   * Wraps both validateUnique throw and auth.register errors in try/catch.
   * Returns: { createdItems, successCount, successRows, failedRows }
   */
  async bulkCreate(data: CreateStudentDto[]) {
    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const successRows: any[] = [];

    for (const d of data) {
      try {
        await this.validateUnique(d);

        const { userId } = await getOrchestrator().authData.register({
          identifiers: [{ type: 'email', value: d.email }],
          password: d.password,
          roles: ['student'],
        });

        const { password, ...studentData } = d;
        const student = await prisma.student.create({
          data: { ...studentData, userId },
        });
        successRows.push(student);
      } catch (err: any) {
        failedRows.push({
          ...d,
          reason: err?.issues?.[0]?.message ?? err?.message ?? 'Insert error',
        });
      }
    }

    // Cache invalidation only if at least one succeeded
    if (successRows.length > 0) {
      await clearCachePattern("student:all:*");
      for (const item of successRows) {
        await setCache(`student:id:${item.id}`, item, 600);
      }
    }

    return {
      createdItems: successRows,
      successCount: successRows.length,
      successRows,
      failedRows,
    };
  }

  async getBatchByIds(ids: string[]) {
    const found = await this.repository.findByIds(ids);
    const foundIds = new Set(found.map((a) => a.id));
    const notFound = ids.filter((id) => !foundIds.has(id));
    return { found, notFound };
  }

  async bulkDelete(ids: string[]) {
    return prisma.$transaction(async (tx) => {
      const items = await tx.student.findMany({
        where: { id: { in: ids }, deletedAt: null },
      });
      if (items.length !== ids.length)
        throw new NotFoundError("Beberapa data tidak ditemukan");

      const userIds = items.map((i) => i.userId).filter((id) => id) as string[];
      if (userIds.length > 0) {
        await getOrchestrator().authData.bulkDeleteUsers(userIds);
      }

      // Clean up pictures
      for (const item of items) {
        if (item.pictureId) {
          await attachmentService.delete(item.pictureId).catch((e) => console.warn('[Student] Cleanup error:', e));
        }
      }

      await tx.student.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });

      const deletedItems = await tx.student.findMany({ where: { id: { in: ids } } });
      await clearCachePattern("student:all:*");
      for (const item of deletedItems) {
        await clearCachePattern(`student:id:${item.id}:*`);
          }

      return true;
    });
  }

  async bulkUpdateStatus(ids: string[], status: StudentStatus) {
    return prisma.$transaction(async (tx) => {
      const items = await tx.student.findMany({
        where: { id: { in: ids }, deletedAt: null },
      });
      if (items.length !== ids.length)
        throw new NotFoundError("Beberapa data tidak ditemukan");

      await tx.student.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { status },
      });
      const updated = await tx.student.findMany({
        where: { id: { in: ids }, deletedAt: null },
      });

      await clearCachePattern("student:all:*");
      for (const item of updated) {
        await setCache(`student:id:${item.id}`, item, 600);
          }

      return updated;
    });
  }

  /**
   * Bulk insert students from Excel WITHOUT a database transaction.
   * Per-row try/catch so a single failure does not abort the rest.
   * Returns: { createdItems, successCount, successRows, failedRows }
   */
  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = Record<string, unknown>;
    const rows = await parseExcel<RawRow>(
      buffer,
      ['fullname', 'email', 'password'],
      buildHeaderLabelMap(STUDENT_EXCEL_HEADERS),
    );

    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const preparedRows: Array<{
      parsed: Omit<
        import('@master/database/index.js').Prisma.StudentUncheckedCreateInput,
        "userId"
      > & { password?: string };
    }> = [];

    // Phase 1: validate each row WITHOUT throwing — push to failedRows on failure.
    for (const raw of rows) {
      const mapped = {
        fullname: raw["fullname"],
        nik: raw["nik"] ? String(raw["nik"]) : undefined,
        birthplace: raw["birthplace"] ? String(raw["birthplace"]) : undefined,
        birthdate: raw["birthdate"] ? String(raw["birthdate"]) : undefined,
        gender: raw["gender"] ? String(raw["gender"]) : undefined,
        religion: raw["religion"] ? String(raw["religion"]) : undefined,
        ethnicGroup: raw["ethnic_group"]
          ? String(raw["ethnic_group"])
          : undefined,
        status: raw["status"] ? String(raw["status"]) : undefined,
        nis: raw["nis"] ? String(raw["nis"]) : undefined,
        nisn: raw["nisn"] ? String(raw["nisn"]) : undefined,
        height: raw["height"] ? Number(raw["height"]) : undefined,
        weight: raw["weight"] ? Number(raw["weight"]) : undefined,
        phoneNumber: raw["phone_number"]
          ? String(raw["phone_number"])
          : undefined,
        email: raw["email"] ? String(raw["email"]) : undefined,
        password: raw["password"] ? String(raw["password"]) : undefined,
      };

      try {
        const parsed = createStudentSchema.omit({ userId: true }).parse(mapped);
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
        roles: ['student'],
      }))
    );

    const emailToUserId = new Map(userResults.map((u) => [u.email, u.userId]));

    // Phase 3: per-row insert student (NO transaction). DB lock stays short.
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
      const { password, ...studentData } = row.parsed;
      try {
        const student = await prisma.student.create({
          data: { ...studentData, userId },
        });
        successRows.push(student);
      } catch (err: any) {
        failedRows.push({
          ...row.parsed,
          reason: err?.message ?? 'Student insert error',
        });
      }
    }

    // Phase 4: cache invalidation only if at least one succeeded.
    if (successRows.length > 0) {
      await clearCachePattern("student:all:*");
      for (const item of successRows) {
        await setCache(`student:id:${item.id}`, item, 600);
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
    return generateExcelTemplate(
      STUDENT_EXCEL_HEADERS,
      "Students",
      STUDENT_EXCEL_SAMPLE,
      {
        gender: ["L", "P"],
        religion: [
          "Islam",
          "Kristen",
          "Katolik",
          "Hindu",
          "Buddha",
          "Konghucu",
        ],
      },
    );
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const item = await this.getById(id);
    if (!item.userId) {
      throw new BadRequestError('Murid ini tidak memiliki akun (userId)');
    }
    await getOrchestrator().masterAuth.changePassword(item.userId, dto.newPassword);
    return { success: true, message: 'Password berhasil diubah' };
  }
}

export const studentService = new StudentService(studentRepository);
