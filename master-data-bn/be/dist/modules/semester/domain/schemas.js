"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchGetSemesterSchema = exports.updateSemesterSchema = exports.createSemesterSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@/database/generated/client");
exports.createSemesterSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.SemesterType),
    status: zod_1.z.nativeEnum(client_1.AcademicStatus).optional(),
    academicYearId: zod_1.z.string().uuid(),
});
exports.updateSemesterSchema = exports.createSemesterSchema.partial();
exports.batchGetSemesterSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
