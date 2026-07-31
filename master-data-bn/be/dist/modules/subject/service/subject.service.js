"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectService = exports.SubjectService = void 0;
const repository_1 = require("../../../modules/subject/repository");
const errors_1 = require("../../../errors");
const database_1 = require("../../../database");
const cache_1 = require("../../../utils/cache");
const webhook_1 = require("../../../utils/webhook");
class SubjectService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getAll(page, limit) {
        return (0, cache_1.withCache)(`subject:all:page:${page}:limit:${limit}`, 600, async () => {
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.repository.findAll(skip, limit),
                this.repository.count()
            ]);
            return { data, total };
        });
    }
    async getById(id) {
        return (0, cache_1.withCache)(`subject:id:${id}`, 600, async () => {
            const item = await this.repository.findById(id);
            if (!item)
                throw new errors_1.NotFoundError('Mata Pelajaran tidak ditemukan');
            return item;
        });
    }
    async validateUnique(data, excludeId) {
        if (data.code) {
            const exists = await this.repository.checkUnique('code', data.code, excludeId);
            if (exists)
                throw new errors_1.BadRequestError('Subject code already exists');
        }
        if (data.name) {
            const exists = await this.repository.checkUnique('name', data.name, excludeId);
            if (exists)
                throw new errors_1.BadRequestError('Subject name already exists');
        }
    }
    async create(data) {
        await this.validateUnique(data);
        const created = await this.repository.create(data);
        await (0, cache_1.clearCachePattern)('subject:all:*');
        await (0, cache_1.setCache)(`subject:id:${created.id}`, created, 600);
        (0, webhook_1.sendWebhook)('subjects', created);
        return created;
    }
    async update(id, data) {
        await this.getById(id);
        await this.validateUnique(data, id);
        const updated = await this.repository.update(id, data);
        await (0, cache_1.clearCachePattern)('subject:all:*');
        await (0, cache_1.setCache)(`subject:id:${id}`, updated, 600);
        (0, webhook_1.sendWebhook)('subjects', updated);
        return updated;
    }
    async delete(id) {
        await this.getById(id);
        const deleted = await this.repository.softDelete(id);
        await (0, cache_1.clearCachePattern)('subject:all:*');
        await (0, cache_1.clearCachePattern)(`subject:id:${id}`);
        (0, webhook_1.sendWebhook)('subjects', deleted);
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
            const items = await tx.subject.findMany({ where: { id: { in: ids }, deletedAt: null } });
            if (items.length !== ids.length)
                throw new errors_1.NotFoundError('Beberapa data tidak ditemukan');
            await tx.subject.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
            const deletedItems = await tx.subject.findMany({ where: { id: { in: ids } } });
            await (0, cache_1.clearCachePattern)('subject:all:*');
            for (const item of deletedItems) {
                await (0, cache_1.clearCachePattern)(`subject:id:${item.id}`);
                (0, webhook_1.sendWebhook)('subjects', item);
            }
            return true;
        });
    }
}
exports.SubjectService = SubjectService;
exports.subjectService = new SubjectService(repository_1.subjectRepository);
