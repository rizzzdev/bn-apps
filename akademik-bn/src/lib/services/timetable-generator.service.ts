import { getList, createItem, deleteItem, bulkDelete } from './base';
import type {
  ClassSubjectRequirement,
  TeacherUnavailability,
  GeneratorPreviewResult,
  GeneratedSlot,
} from '$lib/types';
import { apiClient } from '$lib/utils/api';
import type { ApiResponse } from '$lib/types';

export const classSubjectRequirementApi = {
  list: (params?: { classId?: string; subjectId?: string; teacherId?: string }) =>
    getList<ClassSubjectRequirement>('/academic/class-subject-requirements', params),
  upsert: (data: ClassSubjectRequirement) =>
    createItem<ClassSubjectRequirement, ClassSubjectRequirement>('/academic/class-subject-requirements', data),
  bulkUpsert: (requirements: ClassSubjectRequirement[]) =>
    createItem<{ requirements: ClassSubjectRequirement[] }, ClassSubjectRequirement[]>(
      '/academic/class-subject-requirements/bulk',
      { requirements },
    ),
  delete: (id: string) => deleteItem('/academic/class-subject-requirements', id),
  bulkDelete: (ids: string[]) => bulkDelete('/academic/class-subject-requirements', ids),
  clearAll: async (): Promise<ApiResponse<{ count: number }>> => {
    const res = await apiClient('/academic/class-subject-requirements/clear', { method: 'DELETE' });
    return res.json();
  },
};

export const teacherUnavailabilityApi = {
  list: (teacherId?: string) =>
    getList<TeacherUnavailability>('/academic/teacher-unavailabilities', teacherId ? { teacherId } : undefined),
  bulkSet: (teacherId: string, unavailabilities: { day: string; lessonHourId: string; reason?: string }[]) =>
    createItem<{ teacherId: string; unavailabilities: { day: string; lessonHourId: string; reason?: string }[] }, TeacherUnavailability[]>(
      '/academic/teacher-unavailabilities/bulk',
      { teacherId, unavailabilities },
    ),
  delete: (id: string) => deleteItem('/academic/teacher-unavailabilities', id),
  bulkDelete: (ids: string[]) => bulkDelete('/academic/teacher-unavailabilities', ids),
};

export interface GenerateOptions {
  workingDays: string[];
  classIds?: string[];
  timeoutMs?: number;
  maxAttempts?: number;
  enableBatchTeaching?: boolean;
}

export interface CommitPayload {
  clearExisting: boolean;
  schedules: GeneratedSlot[];
}

export const timetableGeneratorApi = {
  preview: (options: GenerateOptions) =>
    createItem<GenerateOptions, GeneratorPreviewResult>('/academic/lesson-schedules/generator/preview', options),
  commit: (payload: CommitPayload) =>
    createItem<CommitPayload, { count: number }>('/academic/lesson-schedules/generator/commit', payload),
};
