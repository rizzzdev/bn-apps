import { Router } from "express";
import { academicyearRoute } from "@/modules/academic-year";
import { semesterRoute } from "@/modules/semester";
import { classRoute } from "@/modules/class";
import { majorRoute } from "@/modules/major";
import { studentRoute } from "@/modules/student";
import { teacherRoute } from "@/modules/teacher";
import { subjectRoute } from "@/modules/subject";
import { dashboardRoute } from "@/modules/dashboard";
import { userRouter } from "@/modules/user/user.route";
import { sentriAuth } from "@/database";
import { attachmentRoute } from "@/modules/attachment";

export const appRoutes = Router();

appRoutes.use(sentriAuth.protect());
appRoutes.use("/users", userRouter);
appRoutes.use("/academic-years", academicyearRoute);
appRoutes.use("/semesters", semesterRoute);
appRoutes.use("/classes", classRoute);
appRoutes.use("/majors", majorRoute);
appRoutes.use("/students", studentRoute);
appRoutes.use("/teachers", teacherRoute);
appRoutes.use("/subjects", subjectRoute);
appRoutes.use("/dashboard", dashboardRoute);
appRoutes.use("/attachments", attachmentRoute);
