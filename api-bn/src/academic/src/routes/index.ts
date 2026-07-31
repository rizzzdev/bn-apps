import { Router } from 'express';
import { sentriAuth } from '@auth/index.js';
import { majorStudentsRoute } from '@academic/modules/major-students';
import { classStudentsRoute } from '@academic/modules/class-students';
import { homeroomTeachersRoute } from '@academic/modules/homeroom-teachers';
import { subjectTeachersRoute } from '@academic/modules/subject-teachers';
import { teacherPicketSchedulesRoute } from '@academic/modules/teacher-picket-schedules';
import { majorHeadsRoute } from '@academic/modules/major-heads';
import { lessonSchedulesRoute } from '@academic/modules/lesson-schedules';
import { lessonHoursRoute } from '@academic/modules/lesson-hours';
import { classSubjectRequirementsRoute } from '@academic/modules/class-subject-requirements';
import { teacherUnavailabilitiesRoute } from '@academic/modules/teacher-unavailabilities';
import { generatorRoute } from '@academic/modules/timetable-generator';
import { shadowRoute } from './shadow.route.js';

export const academicRouter = Router();

academicRouter.use(sentriAuth.protect());

academicRouter.use(shadowRoute);
academicRouter.use('/major-students', majorStudentsRoute);
academicRouter.use('/class-students', classStudentsRoute);
academicRouter.use('/homeroom-teachers', homeroomTeachersRoute);
academicRouter.use('/subject-teachers', subjectTeachersRoute);
academicRouter.use('/teacher-picket-schedules', teacherPicketSchedulesRoute);
academicRouter.use('/major-heads', majorHeadsRoute);
academicRouter.use('/lesson-schedules/generator', generatorRoute);
academicRouter.use('/lesson-schedules', lessonSchedulesRoute);
academicRouter.use('/lesson-hours', lessonHoursRoute);
academicRouter.use('/class-subject-requirements', classSubjectRequirementsRoute);
academicRouter.use('/teacher-unavailabilities', teacherUnavailabilitiesRoute);

