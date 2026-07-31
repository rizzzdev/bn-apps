import type { Request, Response, NextFunction } from 'express';
import { generatorService } from '../service';
import { sendResponse } from '@app/index.js';

export class GeneratorController {
  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await generatorService.generatePreview(req.body);
      sendResponse(res, 200, 'Berhasil menggenerasi preview jadwal pelajaran', result);
    } catch (err) {
      next(err);
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
