import { Router } from 'express';
import { sentriAuth } from '@auth/index.js';

import { resolveProfile } from '../middleware/resolve-profile.js';

import { attachmentRoute } from '@/modules/attachment';
import { materialRoute } from '@/modules/material';
import { assignmentRoute } from '@/modules/assignment';
import { assignmentSubmissionRoute, directSubmissionRoute } from '@/modules/assignment-submission';
import { quizRoute } from '@/modules/quiz';
import { quizSubmissionRoute } from '@/modules/quiz-submission';
import { gradeRoute } from '@/modules/grade';
import { dashboardRoute } from '@/modules/dashboard';

export const learnRouter = Router();

// Public API
learnRouter.use('/attachments', attachmentRoute);

// Protect all remaining routes with Sentri JWT validation (client mode — fetches JWKS from Master API)
learnRouter.use(sentriAuth.protect());

// Resolve profileId dari master database berdasarkan auth user
learnRouter.use(resolveProfile);

// LMS Endpoints
learnRouter.use('/materials', materialRoute);
learnRouter.use('/assignments', assignmentRoute);
learnRouter.use('/assignments/:assignmentId/submissions', assignmentSubmissionRoute);
learnRouter.use('/assignment-submissions', directSubmissionRoute);
learnRouter.use('/quizzes', quizRoute);
learnRouter.use('/quizzes/:quizId/submissions', quizSubmissionRoute);
learnRouter.use('/grades', gradeRoute);
learnRouter.use('/dashboard', dashboardRoute);
