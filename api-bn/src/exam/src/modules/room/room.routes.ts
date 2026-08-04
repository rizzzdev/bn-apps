import { Router } from 'express';
import { prisma } from '#exam/database/index.js';
import { validate } from '#exam/middleware/validate.js';
import { RoomRepository } from './room.repository.js';
import { RoomService } from './room.service.js';
import { RoomController } from './room.controller.js';
import { createRoomSchema, updateRoomSchema } from './room.schema.js';

const repository = new RoomRepository(prisma);
const service = new RoomService(repository);
const controller = new RoomController(service);

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(createRoomSchema), controller.create);
router.patch('/:id', validate(updateRoomSchema), controller.updateById);
router.delete('/:id', controller.deleteById);

export default router;
