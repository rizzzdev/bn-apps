import { validate } from '#master/middlewares';
import { Router } from "express";
import { academicyearController } from '#master/modules/academic-year/controller';
import { sentriAuth } from '#auth';
import { batchGetAcademicYearSchema, createAcademicYearSchema, updateAcademicYearSchema } from '#master/modules/academic-year/domain';
import { z } from 'zod';

export const academicyearRoute = Router();

academicyearRoute.post(
  "/batch",
  sentriAuth.authorize("super_admin"),
  validate(batchGetAcademicYearSchema),
  academicyearController.getBatch,
);
academicyearRoute.delete(
  "/batch",
  sentriAuth.authorize("super_admin"),
  validate(z.object({ ids: z.array(z.string().min(1)).min(1) })),
  academicyearController.bulkDelete,
);

academicyearRoute.get(
  "/",
  sentriAuth.authorize("super_admin"),
  academicyearController.getAll,
);
academicyearRoute.get("/:id", academicyearController.getById);
academicyearRoute.post(
  "/",
  sentriAuth.authorize("super_admin"),
  validate(createAcademicYearSchema),
  academicyearController.create,
);
academicyearRoute.put(
  "/:id",
  sentriAuth.authorize("super_admin"),
  validate(updateAcademicYearSchema),
  academicyearController.update,
);
academicyearRoute.delete(
  "/:id",
  sentriAuth.authorize("super_admin"),
  academicyearController.delete,
);
