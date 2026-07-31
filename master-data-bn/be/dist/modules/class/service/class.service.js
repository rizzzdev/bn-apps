"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classService = exports.ClassService = void 0;
const repository_1 = require("../../../modules/class/repository");
const errors_1 = require("../../../errors");
const database_1 = require("../../../database");
const cache_1 = require("../../../utils/cache");
const webhook_1 = require("../../../utils/webhook");
class ClassService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getAll(page, limit, includeMajor = false, includeCurrentStudent = false) {
        return (0, cache_1.withCache)(`class:all:page:${page}:limit:${limit}:includeMajor:${includeMajor}:includeCurrentStudent:${includeCurrentStudent}`, 600, async () => {
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.repository.findAll(skip, limit, includeMajor, includeCurrentStudent),
                this.repository.count()
            ]);
            return { data, total };
        });
    }
    async getById(id, includeMajor = false, includeCurrentStudent = false) {
        return (0, cache_1.withCache)(`class:id:${id}:includeMajor:${includeMajor}:includeCurrentStudent:${includeCurrentStudent}`, 600, async () => {
            const item = await this.repository.findById(id, includeMajor, includeCurrentStudent);
            if (!item)
                throw new errors_1.NotFoundError('Kelas tidak ditemukan');
            return item;
        });
    }
    async validateUnique(data, excludeId) {
        if (data.name) {
            const exists = await this.repository.checkUnique('name', data.name, excludeId);
            if (exists)
                throw new errors_1.BadRequestError('Class name already exists');
        }
        if (data.majorId) {
            const major = await database_1.prisma.major.findFirst({ where: { id: data.majorId, deletedAt: null } });
            if (!major)
                throw new errors_1.BadRequestError('Jurusan tidak ditemukan atau telah dihapus');
        }
    }
    async create(data) {
        await this.validateUnique(data);
        const created = await this.repository.create(data);
        await (0, cache_1.clearCachePattern)('class:all:*');
        await (0, cache_1.setCache)(`class:id:${created.id}`, created, 600);
        (0, webhook_1.sendWebhook)('classes', created);
        return created;
    }
    async update(id, data) {
        await this.getById(id);
        await this.validateUnique(data, id);
        const updated = await this.repository.update(id, data);
        await (0, cache_1.clearCachePattern)('class:all:*');
        await (0, cache_1.setCache)(`class:id:${id}`, updated, 600);
        (0, webhook_1.sendWebhook)('classes', updated);
        return updated;
    }
    async delete(id) {
        await this.getById(id);
        const deleted = await this.repository.softDelete(id);
        await (0, cache_1.clearCachePattern)('class:all:*');
        await (0, cache_1.clearCachePattern)(`class:id:${id}`);
        (0, webhook_1.sendWebhook)('classes', deleted);
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
            const items = await tx.class.findMany({ where: { id: { in: ids }, deletedAt: null } });
            if (items.length !== ids.length)
                throw new errors_1.NotFoundError('Beberapa data tidak ditemukan');
            await tx.class.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
            const deletedItems = await tx.class.findMany({ where: { id: { in: ids } } });
            await (0, cache_1.clearCachePattern)('class:all:*');
            for (const item of deletedItems) {
                await (0, cache_1.clearCachePattern)(`class:id:${item.id}`);
                (0, webhook_1.sendWebhook)('classes', item);
            }
            return true;
        });
    }
}
exports.ClassService = ClassService;
exports.classService = new ClassService(repository_1.classRepository);
