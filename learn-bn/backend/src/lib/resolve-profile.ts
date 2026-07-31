import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/database';

export async function resolveProfile(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) return next();

    const userId = req.user.id;

    const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (teacher) {
      req.profileId = teacher.id;
      return next();
    }

    const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (student) {
      req.profileId = student.id;
      return next();
    }

    const userAny = req.user as any;

    if (req.user.roles?.includes('teacher')) {
      const prefixTitle = userAny.prefixTitle || userAny.prefix_title || userAny.gelarDepan || userAny.titlePrefix || null;
      const suffixTitle = userAny.suffixTitle || userAny.suffix_title || userAny.gelarBelakang || userAny.titleSuffix || null;
      const newTeacher = await prisma.teacher.create({
        data: {
          userId,
          fullname: userAny.name || userAny.fullname || 'Guru',
          prefixTitle,
          suffixTitle,
          email: userAny.email || null,
        },
        select: { id: true },
      });
      req.profileId = newTeacher.id;
      return next();
    }

    if (req.user.roles?.includes('student')) {
      const newStudent = await prisma.student.create({
        data: {
          userId,
          fullname: userAny.name || userAny.fullname || 'Siswa',
          email: userAny.email || null,
        },
        select: { id: true },
      });
      req.profileId = newStudent.id;
      return next();
    }

    if (req.user.roles?.includes('super_admin')) {
      let adminTeacher = await prisma.teacher.findFirst({ select: { id: true } });
      if (!adminTeacher) {
        adminTeacher = await prisma.teacher.create({
          data: {
            userId,
            fullname: userAny.name || userAny.fullname || 'Super Admin',
            email: userAny.email || null,
          },
          select: { id: true },
        });
      }
      req.profileId = adminTeacher.id;
      return next();
    }

    next();
  } catch (err) {
    console.error('Error resolving profile:', err);
    next();
  }
}
