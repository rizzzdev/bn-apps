import { Router } from 'express';
import { sentriAuth } from '@/lib/sentri.js';
import { studentRoute } from '@/modules/student/index.js';
import { teacherRoute } from '@/modules/teacher/index.js';
import { companyRoute } from '@/modules/company/index.js';
import { industryMentorRoute } from '@/modules/industry-mentor/index.js';
import { internshipPlacementRoute } from '@/modules/internship-placement/index.js';
import { dailyLogbookRoute } from '@/modules/daily-logbook/index.js';
import { assessmentRoute } from '@/modules/assessment/index.js';
import { attachmentRoute } from '@/modules/attachment/index.js';
import { attachmentController } from '@/modules/attachment/controller/index.js';
import { activityRoute } from '@/modules/activity/index.js';
import { studentWebhookRoute } from '@/modules/student/route/student.route.js';
import { teacherWebhookRoute } from '@/modules/teacher/route/teacher.route.js';
import { studentSyncWebhook } from '@/modules/student/index.js';
import { teacherSyncWebhook } from '@/modules/teacher/index.js';
import { dashboardRoute } from '@/modules/dashboard/index.js';
import { attendanceRoute } from '@/modules/attendance/index.js';
import { sendResponse } from '@/utils/response.js';

export const appRoutes = Router();

// Apply auth middleware ke semua route di bawah (uncomment jika sudah setup auth server)

// Endpoint file attachment (public)
appRoutes.get('/attachments/file/:filename', attachmentController.serveFile);

// endpoint for webhook
appRoutes.use("/webhook/students", studentWebhookRoute);
appRoutes.use("/webhook/teachers", teacherWebhookRoute);
appRoutes.post('/webhook/sync-all', async (_request, response, next) => {
  try {
    const [students, teachers] = await Promise.all([
      studentSyncWebhook(),
      teacherSyncWebhook()
    ]);
    sendResponse(response, 200, 'All data synced successfully', { students, teachers });
  } catch (error) {
    next(error);
  }
});

appRoutes.use(sentriAuth.protect());

// Daftarkan semua module routes
appRoutes.use('/students', studentRoute);
appRoutes.use('/teachers', teacherRoute);
appRoutes.use('/companies', companyRoute);
appRoutes.use('/industry-mentors', industryMentorRoute);
appRoutes.use('/internship-placements', internshipPlacementRoute);
appRoutes.use('/daily-logbooks', dailyLogbookRoute);
appRoutes.use('/assessments', assessmentRoute);
appRoutes.use('/attachments', attachmentRoute);
appRoutes.use('/activities', activityRoute);
appRoutes.use('/dashboard', dashboardRoute);
appRoutes.use('/attendances', attendanceRoute);
