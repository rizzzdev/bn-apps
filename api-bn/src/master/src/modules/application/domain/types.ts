import { Application } from '#master/database/index.js';

export type ApplicationType = Application;

export type BatchGetApplicationResponse = {
  found: ApplicationType[];
  notFound: string[];
};
