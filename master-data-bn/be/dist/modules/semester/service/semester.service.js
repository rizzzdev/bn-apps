"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.semesterService = exports.SemesterService = void 0;
const repository_1 = require("../../../modules/semester/repository");
const errors_1 = require("../../../errors");
const database_1 = require("../../../database");
const cache_1 = require("../../../utils/cache");
const webhook_1 = require("../../../utils/webhook");
class SemesterService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getAll(page, limit, includeAcademicYear = false) {
        return (0, cache_1.withCache)(`semester:all:page:${page}:limit:${limit}:academicYear:${includeAcademicYear}`, 600, async () => {
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.repository.findAll(skip, limit, includeAcademicYear),
                this.repository.count()
            ]);
            return { data, total };
        });
    }
    async getById(id, includeAcademicYear = false) {
        return (0, cache_1.withCache)(`semester:id:${id}:academicYear:${includeAcademicYear}`, 600, async () => {
            const item = await this.repository.findById(id, includeAcademicYear);
            if (!item)
                throw new errors_1.NotFoundError('Semester tidak ditemukan');
            return item;
        });
    }
    async validateUnique(data, existingItem) {
        const checkType = data.type || existingItem?.type;
        const checkYearId = data.academicYearId || existingItem?.academicYearId;
        if (checkType && checkYearId) {
            const exists = await this.repository.checkUniqueType(checkType, checkYearId, existingItem?.id);
            if (exists)
                throw new errors_1.BadRequestError('Semester type already exists for this academic year');
        }
        if (data.status === 'Aktif') {
            const activeExists = await this.repository.checkActiveStatus(existingItem?.id);
            if (activeExists)
                throw new errors_1.BadRequestError('An active semester already exists');
        }
        if (checkYearId) {
            const ay = await database_1.prisma.academicYear.findFirst({ where: { id: checkYearId, deletedAt: null } });
            if (!ay)
                throw new errors_1.BadRequestError('Tahun ajaran tidak ditemukan atau telah dihapus');
        }
    }
    async create(data) {
        await this.validateUnique(data);
        const created = await this.repository.create(data);
        await (0, cache_1.clearCachePattern)('semester:all:*');
        await (0, cache_1.clearCachePattern)('academic-year:all:*');
        await (0, cache_1.clearCachePattern)(`academic-year:id:${created.academicYearId}`);
        await (0, cache_1.setCache)(`semester:id:${created.id}`, created, 600);
        (0, webhook_1.sendWebhook)('semesters', created);
        return created;
    }
    async update(id, data) {
        const item = await this.getById(id);
        await this.validateUnique(data, item);
        const updated = await this.repository.update(id, data);
        await (0, cache_1.clearCachePattern)('semester:all:*');
        await (0, cache_1.clearCachePattern)('academic-year:all:*');
        if (item.academicYearId)
            await (0, cache_1.clearCachePattern)(`academic-year:id:${item.academicYearId}`);
        if (data.academicYearId && data.academicYearId !== item.academicYearId)
            await (0, cache_1.clearCachePattern)(`academic-year:id:${data.academicYearId}`);
        await (0, cache_1.setCache)(`semester:id:${id}`, updated, 600);
        (0, webhook_1.sendWebhook)('semesters', updated);
        return updated;
    }
    async delete(id) {
        const item = await this.getById(id);
        const deleted = await this.repository.softDelete(id);
        await (0, cache_1.clearCachePattern)('semester:all:*');
        await (0, cache_1.clearCachePattern)(`semester:id:${id}`);
        await (0, cache_1.clearCachePattern)('academic-year:all:*');
        await (0, cache_1.clearCachePattern)(`academic-year:id:${item.academicYearId}`);
        (0, webhook_1.sendWebhook)('semesters', deleted);
        return deleted;
    }
    async getBatchByIds(ids) {
        const found = await this.repository.findByIds(ids);
        const foundIds = new Set(found.map((a) => a.id));
        const notFound = ids.filter((id) => !foundIds.has(id));
        return { found, notFound };
    }
    async bulkDelete(ids) {
        return database_1.prisma.$transaction(async (tx) => {
            const items = await tx.semester.findMany({ where: { id: { in: ids }, deletedAt: null } });
            if (items.length !== ids.length)
                throw new errors_1.NotFoundError('Beberapa data tidak ditemukan');
            await tx.semester.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
            const deletedItems = await tx.semester.findMany({ where: { id: { in: ids } } });
            await (0, cache_1.clearCachePattern)('semester:all:*');
            await (0, cache_1.clearCachePattern)('academic-year:all:*');
            for (const item of deletedItems) {
                await (0, cache_1.clearCachePattern)(`semester:id:${item.id}`);
                await (0, cache_1.clearCachePattern)(`academic-year:id:${item.academicYearId}`);
                (0, webhook_1.sendWebhook)('semesters', item);
            }
            return true;
        });
    }
}
exports.SemesterService = SemesterService;
exports.semesterService = new SemesterService(repository_1.semesterRepository);
