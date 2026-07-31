import { teacherRepository } from '../repository';
import { NotFoundError } from '../../../errors';
export class TeacherService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getAll(page, limit) {
        const skip = (page - 1) * limit;
        const data = await this.repository.findAll(skip, limit);
        return { data, total: data.length };
    }
    async getById(id) {
        const data = await this.repository.findById(id);
        if (!data)
            throw new NotFoundError('Data tidak ditemukan');
        return data;
    }
    async upsertFromWebhook(items) {
        let count = 0;
        for (const item of items) {
            // Remove id from the payload so we can upsert safely, mapping dates if needed
            const { id } = item;
            let pictureUrl = null;
            if (item.pictureUrl) {
                pictureUrl = item.pictureUrl;
            }
            else if (item.picture?.url) {
                pictureUrl = item.picture.url;
            }
            const itemAny = item;
            const prefixTitle = item.prefixTitle ?? itemAny.prefix_title ?? itemAny.gelarDepan ?? itemAny.titlePrefix ?? null;
            const suffixTitle = item.suffixTitle ?? itemAny.suffix_title ?? itemAny.gelarBelakang ?? itemAny.titleSuffix ?? null;
            const payload = {
                fullname: item.fullname,
                prefixTitle: prefixTitle,
                suffixTitle: suffixTitle,
                gender: item.gender,
                nip: item.nip,
                email: item.email,
                userId: item.userId,
                pictureUrl: pictureUrl,
                status: item.status,
            };
            if (item.createdAt)
                payload.createdAt = new Date(item.createdAt);
            if (item.updatedAt)
                payload.updatedAt = new Date(item.updatedAt);
            if (item.deletedAt)
                payload.deletedAt = new Date(item.deletedAt);
            payload.lastSyncAt = new Date();
            await this.repository.upsert(id, payload);
            count++;
        }
        return { upserted: count };
    }
}
export const teacherService = new TeacherService(teacherRepository);
