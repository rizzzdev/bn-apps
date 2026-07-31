"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicyearService = exports.AcademicYearService = void 0;
const repository_1 = require("../../../modules/academic-year/repository");
const errors_1 = require("../../../errors");
const database_1 = require("../../../database");
const cache_1 = require("../../../utils/cache");
const webhook_1 = require("../../../utils/webhook");
class AcademicYearService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getAll(page, limit, includeSemesters = false) {
        return (0, cache_1.withCache)(`academic-year:all:page:${page}:limit:${limit}:semesters:${includeSemesters}`, 600, async () => {
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.repository.findAll(skip, limit, includeSemesters),
                this.repository.count()
            ]);
            return { data, total };
        });
    }
    async getById(id, includeSemesters = false) {
        return (0, cache_1.withCache)(`academic-year:id:${id}:semesters:${includeSemesters}`, 600, async () => {
            const item = await this.repository.findById(id, includeSemesters);
            if (!item)
                throw new errors_1.NotFoundError('AcademicYear not found');
            return item;
        });
    }
    async validateUnique(data, excludeId) {
        if (data.code) {
            const exists = await this.repository.checkUnique('code', data.code, excludeId);
            if (exists)
                throw new errors_1.BadRequestError('Academic year code already exists');
        }
        if (data.status === 'Aktif') {
            const activeExists = await this.repository.checkActiveStatus(excludeId);
            if (activeExists)
                throw new errors_1.BadRequestError('An active academic year already exists');
        }
    }
    async create(data) {
        if (!data.endYear) {
            data.endYear = data.startYear + 1;
        }
        if (data.endYear !== data.startYear + 1) {
            throw new errors_1.BadRequestError('Tahun Selesai harus tepat 1 tahun setelah Tahun Mulai');
        }
        data.code = `${data.startYear}/${data.endYear}`;
        await this.validateUnique(data);
        const created = await this.repository.create(data);
        await (0, cache_1.clearCachePattern)('academic-year:all:*');
        await (0, cache_1.setCache)(`academic-year:id:${created.id}`, created, 600);
        (0, webhook_1.sendWebhook)('academic-years', created);
        return created;
    }
    async update(id, data) {
        const item = await this.getById(id);
        const currentStartYear = data.startYear || item.startYear;
        const currentEndYear = data.endYear || item.endYear;
        if (currentEndYear !== currentStartYear + 1) {
            throw new errors_1.BadRequestError('Tahun Selesai harus tepat 1 tahun setelah Tahun Mulai');
        }
        if (data.startYear || data.endYear) {
            data.code = `${currentStartYear}/${currentEndYear}`;
        }
        await this.validateUnique(data, id);
        const updated = await this.repository.update(id, data);
        await (0, cache_1.clearCachePattern)('academic-year:all:*');
        await (0, cache_1.setCache)(`academic-year:id:${id}`, updated, 600);
        (0, webhook_1.sendWebhook)('academic-years', updated);
        return updated;
    }
    async delete(id) {
        await this.getById(id);
        const semesters = await database_1.prisma.semester.findFirst({ where: { academicYearId: id, deletedAt: null } });
        if (semesters)
            throw new errors_1.BadRequestError('Cannot delete Academic Year because it still has active Semesters.');
        const deleted = await this.repository.softDelete(id);
        await (0, cache_1.clearCachePattern)('academic-year:all:*');
        await (0, cache_1.clearCachePattern)(`academic-year:id:${id}`);
        (0, webhook_1.sendWebhook)('academic-years', deleted);
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
            const items = await tx.academicYear.findMany({ where: { id: { in: ids }, deletedAt: null } });
            if (items.length !== ids.length)
                throw new errors_1.NotFoundError('Beberapa data tidak ditemukan');
            const semesters = await tx.semester.findFirst({ where: { academicYearId: { in: ids }, deletedAt: null } });
            if (semesters)
                throw new errors_1.BadRequestError('Cannot delete Academic Year because it still has active Semesters.');
            await tx.academicYear.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
            const deletedItems = await tx.academicYear.findMany({ where: { id: { in: ids } } });
            await (0, cache_1.clearCachePattern)('academic-year:all:*');
            for (const item of deletedItems) {
                await (0, cache_1.clearCachePattern)(`academic-year:id:${item.id}`);
                (0, webhook_1.sendWebhook)('academic-years', item);
            }
            return true;
        });
    }
}
exports.AcademicYearService = AcademicYearService;
exports.academicyearService = new AcademicYearService(repository_1.academicyearRepository);
