import { Router } from 'express';
import { sentriAuth } from '@/lib/sentri';
import { resolveProfile } from '@/lib/resolve-profile';

import { attachmentRoute } from '@/modules/attachment';
import { materialRoute } from '@/modules/material';
import { assignmentRoute } from '@/modules/assignment';
import { assignmentSubmissionRoute, directSubmissionRoute } from '@/modules/assignment-submission';
import { quizRoute } from '@/modules/quiz';
import { quizSubmissionRoute } from '@/modules/quiz-submission';
import { gradeRoute } from '@/modules/grade';
import { dashboardRoute } from '@/modules/dashboard';

export const appRoutes = Router();

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
