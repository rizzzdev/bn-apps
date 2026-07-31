"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchGetSubjectSchema = exports.updateSubjectSchema = exports.createSubjectSchema = void 0;
const zod_1 = require("zod");
exports.createSubjectSchema = zod_1.z.object({
    code: zod_1.z.string().trim().min(1),
    name: zod_1.z.string().trim().min(1),
});
exports.updateSubjectSchema = exports.createSubjectSchema.partial();
exports.batchGetSubjectSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
