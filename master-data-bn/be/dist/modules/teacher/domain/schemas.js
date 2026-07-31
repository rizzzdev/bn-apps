"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateTeacherStatusSchema = exports.batchGetTeacherSchema = exports.updateTeacherSchema = exports.createTeacherSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@/database/generated/client");
exports.createTeacherSchema = zod_1.z.object({
    fullname: zod_1.z.string().trim().min(1),
    nik: zod_1.z.string().trim().optional(),
    birthplace: zod_1.z.string().optional(),
    birthdate: zod_1.z.string().optional().transform(v => v ? new Date(v) : undefined),
    gender: zod_1.z.nativeEnum(client_1.Gender).optional(),
    religion: zod_1.z.nativeEnum(client_1.Religion).optional(),
    ethnicGroup: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.TeacherStatus).optional(),
    prefixTitle: zod_1.z.string().trim().optional(),
    suffixTitle: zod_1.z.string().trim().optional(),
    nip: zod_1.z.string().trim().optional(),
    height: zod_1.z.number().int().optional(),
    weight: zod_1.z.number().int().optional(),
    phoneNumber: zod_1.z.string().trim().optional().transform(v => v ? v.replace(/\D/g, '') : undefined),
    email: zod_1.z.string().trim().toLowerCase().email(),
    userId: zod_1.z.string().optional(),
    password: zod_1.z.string(),
    pictureId: zod_1.z.string().uuid().optional().nullable(),
});
exports.updateTeacherSchema = exports.createTeacherSchema.omit({ nik: true, nip: true, userId: true }).partial();
exports.batchGetTeacherSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
exports.bulkUpdateTeacherStatusSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    status: zod_1.z.nativeEnum(client_1.TeacherStatus),
});
