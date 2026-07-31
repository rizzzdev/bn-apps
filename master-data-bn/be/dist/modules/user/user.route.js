"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const index_1 = require("../../database/index");
const router = (0, express_1.Router)();
exports.userRouter = router;
// Protect with sentriAuth and require super_admin role
router.get('/', index_1.sentriAuth.authorize('super_admin'), user_controller_1.getUsers);
router.patch('/bulk/roles', index_1.sentriAuth.authorize('super_admin'), user_controller_1.bulkUpdateRoles);
router.patch('/:id/roles', index_1.sentriAuth.authorize('super_admin'), user_controller_1.updateRoles);
