import { Router } from 'express';
import { sentriAuth } from '../lib/sentri';
import { resolveProfile } from '../lib/resolve-profile';
import { webhookRoute } from '../modules/webhook';
import { academicYearRoute } from '../modules/shadow-academic-year';
import { majorRoute } from '../modules/shadow-major';
import { classRoute } from '../modules/shadow-class';
import { teacherRoute } from '../modules/shadow-teacher';
import { studentRoute } from '../modules/shadow-student';
import { subjectRoute } from '../modules/shadow-subject';
import { majorStudentRoute } from '../modules/shadow-major-student';
import { classStudentRoute } from '../modules/shadow-class-student';
import { subjectTeacherRoute } from '../modules/shadow-subject-teacher';
import { lessonScheduleRoute } from '../modules/shadow-lesson-schedule';
import { attachmentRoute } from '../modules/attachment';
import { materialRoute } from '../modules/material';
import { assignmentRoute } from '../modules/assignment';
import { assignmentSubmissionRoute, directSubmissionRoute } from '../modules/assignment-submission';
import { quizRoute } from '../modules/quiz';
import { quizSubmissionRoute } from '../modules/quiz-submission';
import { gradeRoute } from '../modules/grade';
import { dashboardRoute } from '../modules/dashboard';
export const appRoutes = Router();
// Webhooks (protected by X-Api-Key internally via middleware)
appRoutes.use('/webhook', webhookRoute);
// Public API
appRoutes.use('/attachments', attachmentRoute);
// Protect all remaining routes with Sentri JWT validation (client mode — fetches JWKS from Master API)
appRoutes.use(sentriAuth.protect());
// Resolve profileId (teacher/student ID) from JWT user.id
appRoutes.use(resolveProfile);
// LMS Endpoints
appRoutes.use('/materials', materialRoute);
appRoutes.use('/assignments', assignmentRoute);
appRoutes.use('/assignments/:assignmentId/submissions', assignmentSubmissionRoute);
appRoutes.use('/assignment-submissions', directSubmissionRoute);
appRoutes.use('/quizzes', quizRoute);
appRoutes.use('/quizzes/:quizId/submissions', quizSubmissionRoute);
appRoutes.use('/grades', gradeRoute);
appRoutes.use('/dashboard', dashboardRoute);
// Shadow Read-Only endpoints
appRoutes.use('/academic-year', academicYearRoute);
appRoutes.use('/major', majorRoute);
appRoutes.use('/class', classRoute);
appRoutes.use('/teacher', teacherRoute);
appRoutes.use('/student', studentRoute);
appRoutes.use('/subject', subjectRoute);
appRoutes.use('/major-student', majorStudentRoute);
appRoutes.use('/class-student', classStudentRoute);
appRoutes.use('/subject-teacher', subjectTeacherRoute);
appRoutes.use('/lesson-schedule', lessonScheduleRoute);
