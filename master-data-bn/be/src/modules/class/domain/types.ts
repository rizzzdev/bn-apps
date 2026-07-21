import { Class } from '@/database/generated/client';

export type ClassType = Class;

export type BatchGetClassResponse = {
  found: ClassType[];
  notFound: string[];
};
