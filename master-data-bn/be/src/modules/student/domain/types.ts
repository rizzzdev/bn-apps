import { Student } from '@/database/generated/client';

export type StudentType = Student;

export type BatchGetStudentResponse = {
  found: StudentType[];
  notFound: string[];
};
