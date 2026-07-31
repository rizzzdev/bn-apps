import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import { ZodError } from 'zod';
import { ValidationError } from '@app/index.js';

export const validate = (schema: z.ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError(error.message, (error as ZodError).issues));
      }
      next(error);
    }
  };
};
