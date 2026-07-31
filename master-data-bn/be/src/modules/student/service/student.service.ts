import {
  StudentRepository,
  studentRepository,
} from "@/modules/student/repository";
import { CreateStudentDto, UpdateStudentDto } from "@/modules/student/domain";
import { BadRequestError, NotFoundError } from "@/errors";
import { prisma, sentriAuth } from "@/database";
import { StudentStatus } from "@/database/generated/client";
import { parseExcel, generateExcelTemplate } from "@/utils/excel";
import { createStudentSchema } from "@/modules/student/domain/schemas";
import { randomUUID } from "crypto";
import { withCache, clearCachePattern, setCache } from "@/utils/cache";

import { attachmentRepository } from "@/modules/attachment/repository";
import { attachmentService } from "@/modules/attachment/service";

const STUDENT_EXCEL_HEADERS = [
  "fullname",
  "nik",
  "birthplace",
  "birthdate",
  "gender",
  "religion",
  "ethnic_group",
  "status",
  "nis",
  "nisn",
  "height",
  "weight",
  "phone_number",
  "email",
  "password",
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

export class StudentService {
  constructor(private repository: StudentRepository) {}

  async getAll(
    page: number,
    limit: number,
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
          userId,
          includeCurrentClass,
          includeUser,
          includePicture,
        ),
        this.repository.count(userId),
      ]);
      return { data, total };
    };

    return withCache(
      `student:all:page:${page}:limit:${limit}:userId:${userId || "none"}:includeClass:${includeCurrentClass}:includeUser:${includeUser}:includePicture:${includePicture}`,
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
        // ...(data.phoneNumber
        //   ? [{ type: "phone", value: data.phoneNumber }]
        //   : []),
        // ...(data.nisn ? [{ type: "nisn", value: data.nisn }] : []),
        // ...(data.nik ? [{ type: "nik", value: data.nik }] : []),
        // ...(data.nis ? [{ type: "nis", value: data.nis }] : []),
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
    return restCreated;
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
      await attachmentService.delete(item.pictureId).catch(() => {});
    } else if (data.pictureId && item.pictureId && data.pictureId !== item.pictureId) {
      await attachmentService.delete(item.pictureId).catch(() => {});
    }

    if (item.userId) {
      const updates: Array<{ type: string; value: string }> = [];
      const deletes: string[] = [];

      const currentIdentifiers = await prisma.sentri_identifiers.findMany({
        where: { user_id: item.userId },
      });

      const handleIdentifier = (type: string, newValue?: string) => {
        if (newValue === undefined) return; // Not touched in this update
        const exist = currentIdentifiers.find((i) => i.type === type);

        if (newValue === "") {
          if (exist) deletes.push(exist.id);
        } else {
          if (!exist || exist.value !== newValue) {
            updates.push({ type, value: newValue });
          }
        }
      };

      handleIdentifier("email", data.email);
      // handleIdentifier("phone", data.phoneNumber);

      if (updates.length > 0 && sentriAuth.bulkUpdateIdentifiers) {
        await sentriAuth.bulkUpdateIdentifiers(item.userId, updates);
      }
      if (deletes.length > 0 && sentriAuth.bulkDeleteIdentifiers) {
        await sentriAuth.bulkDeleteIdentifiers(item.userId, deletes);
      }
    }

    const updated = await this.repository.update(id, data);
    await clearCachePattern("student:all:*");
    await clearCachePattern(`student:id:${id}:*`);
    await setCache(`student:id:${id}`, updated, 600);
    const { currentClass, currentMajor, user, picture, ...restUpdated } = updated as any;

    return restUpdated;
  }

  async delete(id: string) {
    const item = await this.getById(id);

    if (item.pictureId) {
      await attachmentService.delete(item.pictureId).catch(() => {});
    }

    if (item.userId) {
      await prisma.sentri_users
        .delete({ where: { id: item.userId } })
        .catch(() => {});
    }
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern("student:all:*");
    await clearCachePattern(`student:id:${id}:*`);

    const { currentClass, currentMajor, user, picture, ...restDeleted } = deleted as any;
    return restDeleted;
  }

  async uploadPicture(id: string, file: Express.Multer.File) {
    const item = await this.getById(id, false, true);

    // Delete old picture if exists
    if (item.pictureId) {
      await attachmentService.delete(item.pictureId).catch(() => {});
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

  async bulkCreate(data: CreateStudentDto[]) {
    // We reuse the same logic as single create, but inside a transaction
    const createdItems = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const d of data) {
        await this.validateUnique(d);
        const passwordHash = await sentriAuth.hashPassword(d.password);
        const userId = randomUUID();

        const identifiers: {
          id: string;
          user_id: string;
          type: string;
          value: string;
        }[] = [
          { id: randomUUID(), user_id: userId, type: "email", value: d.email },
        ];
        // if (d.phoneNumber)
        //   identifiers.push({
        //     id: randomUUID(),
        //     user_id: userId,
        //     type: "phone",
        //     value: d.phoneNumber,
        //   });
        // if (d.nik)
        //   identifiers.push({
        //     id: randomUUID(),
        //     user_id: userId,
        //     type: "nik",
        //     value: d.nik,
        //   });
        // if (d.nis)
        //   identifiers.push({
        //     id: randomUUID(),
        //     user_id: userId,
        //     type: "nis",
        //     value: d.nis,
        //   });
        // if (d.nisn)
        //   identifiers.push({
        //     id: randomUUID(),
        //     user_id: userId,
        //     type: "nisn",
        //     value: d.nisn,
        //   });

        const { password, ...studentData } = d;

        await tx.sentri_users.create({
          data: {
            id: userId,
            password_hash: passwordHash,
            roles: '["student"]',
          },
        });
        await tx.sentri_identifiers.createMany({ data: identifiers });
        const student = await tx.student.create({
          data: { ...studentData, userId },
        });
        results.push(student);
      }
      return results;
    });

    await clearCachePattern("student:all:*");
    for (const item of createdItems) {
      await setCache(`student:id:${item.id}`, item, 600);
    }

    return createdItems;
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
        await tx.sentri_users
          .deleteMany({ where: { id: { in: userIds } } })
          .catch(() => {});
      }

      // Clean up pictures
      for (const item of items) {
        if (item.pictureId) {
          await attachmentService.delete(item.pictureId).catch(() => {});
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

  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = Record<string, unknown>;
    const rows = await parseExcel<RawRow>(buffer, [
      "fullname",
      "email",
      "password",
    ]);

    // Prepare all rows first
    const preparedRows: Array<{
      parsed: Omit<
        import("@/database/generated/client").Prisma.StudentUncheckedCreateInput,
        "userId"
      > & { password?: string };
      passwordHash: string;
    }> = [];
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

      const parsed = createStudentSchema.omit({ userId: true }).parse(mapped);
      await this.validateUnique(parsed);
      const passwordHash = await sentriAuth.hashPassword(parsed.password);
      preparedRows.push({ parsed, passwordHash });
    }

    // Run in a single transaction so it rolls back if any fails
    const createdItems = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const row of preparedRows) {
        const { parsed, passwordHash } = row;
        const userId = randomUUID();

        const identifiers: {
          id: string;
          user_id: string;
          type: string;
          value: string;
        }[] = [
          {
            id: randomUUID(),
            user_id: userId,
            type: "email",
            value: parsed.email || "",
          },
        ];
        // if (parsed.phoneNumber)
        //   identifiers.push({
        //     id: randomUUID(),
        //     user_id: userId,
        //     type: "phone",
        //     value: parsed.phoneNumber,
        //   });
        // if (parsed.nik)
        //   identifiers.push({
        //     id: randomUUID(),
        //     user_id: userId,
        //     type: "nik",
        //     value: parsed.nik,
        //   });
        // if (parsed.nis)
        //   identifiers.push({
        //     id: randomUUID(),
        //     user_id: userId,
        //     type: "nis",
        //     value: parsed.nis,
        //   });
        // if (parsed.nisn)
        //   identifiers.push({
        //     id: randomUUID(),
        //     user_id: userId,
        //     type: "nisn",
        //     value: parsed.nisn,
        //   });

        const { password, ...studentData } = parsed;

        await tx.sentri_users.create({
          data: {
            id: userId,
            password_hash: passwordHash,
            roles: '["student"]',
          },
        });
        await tx.sentri_identifiers.createMany({ data: identifiers });

        const student = await tx.student.create({
          data: { ...studentData, userId },
        });
        results.push(student);
      }

      return results;
    });

    await clearCachePattern("student:all:*");
    for (const item of createdItems)
      await setCache(`student:id:${item.id}`, item, 600);

    return createdItems;
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
}

export const studentService = new StudentService(studentRepository);
