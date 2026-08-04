import { AcademicYear } from '#master/database/index.js';

export type AcademicYearType = AcademicYear;

export type BatchGetAcademicYearResponse = {
  found: AcademicYearType[];
  notFound: string[];
};
