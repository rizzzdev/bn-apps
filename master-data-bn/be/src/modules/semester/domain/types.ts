import { Semester } from '@/database/generated/client';

export type SemesterType = Semester;

export type BatchGetSemesterResponse = {
  found: SemesterType[];
  notFound: string[];
};
