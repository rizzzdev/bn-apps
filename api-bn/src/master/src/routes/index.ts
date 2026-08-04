import { Router } from "express";
import { sentriAuth } from '#auth';
import { academicyearRoute } from "../modules/academic-year/index.js";
import { semesterRoute } from "../modules/semester/index.js";
import { classRoute } from "../modules/class/index.js";
import { majorRoute } from "../modules/major/index.js";
import { studentRoute } from "../modules/student/index.js";
import { teacherRoute } from "../modules/teacher/index.js";
import { subjectRoute } from "../modules/subject/index.js";
import { dashboardRoute } from "../modules/dashboard/index.js";
import { attachmentRoute } from "../modules/attachment/index.js";
import { applicationRoute } from "../modules/application/index.js";

export const masterRouter = Router();

// Global protect middleware — sets req.user from JWT/API key
masterRouter.use(sentriAuth.protect());
masterRouter.use("/academic-years", academicyearRoute);
masterRouter.use("/semesters", semesterRoute);
masterRouter.use("/classes", classRoute);
masterRouter.use("/majors", majorRoute);
masterRouter.use("/students", studentRoute);
masterRouter.use("/teachers", teacherRoute);
masterRouter.use("/subjects", subjectRoute);
masterRouter.use("/dashboard", dashboardRoute);
masterRouter.use("/attachments", attachmentRoute);
masterRouter.use("/applications", applicationRoute);

