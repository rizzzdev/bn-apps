import { Teacher } from '#master/database/index.js';

export type TeacherType = Teacher;

export type BatchGetTeacherResponse = {
  found: TeacherType[];
  notFound: string[];
};
