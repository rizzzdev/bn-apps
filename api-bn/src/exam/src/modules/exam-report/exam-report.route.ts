import { Router, type Request } from 'express';
import { prisma } from '#exam/database/index.js';
import { sendResponse } from '#app';
import { ForbiddenError } from '#app/errors/index.js';
import { getOrchestrator } from '#app/orchestrator.js';
import { asyncHandler } from '#exam/utils/asyncHandler.js';

const router = Router();
const ALIVE = null;
const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 10000;

type ReportRow = {
  examId: string;
  examName: string;
  subjectId: string | null;
  subjectName: string | null;
  examRoomId: string;
  roomName: string;
  classId: string | null;
  className: string | null;
  participantId: string;
  userId: string;
  fullname: string;
  email: string | null;
  teacherId: string | null;
  teacherName: string | null;
  score: number | null;
  passed: boolean | null;
  submitted: boolean;
  status: 'SUBMITTED' | 'PENDING_GRADE' | 'NOT_SUBMITTED';
  passingGrade: number;
  startTime: string;
  endTime: string;
};

const stringParam = (request: Request, key: string): string | undefined => {
  const value = request.query[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const numberParam = (request: Request, key: string, fallback: number, max: number): number => {
  const value = Number(stringParam(request, key));
  return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), max) : fallback;
};

