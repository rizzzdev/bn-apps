import { SentriError } from 'sentri/core';
import { AttachmentRepository } from '../repository/attachment.repository';
import { getStorage } from '@app/index.js';
import path from 'path';

export class AttachmentService {
  constructor(private repository: AttachmentRepository) {}

  async upload(file: Express.Multer.File) {
    const ext = path.extname(file.originalname).toLowerCase();
    const sizeMB = parseFloat((file.size / (1024 * 1024)).toFixed(4));
    const filename = file.filename || path.basename(file.path);

    const data = {
      filename: file.originalname,
      format: ext.replace('.', ''),
      size: sizeMB,
      url: filename, // URL is the filename in local storage
    };

    const created = await this.repository.create(data);
    return created;
  }

  async uploadBulk(files: Express.Multer.File[]) {
    const results = [];
    for (const file of files) {
      const result = await this.upload(file);
      results.push(result);
    }
    return results;
  }

  async delete(id: string) {
    const attachment = await this.repository.findById(id);
    if (!attachment) throw new SentriError('NOT_FOUND', 'Attachment not found', 404);

    await this.repository.delete(id);
    const storage = getStorage();
    await storage.delete(attachment.url);

    return true;
  }

  async bulkDelete(ids: string[]) {
    const storage = getStorage();

    const attachments = await this.repository.findByIds(ids);
    const existingIds: string[] = [];

    for (const attachment of attachments) {
      existingIds.push(attachment.id);
      try {
        await storage.delete(attachment.url);
      } catch (e) {
        console.error(`Failed to delete file from storage: ${attachment.url}`);
      }
    }

    if (existingIds.length > 0) {
      await this.repository.bulkDelete(existingIds);
    }

    return true;
  }

  async getBatchByIds(ids: string[]) {
    const found = await this.repository.findByIds(ids);
    const foundIds = new Set(found.map((a) => a.id));
    const notFound = ids.filter((id) => !foundIds.has(id));
    return { found, notFound };
  }

  async getFileByUrl(url: string) {
    const attachment = await this.repository.findByUrl(url);
    if (!attachment) throw new SentriError('NOT_FOUND', 'File not found in database', 404);
    return attachment;
  }
}

import { attachmentRepository } from '../repository/attachment.repository';
export const attachmentService = new AttachmentService(attachmentRepository);
