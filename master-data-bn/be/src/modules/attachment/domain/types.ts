import { Attachment } from '@/database/generated/client';

export type AttachmentType = Attachment;

export type BatchGetAttachmentsResponse = {
  found: AttachmentType[];
  notFound: string[];
};
