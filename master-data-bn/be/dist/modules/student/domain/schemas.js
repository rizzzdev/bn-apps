"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateStudentStatusSchema = exports.batchGetStudentSchema = exports.updateStudentSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@/database/generated/client");
exports.createStudentSchema = zod_1.z.object({
    fullname: zod_1.z.string().trim().min(1),
    nik: zod_1.z.string().trim().optional(),
    birthplace: zod_1.z.string().optional(),
    birthdate: zod_1.z
        .string()
        .optional()
        .transform((v) => (v ? new Date(v) : undefined)),
    gender: zod_1.z.nativeEnum(client_1.Gender).optional(),
    religion: zod_1.z.nativeEnum(client_1.Religion).optional(),
    ethnicGroup: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.StudentStatus).optional(),
    nis: zod_1.z.string().trim().optional(),
    nisn: zod_1.z.string().trim().optional(),
    height: zod_1.z.number().int().optional(),
    weight: zod_1.z.number().int().optional(),
    phoneNumber: zod_1.z
        .string()
        .trim()
        .optional()
        .transform((v) => (v ? v.replace(/\D/g, "") : undefined)),
    email: zod_1.z.string().trim().toLowerCase().email(),
    password: zod_1.z.string().min(8),
    userId: zod_1.z.string().uuid().or(zod_1.z.string().cuid()).optional(),
    currentClassId: zod_1.z.string().uuid().optional(),
    currentMajorId: zod_1.z.string().uuid().optional(),
    pictureId: zod_1.z.string().uuid().optional().nullable(),
});
exports.updateStudentSchema = exports.createStudentSchema
    .omit({ nik: true, nis: true, nisn: true, userId: true })
    .partial();
exports.batchGetStudentSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
exports.bulkUpdateStudentStatusSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    status: zod_1.z.nativeEnum(client_1.StudentStatus),
});
