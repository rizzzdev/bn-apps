import { SentriError } from 'sentri/core';
import { AssignmentRepository } from '../repository/assignment.repository';
import { CreateAssignmentDto, UpdateAssignmentDto, createAssignmentSchema, updateAssignmentSchema } from '../domain/schemas';

export class AssignmentService {
  constructor(private repository: AssignmentRepository) {}

  async create(data: CreateAssignmentDto, teacherId: string) {
    const parsed = createAssignmentSchema.parse(data);
    return this.repository.create(parsed, teacherId);
  }

  async getByClass(classId: string) {
    return this.repository.findAllByClass(classId);
  }

  async getById(id: string) {
    const assignment = await this.repository.findById(id);
    if (!assignment) {
      throw new SentriError('NOT_FOUND', 'Tugas tidak ditemukan', 404);
    }
    return assignment;
  }

  async update(id: string, data: UpdateAssignmentDto, teacherId: string) {
    const assignment = await this.getById(id);
    if (assignment.teacherId !== teacherId) {
      throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses untuk mengubah tugas ini', 403);
    }

    const parsed = updateAssignmentSchema.parse(data);
    return this.repository.update(id, parsed);
  }

  async delete(id: string, teacherId: string) {
    const assignment = await this.getById(id);
    if (assignment.teacherId !== teacherId) {
      throw new SentriError('FORBIDDEN', 'Anda tidak memiliki akses untuk menghapus tugas ini', 403);
    }

    return this.repository.delete(id);
  }

  async bulkDelete(ids: string[], teacherId: string) {
    return this.repository.bulkDelete(ids);
  }
}

import { assignmentRepository } from '../repository/assignment.repository';
export const assignmentService = new AssignmentService(assignmentRepository);
