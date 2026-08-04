import { Router } from 'express';
import { sentriAuth } from '#auth';
import { studentRoute } from '#internship/modules/student/index.js';
import { teacherRoute } from '#internship/modules/teacher/index.js';
import { companyRoute } from '#internship/modules/company/index.js';
import { industryMentorRoute } from '#internship/modules/industry-mentor/index.js';
import { internshipPlacementRoute } from '#internship/modules/internship-placement/index.js';
import { dailyLogbookRoute } from '#internship/modules/daily-logbook/index.js';
import { assessmentRoute } from '#internship/modules/assessment/index.js';
import { attachmentRoute } from '#internship/modules/attachment/index.js';
import { attachmentController } from '#internship/modules/attachment/controller/index.js';
import { activityRoute } from '#internship/modules/activity/index.js';
import { dashboardRoute } from '#internship/modules/dashboard/index.js';
import { attendanceRoute } from '#internship/modules/attendance/index.js';
import { assessmentIndicatorRoute } from '#internship/modules/assessment-indicator/index.js';
import { assessmentScoreRoute } from '#internship/modules/assessment-score/index.js';

export const internshipRouter = Router();

// Endpoint file attachment (public)
internshipRouter.get('/attachments/file/:filename', attachmentController.serveFile);

internshipRouter.use(sentriAuth.protect());

// Daftarkan semua module routes
internshipRouter.use('/students', studentRoute);
internshipRouter.use('/teachers', teacherRoute);
internshipRouter.use('/companies', companyRoute);
internshipRouter.use('/industry-mentors', industryMentorRoute);
internshipRouter.use('/internship-placements', internshipPlacementRoute);
internshipRouter.use('/daily-logbooks', dailyLogbookRoute);
internshipRouter.use('/assessments', assessmentRoute);
internshipRouter.use('/attachments', attachmentRoute);
internshipRouter.use('/activities', activityRoute);
internshipRouter.use('/dashboard', dashboardRoute);
internshipRouter.use('/attendances', attendanceRoute);
internshipRouter.use('/assessment-indicators', assessmentIndicatorRoute);
internshipRouter.use('/assessment-scores', assessmentScoreRoute);
