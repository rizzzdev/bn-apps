import { AttachmentRepository, attachmentRepository } from '#master/modules/attachment/repository';
import { NotFoundError } from '#app';
import { getStorage } from '#app';
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
      url: filename,
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
    if (!attachment) throw new NotFoundError('Attachment not found');

    await this.repository.softDelete(id);
    const storage = getStorage();
    await storage.delete(attachment.url);

    return true;
  }

  async bulkDelete(ids: string[]) {
    const storage = getStorage();

    const attachments = await Promise.all(
      ids.map((id) => this.repository.findById(id))
    );

    const existingIds: string[] = [];

    for (const attachment of attachments) {
      if (attachment) {
        existingIds.push(attachment.id);
        await storage.delete(attachment.url);
      }
    }

    if (existingIds.length > 0) {
      await this.repository.bulkSoftDelete(existingIds);
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
    if (!attachment) throw new NotFoundError('File not found');
    return attachment;
  }
}

export const attachmentService = new AttachmentService(attachmentRepository);
