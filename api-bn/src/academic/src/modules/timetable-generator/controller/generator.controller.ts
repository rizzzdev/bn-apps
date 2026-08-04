import type { Request, Response, NextFunction } from 'express';
import { generatorService } from '../service';
import { sendResponse } from '#app';

export class GeneratorController {
  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await generatorService.generatePreview(req.body);
      const message =
        result.mode === 'queue'
          ? 'Preview jadwal sedang diproses di background'
          : 'Berhasil menggenerasi preview jadwal pelajaran';
      sendResponse(res, 200, message, result);
    } catch (err) {
      next(err);
    }
  }

  async previewStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await generatorService.getPreviewResult(String(req.params.jobId));
      // Selalu 200 dengan status di body — polling frontend membaca status,
      // bukan kode HTTP (parseResponse melempar error untuk non-2xx).
      sendResponse(res, 200, 'Status job preview.', result);
    } catch {
      // Redis mati di tengah polling → jangan crash, beri status yang jelas
      // agar frontend bisa memberi tahu pengguna untuk mencoba lagi.
      sendResponse(res, 200, 'Status job preview.', { status: 'unavailable' });
    }
  }

  async commit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await generatorService.commitSchedule(req.body);
      sendResponse(res, 200, 'Berhasil menyimpan hasil jadwal pelajaran ke database', result);
    } catch (err) {
      next(err);
    }
  }
}

export const generatorController = new GeneratorController();
