import { Router } from 'express';
import { sentriAuth } from '@/lib/sentri';
import { academicYearsRoute } from '@/modules/academic-years';
import { majorsRoute } from '@/modules/majors';
import { classesRoute } from '@/modules/classes';
import { teachersRoute } from '@/modules/teachers';
import { studentsRoute } from '@/modules/students';
import { subjectsRoute } from '@/modules/subjects';
import { majorStudentsRoute } from '@/modules/major-students';
import { classStudentsRoute } from '@/modules/class-students';
import { homeroomTeachersRoute } from '@/modules/homeroom-teachers';
import { subjectTeachersRoute } from '@/modules/subject-teachers';
import { teacherPicketSchedulesRoute } from '@/modules/teacher-picket-schedules';
import { majorHeadsRoute } from '@/modules/major-heads';
import { lessonSchedulesRoute } from '@/modules/lesson-schedules';
import { lessonHoursRoute } from '@/modules/lesson-hours';

export const appRoutes = Router();

appRoutes.use(sentriAuth.protect());

appRoutes.use('/shadow-academic-years', academicYearsRoute);
appRoutes.use('/shadow-majors', majorsRoute);
appRoutes.use('/shadow-classes', classesRoute);
appRoutes.use('/shadow-teachers', teachersRoute);
appRoutes.use('/shadow-students', studentsRoute);
appRoutes.use('/shadow-subjects', subjectsRoute);
appRoutes.use('/major-students', majorStudentsRoute);
appRoutes.use('/class-students', classStudentsRoute);
appRoutes.use('/homeroom-teachers', homeroomTeachersRoute);
appRoutes.use('/subject-teachers', subjectTeachersRoute);
appRoutes.use('/teacher-picket-schedules', teacherPicketSchedulesRoute);
appRoutes.use('/major-heads', majorHeadsRoute);
appRoutes.use('/lesson-schedules', lessonSchedulesRoute);
appRoutes.use('/lesson-hours', lessonHoursRoute);
