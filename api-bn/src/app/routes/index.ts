import { authRouter } from "@auth/index.js";
import { Router } from "express";

const appRouter = Router()

import { masterRouter } from '@master/index.js';
import { academicRouter } from '@academic/index.js';
import { internshipRouter } from '@internship/index.js';
import { learnRouter } from '@learn/index.js';

appRouter.use("/api/v1/auth", authRouter)
appRouter.use("/api/v1/master", masterRouter)
appRouter.use("/api/v1/academic", academicRouter)
appRouter.use("/api/v1/internship", internshipRouter)
appRouter.use("/api/v1/learn", learnRouter)
export { appRouter }