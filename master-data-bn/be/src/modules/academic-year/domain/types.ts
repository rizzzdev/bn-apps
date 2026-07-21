import { AcademicYear } from '@/database/generated/client';

export type AcademicYearType = AcademicYear;

export type BatchGetAcademicYearResponse = {
  found: AcademicYearType[];
  notFound: string[];
};
