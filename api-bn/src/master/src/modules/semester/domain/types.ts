import { Semester } from '@master/database/index.js';

export type SemesterType = Semester;

export type BatchGetSemesterResponse = {
  found: SemesterType[];
  notFound: string[];
};
