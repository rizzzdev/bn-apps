import type { Request, Response, NextFunction } from 'express';
import { getOrchestrator } from '@app/orchestrator.js';

/**
 * Middleware untuk meresolve profileId dari user yang terautentikasi.
 *
 * ProfileId adalah ID dari data guru/siswa di database master yang terhubung
 * dengan auth user melalui field `userId`.
 *
 * Middleware ini dipasang setelah `sentriAuth.protect()` sehingga req.user sudah tersedia.
 * Menggunakan orchestrator pattern untuk decoupling antar modul.
 */
export async function resolveProfile(req: Request, _res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next();
    }

    const orchestrator = getOrchestrator();

    // Cari teacher profile berdasarkan userId
    const teacher = await orchestrator.masterTeacher.findByUserId(userId);

    if (teacher) {
      req.profileId = teacher.id;
      return next();
    }

    // Cari student profile berdasarkan userId
    const student = await orchestrator.masterStudent.findByUserId(userId);

    if (student) {
      req.profileId = student.id;
      return next();
    }

    // Tidak ditemukan, lanjutkan (endpoint akan menangani 403 jika perlu profileId)
    next();
  } catch (error) {
    next(error);
  }
}
