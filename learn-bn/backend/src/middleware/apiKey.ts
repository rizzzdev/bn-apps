import type { Request, Response, NextFunction } from 'express';
import { sendResponse, sendError } from '@/utils/response';

import { env } from '@/configs/env';

export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = env.API_KEY;

  if (!expectedKey) {
    console.error('API_KEY is not configured in environment variables');
    return sendError(res, 500, 'Server misconfiguration');
  }

  if (apiKey !== expectedKey) {
    return sendError(res, 403, 'Forbidden: Invalid API Key');
  }

  next();
};
