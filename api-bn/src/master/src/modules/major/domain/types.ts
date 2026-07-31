import { Major } from '@master/database/index.js';

export type MajorType = Major;

export type BatchGetMajorResponse = {
  found: MajorType[];
  notFound: string[];
};
