"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchGetMajorSchema = exports.updateMajorSchema = exports.createMajorSchema = void 0;
const zod_1 = require("zod");
exports.createMajorSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1),
    name: zod_1.z.string().trim().min(1),
});
exports.updateMajorSchema = exports.createMajorSchema.partial();
exports.batchGetMajorSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
