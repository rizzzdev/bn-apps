import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/database';
import { SentriError } from 'sentri/core';

export const identifyRole = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return next();

  try {
    if (req.user.roles.includes('super_admin')) {
      return next();
    }

    const userId = req.user.id;
    
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (teacher) {
      req.profileId = teacher.id;
      return next();
    }
    
    const student = await prisma.student.findUnique({ where: { userId } });
    if (student) {
      req.profileId = student.id;
      return next();
    }
    
    throw new SentriError('FORBIDDEN', 'Akses ditolak: Anda tidak terdaftar sebagai Guru maupun Murid di sistem akademik.', 403);
  } catch (error) {
    next(error);
  }
};
