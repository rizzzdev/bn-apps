import { Attachment } from '@master/database/index.js';

export type AttachmentType = Attachment;

export type BatchGetAttachmentsResponse = {
  found: AttachmentType[];
  notFound: string[];
};
