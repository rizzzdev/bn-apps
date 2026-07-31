import { Subject } from '@master/database/index.js';

export type SubjectType = Subject;

export type BatchGetSubjectResponse = {
  found: SubjectType[];
  notFound: string[];
};
