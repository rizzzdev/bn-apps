import { Class } from '@master/database/index.js';

export type ClassType = Class;

export type BatchGetClassResponse = {
  found: ClassType[];
  notFound: string[];
};
