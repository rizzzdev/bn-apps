"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentService = exports.StudentService = void 0;
const repository_1 = require("../../../modules/student/repository");
const errors_1 = require("../../../errors");
const database_1 = require("../../../database");
const excel_1 = require("../../../utils/excel");
const schemas_1 = require("../../../modules/student/domain/schemas");
const crypto_1 = require("crypto");
const cache_1 = require("../../../utils/cache");
const webhook_1 = require("../../../utils/webhook");
const repository_2 = require("../../../modules/attachment/repository");
const service_1 = require("../../../modules/attachment/service");
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
const STUDENT_EXCEL_SAMPLE = {
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
class StudentService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getAll(page, limit, userId, includeCurrentClass = false, includeUser = false, includePicture = false) {
        const resultFunc = async () => {
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.repository.findAll(skip, limit, userId, includeCurrentClass, includeUser, includePicture),
                this.repository.count(userId),
            ]);
            return { data, total };
        };
        return (0, cache_1.withCache)(`student:all:page:${page}:limit:${limit}:userId:${userId || "none"}:includeClass:${includeCurrentClass}:includeUser:${includeUser}:includePicture:${includePicture}`, 600, resultFunc);
    }
    async getStatistic() {
        return (0, cache_1.withCache)(`student:statistic`, 600, async () => {
            const { stats } = await this.repository.getStatistic();
            let totalSiswa = 0;
            let totalSiswaAktif = 0;
            let totalSiswaTidakAktif = 0;
            let totalSiswaLulus = 0;
            for (const stat of stats) {
                totalSiswa += stat._count._all;
                if (stat.status === "Aktif") {
                    totalSiswaAktif += stat._count._all;
                }
                else if (stat.status === "Tidak_Aktif") {
                    totalSiswaTidakAktif += stat._count._all;
                }
                else if (stat.status === "Lulus") {
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
    async getById(id, includeCurrentClass = false, includePicture = false) {
        return (0, cache_1.withCache)(`student:id:${id}:includeClass:${includeCurrentClass}:includePicture:${includePicture}`, 600, async () => {
            const item = await this.repository.findById(id, includeCurrentClass, includePicture);
            if (!item)
                throw new errors_1.NotFoundError("Siswa tidak ditemukan");
            return item;
        });
    }
    async validateUnique(data, excludeId) {
        if (data.nik) {
            const exists = await this.repository.checkUnique("nik", data.nik, excludeId);
            if (exists)
                throw new errors_1.BadRequestError("NIK already exists");
        }
        if (data.nis) {
            const exists = await this.repository.checkUnique("nis", data.nis, excludeId);
            if (exists)
                throw new errors_1.BadRequestError("NIS already exists");
        }
        if (data.nisn) {
            const exists = await this.repository.checkUnique("nisn", data.nisn, excludeId);
            if (exists)
                throw new errors_1.BadRequestError("NISN already exists");
        }
        if (data.phoneNumber) {
            const exists = await this.repository.checkUnique("phoneNumber", data.phoneNumber, excludeId);
            if (exists)
                throw new errors_1.BadRequestError("Phone number already exists");
        }
        if (data.email) {
            const exists = await this.repository.checkUnique("email", data.email, excludeId);
            if (exists)
                throw new errors_1.BadRequestError("Email already exists");
        }
        if (data.userId) {
            const exists = await this.repository.checkUnique("userId", data.userId, excludeId);
            if (exists)
                throw new errors_1.BadRequestError("User ID already exists");
        }
    }
    async create(data) {
        await this.validateUnique(data);
        if (data.pictureId) {
            const attachment = await repository_2.attachmentRepository.findById(data.pictureId);
            if (!attachment)
                throw new errors_1.NotFoundError("Picture not found");
        }
        const registerUser = await database_1.sentriAuth.register({
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
            throw new errors_1.BadRequestError(JSON.stringify(registerUser.error));
        }
        const created = await this.repository.create(data, registerUser.user.id);
        await (0, cache_1.clearCachePattern)("student:all:*");
        await (0, cache_1.setCache)(`student:id:${created.id}`, created, 600);
        (0, webhook_1.sendWebhook)("students", created);
        const { currentClass, currentMajor, user, picture, ...restCreated } = created;
        return restCreated;
    }
    async update(id, data) {
        const item = await this.getById(id);
        await this.validateUnique(data, id);
        if (data.pictureId) {
            const attachment = await repository_2.attachmentRepository.findById(data.pictureId);
            if (!attachment)
                throw new errors_1.NotFoundError("Picture not found");
        }
        // Clean up old picture if replaced or removed
        if (data.pictureId === null && item.pictureId) {
            await service_1.attachmentService.delete(item.pictureId).catch(() => { });
        }
        else if (data.pictureId && item.pictureId && data.pictureId !== item.pictureId) {
            await service_1.attachmentService.delete(item.pictureId).catch(() => { });
        }
        if (item.userId) {
            const updates = [];
            const deletes = [];
            const currentIdentifiers = await database_1.prisma.sentri_identifiers.findMany({
                where: { user_id: item.userId },
            });
            const handleIdentifier = (type, newValue) => {
                if (newValue === undefined)
                    return; // Not touched in this update
                const exist = currentIdentifiers.find((i) => i.type === type);
                if (newValue === "") {
                    if (exist)
                        deletes.push(exist.id);
                }
                else {
                    if (!exist || exist.value !== newValue) {
                        updates.push({ type, value: newValue });
                    }
                }
            };
            handleIdentifier("email", data.email);
            // handleIdentifier("phone", data.phoneNumber);
            if (updates.length > 0 && database_1.sentriAuth.bulkUpdateIdentifiers) {
                await database_1.sentriAuth.bulkUpdateIdentifiers(item.userId, updates);
            }
            if (deletes.length > 0 && database_1.sentriAuth.bulkDeleteIdentifiers) {
                await database_1.sentriAuth.bulkDeleteIdentifiers(item.userId, deletes);
            }
        }
        const updated = await this.repository.update(id, data);
        await (0, cache_1.clearCachePattern)("student:all:*");
        await (0, cache_1.clearCachePattern)(`student:id:${id}:*`);
        await (0, cache_1.setCache)(`student:id:${id}`, updated, 600);
        (0, webhook_1.sendWebhook)("students", updated);
        const { currentClass, currentMajor, user, picture, ...restUpdated } = updated;
        return restUpdated;
    }
    async delete(id) {
        const item = await this.getById(id);
        if (item.pictureId) {
            await service_1.attachmentService.delete(item.pictureId).catch(() => { });
        }
        if (item.userId) {
            await database_1.prisma.sentri_users
                .delete({ where: { id: item.userId } })
                .catch(() => { });
        }
        const deleted = await this.repository.softDelete(id);
        await (0, cache_1.clearCachePattern)("student:all:*");
        await (0, cache_1.clearCachePattern)(`student:id:${id}:*`);
        (0, webhook_1.sendWebhook)("students", deleted);
        const { currentClass, currentMajor, user, picture, ...restDeleted } = deleted;
        return restDeleted;
    }
    async uploadPicture(id, file) {
        const item = await this.getById(id, false, true);
        // Delete old picture if exists
        if (item.pictureId) {
            await service_1.attachmentService.delete(item.pictureId).catch(() => { });
        }
        // Upload new picture
        const attachment = await service_1.attachmentService.upload(file);
        // Update student with new pictureId
        const updated = await this.repository.update(id, { pictureId: attachment.id });
        await (0, cache_1.clearCachePattern)("student:all:*");
        await (0, cache_1.clearCachePattern)(`student:id:${id}:*`);
        return updated;
    }
    async deletePicture(id) {
        const item = await this.getById(id, false, true);
        if (!item.pictureId) {
            throw new errors_1.NotFoundError("Picture not found");
        }
        await service_1.attachmentService.delete(item.pictureId);
        const updated = await this.repository.update(id, { pictureId: null });
        await (0, cache_1.clearCachePattern)("student:all:*");
        await (0, cache_1.clearCachePattern)(`student:id:${id}:*`);
        return updated;
    }
    async bulkCreate(data) {
        // We reuse the same logic as single create, but inside a transaction
        const createdItems = await database_1.prisma.$transaction(async (tx) => {
            const results = [];
            for (const d of data) {
                await this.validateUnique(d);
                const passwordHash = await database_1.sentriAuth.hashPassword(d.password);
                const userId = (0, crypto_1.randomUUID)();
                const identifiers = [
                    { id: (0, crypto_1.randomUUID)(), user_id: userId, type: "email", value: d.email },
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
        await (0, cache_1.clearCachePattern)("student:all:*");
        for (const item of createdItems) {
            await (0, cache_1.setCache)(`student:id:${item.id}`, item, 600);
            (0, webhook_1.sendWebhook)("students", item);
        }
        return createdItems;
    }
    async getBatchByIds(ids) {
        const found = await this.repository.findByIds(ids);
        const foundIds = new Set(found.map((a) => a.id));
        const notFound = ids.filter((id) => !foundIds.has(id));
        return { found, notFound };
    }
    async bulkDelete(ids) {
        return database_1.prisma.$transaction(async (tx) => {
            const items = await tx.student.findMany({
                where: { id: { in: ids }, deletedAt: null },
            });
            if (items.length !== ids.length)
                throw new errors_1.NotFoundError("Beberapa data tidak ditemukan");
            const userIds = items.map((i) => i.userId).filter((id) => id);
            if (userIds.length > 0) {
                await tx.sentri_users
                    .deleteMany({ where: { id: { in: userIds } } })
                    .catch(() => { });
            }
            // Clean up pictures
            for (const item of items) {
                if (item.pictureId) {
                    await service_1.attachmentService.delete(item.pictureId).catch(() => { });
                }
            }
            await tx.student.updateMany({
                where: { id: { in: ids } },
                data: { deletedAt: new Date() },
            });
            const deletedItems = await tx.student.findMany({ where: { id: { in: ids } } });
            await (0, cache_1.clearCachePattern)("student:all:*");
            for (const item of deletedItems) {
                await (0, cache_1.clearCachePattern)(`student:id:${item.id}:*`);
                (0, webhook_1.sendWebhook)("students", item);
            }
            return true;
        });
    }
    async bulkUpdateStatus(ids, status) {
        return database_1.prisma.$transaction(async (tx) => {
            const items = await tx.student.findMany({
                where: { id: { in: ids }, deletedAt: null },
            });
            if (items.length !== ids.length)
                throw new errors_1.NotFoundError("Beberapa data tidak ditemukan");
            await tx.student.updateMany({
                where: { id: { in: ids }, deletedAt: null },
                data: { status },
            });
            const updated = await tx.student.findMany({
                where: { id: { in: ids }, deletedAt: null },
            });
            await (0, cache_1.clearCachePattern)("student:all:*");
            for (const item of updated) {
                await (0, cache_1.setCache)(`student:id:${item.id}`, item, 600);
                (0, webhook_1.sendWebhook)("students", item);
            }
            return updated;
        });
    }
    async bulkCreateFromExcel(buffer) {
        const rows = await (0, excel_1.parseExcel)(buffer, [
            "fullname",
            "email",
            "password",
        ]);
        // Prepare all rows first
        const preparedRows = [];
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
            const parsed = schemas_1.createStudentSchema.omit({ userId: true }).parse(mapped);
            await this.validateUnique(parsed);
            const passwordHash = await database_1.sentriAuth.hashPassword(parsed.password);
            preparedRows.push({ parsed, passwordHash });
        }
        // Run in a single transaction so it rolls back if any fails
        const createdItems = await database_1.prisma.$transaction(async (tx) => {
            const results = [];
            for (const row of preparedRows) {
                const { parsed, passwordHash } = row;
                const userId = (0, crypto_1.randomUUID)();
                const identifiers = [
                    {
                        id: (0, crypto_1.randomUUID)(),
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
        await (0, cache_1.clearCachePattern)("student:all:*");
        for (const item of createdItems)
            await (0, cache_1.setCache)(`student:id:${item.id}`, item, 600);
        return createdItems;
    }
    async getExcelTemplate() {
        return (0, excel_1.generateExcelTemplate)(STUDENT_EXCEL_HEADERS, "Students", STUDENT_EXCEL_SAMPLE, {
            gender: ["L", "P"],
            religion: [
                "Islam",
                "Kristen",
                "Katolik",
                "Hindu",
                "Buddha",
                "Konghucu",
            ],
        });
    }
}
exports.StudentService = StudentService;
exports.studentService = new StudentService(repository_1.studentRepository);
