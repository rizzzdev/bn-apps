import type { Request, Response, NextFunction } from 'express';
import { prisma } from '#learn/database/index.js';
import { shadowSyncService } from '../services/shadow-sync.service.js';
import { getOrchestrator } from '#app/orchestrator.js';

/**
 * Middleware untuk meresolve profileId dari user yang terautentikasi.
 *
 * ProfileId adalah ID dari data guru/siswa yang terhubung dengan auth user melalui field `userId`.
 * Menggunakan Shadow Database dengan Lazy Sync & fail-safe fallback.
 */
export async function resolveProfile(req: Request, _res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next();
    }

    // Pemicu Lazy Sync (non-blocking jika error master)
    await shadowSyncService.lazySyncAll().catch(() => {});

    // 1. Cari teacher profile di Shadow Teacher
    let teacher = await prisma.shadowTeacher.findFirst({
      where: { userId, deletedAt: null },
    });

    if (teacher) {
      req.profileId = teacher.id;
      return next();
    }

    // 2. Cari student profile di Shadow Student
    let student = await prisma.shadowStudent.findFirst({
      where: { userId, deletedAt: null },
    });

    if (student) {
      req.profileId = student.id;
      return next();
    }

    // Fallback: Jika shadow DB belum memiliki data (misal baru dibuat sebelum sync), coba Orchestrator
    try {
      const orchestrator = getOrchestrator();
      const masterTeacher = await orchestrator.masterTeacher.findByUserId(userId);
      if (masterTeacher) {
        req.profileId = masterTeacher.id;
        return next();
      }

      const masterStudent = await orchestrator.masterStudent.findByUserId(userId);
      if (masterStudent) {
        req.profileId = masterStudent.id;
        return next();
      }
    } catch {
      // Abaikan error master fallback jika master down
    }

    next();
  } catch (error) {
    next(error);
  }
}

