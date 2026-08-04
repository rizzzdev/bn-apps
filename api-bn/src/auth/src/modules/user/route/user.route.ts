import { Router } from "express";
import { userController } from '../controller/user.controller.js';
import { sentriAuth } from '#auth';
import { updateRoleSchema, bulkUpdateRoleSchema } from '../domain/index.js';
import { validate } from '#master/middlewares/index.js';

export const userRoute = Router();

userRoute.get(
  "/",
  sentriAuth.authorize("super_admin"),
  userController.getAll,
);

userRoute.get(
  "/roles",
  sentriAuth.authorize("super_admin"),
  userController.getRoles,
);

userRoute.get(
  "/:id",
  sentriAuth.authorize("super_admin"),
  userController.getById,
);

// Batch routes — distandardisasi (menggunakan PATCH untuk partial update)
userRoute.patch(
  "/roles/batch",
  sentriAuth.authorize("super_admin"),
  validate(bulkUpdateRoleSchema),
  userController.bulkUpdateRoles,
);

userRoute.put(
  "/:id/roles",
  sentriAuth.authorize("super_admin"),
  validate(updateRoleSchema),
  userController.updateRoles,
);
