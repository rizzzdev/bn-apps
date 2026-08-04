import { Router } from 'express';
import { prisma } from '#exam/database/index.js';
import { sendResponse } from '#app';
import { asyncHandler } from '#exam/utils/asyncHandler.js';
import { shadowSyncService } from '#exam/services/shadow-sync.service.js';

const classDirectoryRouter = Router();

classDirectoryRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    await shadowSyncService.lazySyncAll().catch(() => {});
    const classes = await prisma.shadowClass.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    sendResponse(res, 200, 'OK', classes);
  }),
);

export default classDirectoryRouter;
