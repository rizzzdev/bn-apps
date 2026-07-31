import { classRepository } from '../repository';
import { NotFoundError } from '../../../errors';
export class ClassService {
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
    async getByTeacher(teacherId) {
        return this.repository.findClassesByTeacher(teacherId);
    }
    async getByStudent(studentId) {
        return this.repository.findClassesByStudent(studentId);
    }
    async getStudentsByClass(classId) {
        return this.repository.findStudentsByClass(classId);
    }
    async upsertFromWebhook(items) {
        let count = 0;
        for (const item of items) {
            // Remove id from the payload so we can upsert safely, mapping dates if needed
            const { id } = item;
            const payload = {
                name: item.name,
                majorId: item.majorId,
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
export const classService = new ClassService(classRepository);
