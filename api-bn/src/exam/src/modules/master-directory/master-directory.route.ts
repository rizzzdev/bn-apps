import { Router } from 'express';
import { prisma } from '#exam/database/index.js';
import { sendResponse } from '#app';
import { asyncHandler } from '#exam/utils/asyncHandler.js';
import { shadowSyncService } from '#exam/services/shadow-sync.service.js';

const masterDirectoryRouter = Router();

// Daftar mata pelajaran (sync dari master Subject)
masterDirectoryRouter.get(
  '/subjects',
  asyncHandler(async (_req, res) => {
    await shadowSyncService.lazySyncAll().catch(() => {});
    const subjects = await prisma.shadowSubject.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    sendResponse(
      res,
      200,
      'OK',
      subjects.map((subject) => ({ id: s.id, code: s.code, name: s.name })),
    );
  }),
);

// Guru yang mengajar sebuah mapel (sync dari academic SubjectTeacher).
// teacherId yang dikembalikan adalah auth userId (via ShadowTeacher) agar cocok
// dengan direktori user frontend.
masterDirectoryRouter.get(
  '/teacher-subjects',
  asyncHandler(async (req, res) => {
    await shadowSyncService.lazySyncAll().catch(() => {});
    const subjectId = req.query.subjectId as string | undefined;
    const rows = await prisma.shadowTeacherSubject.findMany({
      where: { deletedAt: null, ...(subjectId ? { subjectId } : {}) },
    });

    const teacherIds = [...new Set(rows.map((record) => record.teacherId))];
    const teachers =
      teacherIds.length > 0
        ? await prisma.shadowTeacher.findMany({ where: { id: { in: teacherIds }, deletedAt: null } })
        : [];
    const teacherMap = new Map(teachers.map((teacher) => [t.id, t]));

    sendResponse(
      res,
      200,
      'OK',
      rows.map((r) => {
        const teacherName = teacherMap.get(row.teacherId);
        return {
          id: r.id,
          subjectId: r.subjectId,
          teacherId: t?.userId ?? r.teacherId,
          teacherName: t?.fullname ?? null,
          teacherEmail: t?.email ?? null,
        };
      }),
    );
  }),
);

// Jadwal mengajar: guru mengajar mapel di kelas tertentu (sync dari academic
// ClassSubjectRequirement). Dipakai sebagai default "guru soal" per kelas.
masterDirectoryRouter.get(
  '/teaching-schedules',
  asyncHandler(async (req, res) => {
    await shadowSyncService.lazySyncAll().catch(() => {});
    const subjectId = req.query.subjectId as string | undefined;
    const rows = await prisma.shadowTeachingSchedule.findMany({
      where: { deletedAt: null, ...(subjectId ? { subjectId } : {}) },
    });

    const classIds = [...new Set(rows.map((record) => record.classId))];
    const classes =
      classIds.length > 0
        ? await prisma.shadowClass.findMany({ where: { id: { in: classIds }, deletedAt: null } })
        : [];
    const classMap = new Map(classes.map((classItem) => [c.id, c]));

    const teacherIds = [...new Set(rows.map((record) => record.teacherId))];
    const teachers =
      teacherIds.length > 0
        ? await prisma.shadowTeacher.findMany({ where: { id: { in: teacherIds }, deletedAt: null } })
        : [];
    const teacherMap = new Map(teachers.map((teacher) => [t.id, t]));

    sendResponse(
      res,
      200,
      'OK',
      rows.map((r) => ({
        id: r.id,
        classId: r.classId,
        className: classMap.get(r.classId)?.name ?? null,
        subjectId: r.subjectId,
        teacherId: teacherMap.get(r.teacherId)?.userId ?? r.teacherId,
        teacherName: teacherMap.get(r.teacherId)?.fullname ?? null,
      })),
    );
  }),
);

export default masterDirectoryRouter;
