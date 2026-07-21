import type { Request, Response, NextFunction } from 'express';
import { sendResponse, sendError } from '@/utils/response';
import { BadRequestError } from '@/errors';

import { academicYearService } from '@/modules/shadow-academic-year';
import { majorService } from '@/modules/shadow-major';
import { classService } from '@/modules/shadow-class';
import { teacherService } from '@/modules/shadow-teacher';
import { studentService } from '@/modules/shadow-student';
import { subjectService } from '@/modules/shadow-subject';
import { majorStudentService } from '@/modules/shadow-major-student';
import { classStudentService } from '@/modules/shadow-class-student';
import { subjectTeacherService } from '@/modules/shadow-subject-teacher';
import { lessonScheduleService } from '@/modules/shadow-lesson-schedule';

export class WebhookController {
  private moduleServices: Record<string, any> = {
    'shadow-academic-year': academicYearService,
    'shadow-major': majorService,
    'shadow-class': classService,
    'shadow-teacher': teacherService,
    'shadow-student': studentService,
    'shadow-subject': subjectService,
    'shadow-major-student': majorStudentService,
    'shadow-major-students': majorStudentService, // Plural alias
    'shadow-class-student': classStudentService,
    'shadow-class-students': classStudentService, // Plural alias
    'shadow-subject-teacher': subjectTeacherService,
    'shadow-subject-teachers': subjectTeacherService, // Plural alias
    'shadow-lesson-schedule': lessonScheduleService,
    'shadow-lesson-schedules': lessonScheduleService, // Plural alias
  };

  syncAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      const masterApi = process.env.MASTER_API_URL;
      const akademikApi = process.env.AKADEMIK_API_URL;

      const masterModules = ['academic-years', 'majors', 'classes', 'teachers', 'students', 'subjects'];
      const akademikModules = ['major-students', 'class-students', 'subject-teachers', 'lesson-schedules'];

      const results: any[] = [];

      // Fetch from Master API
      for (const mod of masterModules) {
        try {
          const response = await fetch(`${masterApi}/webhook/${mod}/sync`, {
            method: 'POST',
            headers: { 'x-api-key': apiKey }
          });
          const payload = await response.json();
          if (payload && payload.data) {
            const dataArray = Array.isArray(payload.data) ? payload.data : [payload.data];
            let serviceKey = `shadow-${mod}`;
            if (!this.moduleServices[serviceKey]) {
              serviceKey = `shadow-${mod.replace(/s$/, '')}`;
            }
            if (!this.moduleServices[serviceKey] && mod === 'classes') {
              serviceKey = 'shadow-class';
            }
            const service = this.moduleServices[serviceKey];
            if (service) {
              const res = await service.upsertFromWebhook(dataArray);
              results.push({ module: mod, upserted: res.upserted });
            }
          }
        } catch (err: any) {
          console.error(`Failed to sync ${mod} from Master API:`, err.message);
        }
      }

      // Fetch from Akademik API
      for (const mod of akademikModules) {
        try {
          const response = await fetch(`${akademikApi}/webhook/${mod}/sync`, {
            method: 'POST',
            headers: { 'x-api-key': apiKey }
          });
          const payload = await response.json();
          if (payload && payload.data) {
            const dataArray = Array.isArray(payload.data) ? payload.data : [payload.data];
            const service = this.moduleServices[`shadow-${mod}`] || this.moduleServices[`shadow-${mod.replace(/s$/, '')}`];
            if (service) {
              const res = await service.upsertFromWebhook(dataArray);
              results.push({ module: mod, upserted: res.upserted });
            }
          }
        } catch (err: any) {
          console.error(`Failed to sync ${mod} from Akademik API:`, err.message);
        }
      }

      sendResponse(res, 200, 'Sync all triggered successfully', results);
    } catch (error) {
      next(error);
    }
  };

  syncModule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { module } = req.params;
      const payload = req.body;

      if (!payload || !payload.data) {
        throw new BadRequestError('Payload must contain a "data" property');
      }

      const mod = Array.isArray(module) ? module[0] : module;
      const service = this.moduleServices[mod];
      if (!service) {
        throw new BadRequestError(`Module ${module} not supported`);
      }

      // Ensure data is always an array
      const dataArray = Array.isArray(payload.data) ? payload.data : [payload.data];
      
      const result = await service.upsertFromWebhook(dataArray);
      
      return sendResponse(res, 200, `Webhook processed successfully for ${module}`, result);
    } catch (error) {
      next(error);
    }
  };
}

export const webhookController = new WebhookController();
