import { Student } from '@master/database/index.js';

export type StudentType = Student;

export type BatchGetStudentResponse = {
  found: StudentType[];
  notFound: string[];
};
