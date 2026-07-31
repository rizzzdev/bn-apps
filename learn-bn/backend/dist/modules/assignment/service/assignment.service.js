import { SentriError } from 'sentri/core';
import { createAssignmentSchema, updateAssignmentSchema } from '../domain/schemas';
export class AssignmentService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(data, teacherId) {
        if (!teacherId) {
            throw new SentriError('FORBIDDEN', 'Profil Guru tidak ditemukan untuk akun Anda', 403);
        }
        const parsed = createAssignmentSchema.parse(data);
        return this.repository.create(parsed, teacherId);
    }
    async getAll(teacherId) {
        return this.repository.findAllByTeacher(teacherId);
    }
    async getByClass(classId, isStudent = false, studentId) {
        return this.repository.findAllByClass(classId, isStudent, studentId);
    }
    async getById(id) {
        const assignment = await this.repository.findById(id);
        if (!assignment) {
            throw new SentriError('NOT_FOUND', 'Tugas tidak ditemukan', 404);
        }
        return assignment;
    }
    async update(id, data, teacherId) {
        const assignment = await this.getById(id);
        if (assignment.teacherId !== teacherId) {
            throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses untuk mengubah tugas ini', 403);
        }
        const parsed = updateAssignmentSchema.parse(data);
        return this.repository.update(id, parsed);
    }
    async delete(id, teacherId) {
        const assignment = await this.getById(id);
        if (assignment.teacherId !== teacherId) {
            throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses untuk menghapus tugas ini', 403);
        }
        return this.repository.delete(id);
    }
    async bulkDelete(ids, teacherId) {
        return this.repository.bulkDelete(ids);
    }
}
import { assignmentRepository } from '../repository/assignment.repository';
export const assignmentService = new AssignmentService(assignmentRepository);
