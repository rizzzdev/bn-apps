import fs from 'fs';
import path from 'path';

// Kita hanya implementasikan LocalStorage untuk project ini, tapi dengan interface yang sama agar seragam
export interface IStorage {
  upload(filename: string, file: Express.Multer.File): Promise<string>;
  delete(filename: string): Promise<void>;
  getFile(filename: string): Promise<{ buffer: Buffer; contentType: string }>;
}

class LocalStorage implements IStorage {
  private publicDir: string;

  constructor() {
    this.publicDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(this.publicDir)) {
      fs.mkdirSync(this.publicDir, { recursive: true });
    }
  }

  async upload(filename: string, file: Express.Multer.File): Promise<string> {
    const filepath = path.join(this.publicDir, filename);
    if (file.buffer) {
      fs.writeFileSync(filepath, file.buffer);
    } else if (file.path) {
      fs.copyFileSync(file.path, filepath);
    }
    return filename;
  }

  async delete(filename: string): Promise<void> {
    const filepath = path.join(this.publicDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  async getFile(filename: string): Promise<{ buffer: Buffer; contentType: string }> {
    const filepath = path.join(this.publicDir, filename);
    if (!fs.existsSync(filepath)) {
      throw new Error('File not found');
    }
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
    };
    return {
      buffer: fs.readFileSync(filepath),
      contentType: contentTypeMap[ext] || 'application/octet-stream',
    };
  }
}

let storageInstance: IStorage;

export const getStorage = (): IStorage => {
  if (!storageInstance) {
    storageInstance = new LocalStorage();
  }
  return storageInstance;
};
