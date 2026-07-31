"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchGetAcademicYearSchema = exports.updateAcademicYearSchema = exports.createAcademicYearSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@/database/generated/client");
exports.createAcademicYearSchema = zod_1.z.object({
    code: zod_1.z.string().min(1).optional(),
    startYear: zod_1.z.number().int(),
    endYear: zod_1.z.number().int(),
    status: zod_1.z.nativeEnum(client_1.AcademicStatus).optional(),
});
exports.updateAcademicYearSchema = exports.createAcademicYearSchema.partial();
exports.batchGetAcademicYearSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
