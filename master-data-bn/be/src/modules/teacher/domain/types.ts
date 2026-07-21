import { Teacher } from '@/database/generated/client';

export type TeacherType = Teacher;

export type BatchGetTeacherResponse = {
  found: TeacherType[];
  notFound: string[];
};
