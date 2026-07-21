import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { env } from '@/configs/env';
import { sendResponse } from '@/utils/response';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/errors';
import { academicYearsService } from '@/modules/academic-years/service';
import { majorsService } from '@/modules/majors/service';
import { classesService } from '@/modules/classes/service';
import { teachersService } from '@/modules/teachers/service';
import { studentsService } from '@/modules/students/service';
import { subjectsService } from '@/modules/subjects/service';
import { webhookAcademicYearSchema } from '@/modules/academic-years/domain';
import { webhookMajorSchema } from '@/modules/majors/domain';
import { webhookClassSchema } from '@/modules/classes/domain';
import { webhookTeacherSchema } from '@/modules/teachers/domain';
import { webhookStudentSchema } from '@/modules/students/domain';
import { webhookSubjectSchema } from '@/modules/subjects/domain';
import { prisma } from '@/database';

type ModuleHandler = {
  upsertFromWebhook: (items: any[]) => Promise<{ upserted: number }>;
  schema: ZodSchema;
};

const moduleHandlers: Record<string, ModuleHandler> = {
  'academic-years': { upsertFromWebhook: academicYearsService.upsertFromWebhook.bind(academicYearsService), schema: webhookAcademicYearSchema },
  majors: { upsertFromWebhook: majorsService.upsertFromWebhook.bind(majorsService), schema: webhookMajorSchema },
  classes: { upsertFromWebhook: classesService.upsertFromWebhook.bind(classesService), schema: webhookClassSchema },
  teachers: { upsertFromWebhook: teachersService.upsertFromWebhook.bind(teachersService), schema: webhookTeacherSchema },
  students: { upsertFromWebhook: studentsService.upsertFromWebhook.bind(studentsService), schema: webhookStudentSchema },
  subjects: { upsertFromWebhook: subjectsService.upsertFromWebhook.bind(subjectsService), schema: webhookSubjectSchema },
};

const exportHandlers: Record<string, () => Promise<any>> = {
  'major-students': () => prisma.majorStudent.findMany({ include: { major: true, student: true, academicYear: true } }),
  'class-students': () => prisma.classStudent.findMany({ include: { class: true, student: true, academicYear: true } }),
  'homeroom-teachers': () => prisma.homeroomTeacher.findMany({ include: { teacher: true, class: true, academicYear: true } }),
  'major-heads': () => prisma.majorHead.findMany({ include: { teacher: true, major: true, academicYear: true } }),
  'subject-teachers': () => prisma.subjectTeacher.findMany({ include: { teacher: true, subject: true } }),
  'teacher-picket-schedules': () => prisma.teacherPicketSchedule.findMany({ include: { teacher: true } }),
  'lesson-schedules': () => prisma.lessonSchedule.findMany({
    orderBy: [{ day: 'asc' }, { lessonHour: { order: 'asc' } }],
    include: {
      subject: true,
      lessonHour: true,
      teachers: { include: { teacher: true } },
      classes: { include: { class: true } },
    },
  }),
};

async function fetchAndUpsert(moduleName: string): Promise<{ module: string; upserted: number }> {
  const handler = moduleHandlers[moduleName];
  if (!handler) throw new NotFoundError(`Module '${moduleName}' tidak dikenal`);

  const syncUrl = `${env.MASTER_API_URL.replace(/\/$/, '')}/api/v1/webhook/${moduleName}/sync`;
  const response = await fetch(syncUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': env.API_KEY,
    },
  });

  if (!response.ok) {
    throw new BadRequestError(`External API returned ${response.status}`);
  }

  const body = (await response.json()) as { data?: unknown[] };
  const items = body.data;

  if (!Array.isArray(items) || items.length === 0) {
    throw new BadRequestError('Response external API tidak valid');
  }

  const validated = items.map((item) => handler.schema.parse(item));
  const result = await handler.upsertFromWebhook(validated);

  return { module: moduleName, ...result };
  // return {items}
}

export class WebhookController {
  handleIncoming = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const moduleName = req.params.module as string;
      const handler = moduleHandlers[moduleName];

      if (!handler) {
        throw new NotFoundError(`Module '${moduleName}' tidak dikenal`);
      }

      const { data } = req.body as { data?: unknown[] };
      if (!Array.isArray(data) || data.length === 0) {
        throw new BadRequestError('Body harus berisi array data');
      }

      const validated = data.map((item) => handler.schema.parse(item));
      const result = await handler.upsertFromWebhook(validated);

      sendResponse(res, 200, 'Webhook berhasil diproses', result);
    } catch (error) {
      next(error);
    }
  };

  handleSync = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const moduleName = req.params.module as string;

      if (moduleHandlers[moduleName]) {
        const result = await fetchAndUpsert(moduleName);
        sendResponse(res, 200, 'Sync berhasil', result);
        return;
      }

      if (exportHandlers[moduleName]) {
        const data = await exportHandlers[moduleName]();
        res.status(200).json({ data });
        return;
      }

      throw new NotFoundError(`Module '${moduleName}' tidak dikenal`);
    } catch (error) {
      next(error);
    }
  };

  handleSyncAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const modules = ['academic-years', 'majors', 'classes', 'teachers', 'students', 'subjects'] as const;

      const results = await Promise.allSettled(modules.map(fetchAndUpsert));

      const summary = results.map((r) => {
        if (r.status === 'fulfilled') return r.value;
        return { module: 'unknown', upserted: 0, error: r.reason?.message ?? 'Unknown error' };
      });

      sendResponse(res, 200, 'Sync-all selesai', summary);
    } catch (error) {
      next(error);
    }
  };
}

export const webhookController = new WebhookController();
