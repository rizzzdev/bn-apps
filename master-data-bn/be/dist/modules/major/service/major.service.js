"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.majorService = exports.MajorService = void 0;
const repository_1 = require("../../../modules/major/repository");
const errors_1 = require("../../../errors");
const database_1 = require("../../../database");
const cache_1 = require("../../../utils/cache");
const webhook_1 = require("../../../utils/webhook");
class MajorService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getAll(page, limit, includeClasses = false, includeCurrentStudent = false) {
        return (0, cache_1.withCache)(`major:all:page:${page}:limit:${limit}:classes:${includeClasses}:includeCurrentStudent:${includeCurrentStudent}`, 600, async () => {
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.repository.findAll(skip, limit, includeClasses, includeCurrentStudent),
                this.repository.count()
            ]);
            return { data, total };
        });
    }
    async getById(id, includeClasses = false, includeCurrentStudent = false) {
        return (0, cache_1.withCache)(`major:id:${id}:classes:${includeClasses}:includeCurrentStudent:${includeCurrentStudent}`, 600, async () => {
            const item = await this.repository.findById(id, includeClasses, includeCurrentStudent);
            if (!item)
                throw new errors_1.NotFoundError('Jurusan tidak ditemukan');
            return item;
        });
    }
    async validateUnique(data, excludeId) {
        if (data.code) {
            const exists = await this.repository.checkUnique('code', data.code, excludeId);
            if (exists)
                throw new errors_1.BadRequestError('Major code already exists');
        }
        if (data.name) {
            const exists = await this.repository.checkUnique('name', data.name, excludeId);
            if (exists)
                throw new errors_1.BadRequestError('Major name already exists');
        }
    }
    async create(data) {
        await this.validateUnique(data);
        const created = await this.repository.create(data);
        await (0, cache_1.clearCachePattern)('major:all:*');
        await (0, cache_1.setCache)(`major:id:${created.id}`, created, 600);
        (0, webhook_1.sendWebhook)('majors', created);
        return created;
    }
    async update(id, data) {
        await this.getById(id);
        await this.validateUnique(data, id);
        const updated = await this.repository.update(id, data);
        await (0, cache_1.clearCachePattern)('major:all:*');
        await (0, cache_1.setCache)(`major:id:${id}`, updated, 600);
        (0, webhook_1.sendWebhook)('majors', updated);
        return updated;
    }
    async delete(id) {
        await this.getById(id);
        const classes = await database_1.prisma.class.findFirst({ where: { majorId: id, deletedAt: null } });
        if (classes)
            throw new errors_1.BadRequestError('Cannot delete Major because it still has active Classes.');
        const deleted = await this.repository.softDelete(id);
        await (0, cache_1.clearCachePattern)('major:all:*');
        await (0, cache_1.clearCachePattern)(`major:id:${id}`);
        (0, webhook_1.sendWebhook)('majors', deleted);
        return deleted;
    }
    async bulkCreate(data) {
        const uniqueData = [];
        const seenCodes = new Set();
        const seenNames = new Set();
        const failedRows = [];
        for (const item of data) {
            if (!item.code || !item.name) {
                failedRows.push({ ...item, reason: 'Kode atau Nama kosong' });
                continue;
            }
            if (seenCodes.has(item.code) || seenNames.has(item.name)) {
                failedRows.push({ ...item, reason: 'Duplikat kode/nama di dalam file' });
                continue;
            }
            seenCodes.add(item.code);
            seenNames.add(item.name);
            uniqueData.push(item);
        }
        if (uniqueData.length > 0) {
            const existingCodes = await database_1.prisma.major.findMany({
                where: { code: { in: uniqueData.map(d => d.code) }, deletedAt: null },
                select: { code: true }
            });
            const existingNames = await database_1.prisma.major.findMany({
                where: { name: { in: uniqueData.map(d => d.name) }, deletedAt: null },
                select: { name: true }
            });
            const existingCodeSet = new Set(existingCodes.map(c => c.code));
            const existingNameSet = new Set(existingNames.map(n => n.name));
            const toInsert = [];
            for (const item of uniqueData) {
                if (existingCodeSet.has(item.code)) {
                    failedRows.push({ ...item, reason: 'Kode sudah ada di database' });
                }
                else if (existingNameSet.has(item.name)) {
                    failedRows.push({ ...item, reason: 'Nama sudah ada di database' });
                }
                else {
                    toInsert.push(item);
                }
            }
            if (toInsert.length > 0) {
                await database_1.prisma.major.createMany({ data: toInsert });
                await (0, cache_1.clearCachePattern)('major:all:*');
                const inserted = await database_1.prisma.major.findMany({
                    where: { code: { in: toInsert.map(i => i.code) }, deletedAt: null }
                });
                for (const item of inserted) {
                    await (0, cache_1.setCache)(`major:id:${item.id}`, item, 600);
                    (0, webhook_1.sendWebhook)('majors', item);
                }
                return { successCount: toInsert.length, failedRows };
            }
        }
        return { successCount: 0, failedRows };
    }
    async getBatchByIds(ids) {
        const found = await this.repository.findByIds(ids);
        const foundIds = new Set(found.map((a) => a.id));
        const notFound = ids.filter((id) => !foundIds.has(id));
        return { found, notFound };
    }
    async bulkDelete(ids) {
        return database_1.prisma.$transaction(async (tx) => {
            const items = await tx.major.findMany({ where: { id: { in: ids }, deletedAt: null } });
            if (items.length !== ids.length)
                throw new errors_1.NotFoundError('Beberapa data tidak ditemukan');
            const classes = await tx.class.findFirst({ where: { majorId: { in: ids }, deletedAt: null } });
            if (classes)
                throw new errors_1.BadRequestError('Cannot delete Major because it still has active Classes.');
            await tx.major.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
            const deletedItems = await tx.major.findMany({ where: { id: { in: ids } } });
            await (0, cache_1.clearCachePattern)('major:all:*');
            for (const item of deletedItems) {
                await (0, cache_1.clearCachePattern)(`major:id:${item.id}`);
                (0, webhook_1.sendWebhook)('majors', item);
            }
            return true;
        });
    }
}
exports.MajorService = MajorService;
exports.majorService = new MajorService(repository_1.majorRepository);
