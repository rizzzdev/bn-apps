"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchGetClassSchema = exports.updateClassSchema = exports.createClassSchema = void 0;
const zod_1 = require("zod");
exports.createClassSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    majorId: zod_1.z.string().uuid(),
});
exports.updateClassSchema = exports.createClassSchema.partial();
exports.batchGetClassSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
