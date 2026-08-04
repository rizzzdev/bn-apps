import { Router } from 'express';
import { prisma } from '#exam/database/index.js';
import { validate } from '#exam/middleware/validate.js';
import { EssayGradeRepository } from './essay-grade.repository.js';
import { EssayGradeService } from './essay-grade.service.js';
import { EssayGradeController } from './essay-grade.controller.js';
import { createEssayGradeSchema, updateEssayGradeSchema } from './essay-grade.schema.js';

const repository = new EssayGradeRepository(prisma);
const service = new EssayGradeService(repository);
const controller = new EssayGradeController(service);

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(createEssayGradeSchema), controller.upsert);
router.patch('/:id', validate(updateEssayGradeSchema), controller.updateById);
router.delete('/:id', controller.deleteById);

export default router;
