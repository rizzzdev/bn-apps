import { Router } from 'express';
import { getUsers, updateRoles, bulkUpdateRoles } from './user.controller';
import { sentriAuth } from '../../database/index';

const router = Router();

// Protect with sentriAuth and require super_admin role
router.get('/', sentriAuth.authorize('super_admin'), getUsers);
router.patch('/bulk/roles', sentriAuth.authorize('super_admin'), bulkUpdateRoles);
router.patch('/:id/roles', sentriAuth.authorize('super_admin'), updateRoles);

export { router as userRouter };
