import { teacherUnavailabilityRepository } from '../repository';
import type { TeacherUnavailabilityRepository } from '../repository';
import type { CreateTeacherUnavailabilityDto, BulkSetTeacherUnavailabilityDto } from '../domain';

export class TeacherUnavailabilityService {
  constructor(private repository: TeacherUnavailabilityRepository) {}

  async getAll(teacherId?: string) {
    return this.repository.findAll(teacherId);
  }

  async create(data: CreateTeacherUnavailabilityDto) {
    return this.repository.create(data);
  }

  async bulkSet(data: BulkSetTeacherUnavailabilityDto) {
    return this.repository.bulkSet(data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }

  async bulkDelete(ids: string[]) {
    return this.repository.bulkSoftDelete(ids);
  }
}

export const teacherUnavailabilityService = new TeacherUnavailabilityService(teacherUnavailabilityRepository);
