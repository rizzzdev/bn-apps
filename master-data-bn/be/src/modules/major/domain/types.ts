import { Major } from '@/database/generated/client';

export type MajorType = Major;

export type BatchGetMajorResponse = {
  found: MajorType[];
  notFound: string[];
};
