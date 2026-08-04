import type { z } from 'zod';
import type { generateScheduleOptionsSchema, commitScheduleSchema } from './schemas';

export type GenerateScheduleOptionsDto = z.infer<typeof generateScheduleOptionsSchema>;
export type CommitScheduleDto = z.infer<typeof commitScheduleSchema>;

export interface GeneratedSlot {
  day: string;
  lessonHourId: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  /** Multiple classes for batch teaching */
  classIds?: string[];
  classNames?: string[];
  /** Multiple teachers for team teaching */
  teacherIds?: string[];
  teacherNames?: string[];
}

export interface UnassignedUnit {
  classIds: string[];
  classNames: string[];
  subjectId: string;
  subjectName: string;
  teacherIds: string[];
  teacherNames: string[];
  duration: number;
  reason: string;
}

export interface GeneratorPreviewResult {
  schedules: GeneratedSlot[];
  unassigned: UnassignedUnit[];
  qualityScore: number;
  stats: {
    totalUnits: number;
    assignedUnits: number;
    totalHours: number;
    assignedHours: number;
    attempts: number;
    durationMs: number;
  };
}

/**
 * Hasil POST /preview:
 * - mode 'queue'  → job dijalankan di background (BullMQ), frontend mem-poll
 *   GET /preview/:jobId.
 * - mode 'inline' → fallback: Redis tidak tersedia, hasil dikembalikan langsung
 *   (engine dijalankan di worker thread).
 */
export type GeneratePreviewResponse =
  | { mode: 'queue'; jobId: string }
  | { mode: 'inline'; result: GeneratorPreviewResult };

export type PreviewJobStatus =
  | { status: 'processing' }
  | { status: 'completed'; result: GeneratorPreviewResult }
  | { status: 'failed'; error: string }
  | { status: 'not_found' }
  | { status: 'unavailable' };

