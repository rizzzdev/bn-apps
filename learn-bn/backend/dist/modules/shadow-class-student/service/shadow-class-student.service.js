import { classStudentRepository } from '../repository';
import { NotFoundError } from '../../../errors';
export class ClassStudentService {
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
            const { id, ...rest } = item;
            const payload = { ...rest };
            delete payload.class;
            delete payload.student;
            delete payload.academicYear;
            if (payload.createdAt)
                payload.createdAt = new Date(payload.createdAt);
            if (payload.updatedAt)
                payload.updatedAt = new Date(payload.updatedAt);
            if (payload.deletedAt)
                payload.deletedAt = new Date(payload.deletedAt);
            payload.lastSyncAt = new Date();
            await this.repository.upsert(id, payload);
            count++;
        }
        return { upserted: count };
    }
}
export const classStudentService = new ClassStudentService(classStudentRepository);