const dateParam = (request: Request, key: string): Date | undefined => {
  const value = stringParam(request, key);
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const isSuperAdmin = (request: Request): boolean =>
  request.user?.roles?.includes('super_admin') ?? false;

const getTeacherContext = async (request: Request) => {
  const userId = request.user?.id ?? '';
  const teacher = await prisma.shadowTeacher.findFirst({
    where: { userId, deletedAt: ALIVE },
    select: { id: true },
  });
  const taughtSubjects = teacher
    ? await prisma.shadowTeacherSubject.findMany({
        where: { teacherId: teacher.id, deletedAt: ALIVE },
        select: { subjectId: true },
      })
    : [];

  return {
    userId,
    subjectIds: taughtSubjects.map((row) => row.subjectId),
  };
};

const getRows = async (request: Request): Promise<ReportRow[]> => {
  const roles = request.user?.roles ?? [];
  if (!roles.includes('super_admin') && !roles.includes('teacher')) {
    throw new ForbiddenError('Hanya admin dan guru yang dapat melihat laporan ujian.');
  }

  const subjectId = stringParam(request, 'subjectId');
  const classId = stringParam(request, 'classId');
  const examId = stringParam(request, 'examId');
  const examRoomId = stringParam(request, 'examRoomId');
  const teacherId = stringParam(request, 'teacherId');
  const from = dateParam(request, 'from');
  const to = dateParam(request, 'to');
  const admin = isSuperAdmin(request);
  const teacherContext = admin ? null : await getTeacherContext(request);

  const examWhere = {
    deletedAt: ALIVE,
    ...(subjectId && { subjectId }),
    ...(examId && { id: examId }),
    ...((from || to) && {
      startTime: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
    }),
    ...(teacherContext && {
      OR: [
        { subjectId: null },
        { examTeachers: { some: { teacherId: teacherContext.userId, deletedAt: ALIVE } } },
        {
          AND: [
            { subjectId: { not: null, in: teacherContext.subjectIds } },
            { examTeachers: { none: { deletedAt: ALIVE } } },
          ],
        },
      ],
    }),
  };

  const participants = await prisma.examParticipant.findMany({
    where: {
      deletedAt: ALIVE,
      ...(classId && { classId }),
      ...(examRoomId && { examRoomId }),
      ...(teacherId && { teacherId }),
      ...(teacherContext && {
        OR: [
          { teacherId: teacherContext.userId },
          {
            AND: [
              { teacherId: null },
              { examRoom: { exam: { examTeachers: { none: { deletedAt: ALIVE } } } } },
            ],
          },
        ],
      }),
      examRoom: {
        deletedAt: ALIVE,
        exam: examWhere,
      },
    },
    select: {
      id: true,
      userId: true,
      classId: true,
      teacherId: true,
      status: true,
      examRoomId: true,
      examRoom: {
        select: {
          examId: true,
          room: { select: { name: true } },
          exam: {
            select: {
              name: true,
              subjectId: true,
              passingGrade: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });

  if (participants.length === 0) return [];

  const roomIds = [...new Set(participants.map((row) => row.examRoomId))];
  const userIds = [...new Set(participants.map((row) => row.userId))];
  const classIds = [...new Set(participants.map((row) => row.classId).filter((id): id is string => !!id))];
  const subjectIds = [
    ...new Set(participants.map((row) => row.examRoom.exam.subjectId).filter((id): id is string => !!id)),
  ];
  const teacherIds = [
    ...new Set(participants.map((row) => row.teacherId).filter((id): id is string => !!id)),
  ];

  const [scores, students, subjects, classes, teachers] = await Promise.all([
    prisma.examScore.findMany({
      where: { examRoomId: { in: roomIds }, userId: { in: userIds } },
      select: { examRoomId: true, userId: true, score: true, passed: true },
    }),
    prisma.shadowStudent.findMany({
      where: { userId: { in: userIds }, deletedAt: ALIVE },
      select: { userId: true, fullname: true },
    }),
    subjectIds.length > 0
      ? prisma.shadowSubject.findMany({ where: { id: { in: subjectIds }, deletedAt: ALIVE }, select: { id: true, name: true } })
      : [],
    classIds.length > 0
      ? prisma.shadowClass.findMany({ where: { id: { in: classIds }, deletedAt: ALIVE }, select: { id: true, name: true } })
      : [],
    teacherIds.length > 0
      ? prisma.shadowTeacher.findMany({ where: { userId: { in: teacherIds }, deletedAt: ALIVE }, select: { userId: true, fullname: true } })
      : [],
  ]);

  const emailMap = new Map<string, string | null>();
  try {
    const users = await getOrchestrator().authData.findUsersByIds(userIds);
    for (const user of users) {
      emailMap.set(user.id, user.identifiers.find((identifier) => identifier.type === 'email')?.value ?? null);
    }
  } catch {
    // Report data must remain available when the auth data source is unavailable.
  }

  const scoreMap = new Map(scores.map((score) => [`${score.examRoomId}:${score.userId}`, score]));
  const studentMap = new Map(students.map((student) => [student.userId, student.fullname]));
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const classMap = new Map(classes.map((item) => [item.id, item.name]));
  const teacherMap = new Map(teachers.map((teacher) => [teacher.userId, teacher.fullname]));

  return participants.map((participant) => {
    const scoreRow = scoreMap.get(`${participant.examRoomId}:${participant.userId}`);
    const submitted = participant.status === 'SUBMITTED' || scoreRow !== undefined;
    const score = scoreRow?.score ?? null;
    const status = !submitted ? 'NOT_SUBMITTED' : score === null ? 'PENDING_GRADE' : 'SUBMITTED';

    return {
      examId: participant.examRoom.examId,
      examName: participant.examRoom.exam.name,
      subjectId: participant.examRoom.exam.subjectId,
      subjectName: participant.examRoom.exam.subjectId
        ? subjectMap.get(participant.examRoom.exam.subjectId) ?? null
        : null,
      examRoomId: participant.examRoomId,
      roomName: participant.examRoom.room.name,
      classId: participant.classId,
      className: participant.classId ? classMap.get(participant.classId) ?? null : null,
      participantId: participant.id,
      userId: participant.userId,
      fullname: studentMap.get(participant.userId) ?? participant.userId,
      email: emailMap.get(participant.userId) ?? null,
      teacherId: participant.teacherId,
      teacherName: participant.teacherId ? teacherMap.get(participant.teacherId) ?? null : null,
      score,
      passed: score === null ? null : (scoreRow?.passed ?? score >= participant.examRoom.exam.passingGrade),
      submitted,
      status,
      passingGrade: participant.examRoom.exam.passingGrade,
      startTime: participant.examRoom.exam.startTime.toISOString(),
      endTime: participant.examRoom.exam.endTime.toISOString(),
    };
  });
};

router.get(
  '/results',
  asyncHandler(async (request, response) => {
    const rows = await getRows(request);
    const page = numberParam(request, 'page', 1, 1000000);
    const limit = numberParam(request, 'limit', DEFAULT_LIMIT, MAX_LIMIT);
    const total = rows.length;
    const items = rows.slice((page - 1) * limit, page * limit);
    sendResponse(response, 200, 'Get exam result report successfully.', {
      items,
      pagination: { page, limit, total },
    });
  }),
);

router.get(
  '/statistics',
  asyncHandler(async (request, response) => {
    const rows = await getRows(request);
    const groups = new Map<string, ReportRow[]>();
    for (const row of rows) {
      const key = `${row.examId}:${row.classId ?? 'unknown'}`;
      const current = groups.get(key) ?? [];
      current.push(row);
      groups.set(key, current);
    }

    const toStats = (groupRows: ReportRow[]) => {
      const first = groupRows[0];
      const scored = groupRows.filter((row) => row.score !== null).map((row) => row.score as number);
      const submitted = groupRows.filter((row) => row.submitted).length;
      const pendingGrade = groupRows.filter((row) => row.status === 'PENDING_GRADE').length;
      const notSubmitted = groupRows.filter((row) => row.status === 'NOT_SUBMITTED').length;
      const passed = scored.filter((score, index) => {
        const row = groupRows.filter((item) => item.score !== null)[index];
        return row.passed ?? score >= first.passingGrade;
      }).length;
      const failed = scored.length - passed;
      const average = scored.length > 0 ? scored.reduce((sum, score) => sum + score, 0) / scored.length : null;
      const buckets = Array.from({ length: 10 }, (_, index) => ({
        label: `${index * 10}–${index === 9 ? 100 : index * 10 + 9}`,
        count: 0,
      }));
      for (const score of scored) buckets[Math.min(Math.max(Math.floor(score / 10), 0), 9)].count += 1;

      return {
        examId: first.examId,
        examName: first.examName,
        subjectId: first.subjectId,
        subjectName: first.subjectName,
        classId: first.classId,
        className: first.className,
        totalParticipants: groupRows.length,
        submitted,
        scored: scored.length,
        pendingGrade,
        notSubmitted,
        passed,
        failed,
        failedTotal: failed + notSubmitted,
        average: average === null ? null : Math.round(average * 10) / 10,
        avg: average === null ? null : Math.round(average * 10) / 10,
        minimum: scored.length > 0 ? Math.min(...scored) : null,
        min: scored.length > 0 ? Math.min(...scored) : null,
        maximum: scored.length > 0 ? Math.max(...scored) : null,
        max: scored.length > 0 ? Math.max(...scored) : null,
        passRate: groupRows.length > 0 ? Math.round((passed / groupRows.length) * 100) : null,
        passingGrade: first.passingGrade,
        startTime: first.startTime,
        endTime: first.endTime,
        buckets,
      };
    };

    const resultGroups = [...groups.values()]
      .map(toStats)
      .sort((a, b) => a.startTime < b.startTime ? 1 : -1);
    const scored = rows.filter((row) => row.score !== null).map((row) => row.score as number);
    const submitted = rows.filter((row) => row.submitted).length;
    const pendingGrade = rows.filter((row) => row.status === 'PENDING_GRADE').length;
    const notSubmitted = rows.filter((row) => row.status === 'NOT_SUBMITTED').length;
    const passed = rows.filter((row) => row.score !== null && (row.passed ?? row.score >= row.passingGrade)).length;
    const failed = rows.filter((row) => row.score !== null && !(row.passed ?? row.score >= row.passingGrade)).length;
    const average = scored.length > 0 ? scored.reduce((sum, score) => sum + score, 0) / scored.length : null;

    sendResponse(response, 200, 'Get exam statistics report successfully.', {
      summary: {
        totalExams: new Set(rows.map((row) => row.examId)).size,
        totalRooms: new Set(rows.map((row) => row.examRoomId)).size,
        totalParticipants: rows.length,
        submitted,
        scored: scored.length,
        pendingGrade,
        notSubmitted,
        passed,
        failed,
        failedTotal: failed + notSubmitted,
        average: average === null ? null : Math.round(average * 10) / 10,
        minimum: scored.length > 0 ? Math.min(...scored) : null,
        maximum: scored.length > 0 ? Math.max(...scored) : null,
        passRate: rows.length > 0 ? Math.round((passed / rows.length) * 100) : null,
      },
      groups: resultGroups,
    });
  }),
);

export default router;
