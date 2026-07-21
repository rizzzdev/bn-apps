import { Subject } from '@/database/generated/client';

export type SubjectType = Subject;

export type BatchGetSubjectResponse = {
  found: SubjectType[];
  notFound: string[];
};
