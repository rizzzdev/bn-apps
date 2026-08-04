import { authRouter } from "#auth";
import { Router } from "express";

const appRouter = Router()

import { masterRouter } from '#master';
import { academicRouter } from '#academic';
import { internshipRouter } from '#internship';
import { learnRouter } from '#learn';
import { examRouter } from '#exam';

appRouter.use("/api/v1/auth", authRouter)
appRouter.use("/api/v1/master", masterRouter)
appRouter.use("/api/v1/academic", academicRouter)
appRouter.use("/api/v1/internship", internshipRouter)
appRouter.use("/api/v1/learn", learnRouter)
appRouter.use("/api/v1/exam", examRouter)
export { appRouter }