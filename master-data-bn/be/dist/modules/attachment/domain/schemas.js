"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchGetAttachmentsSchema = exports.bulkDeleteAttachmentsSchema = void 0;
const zod_1 = require("zod");
exports.bulkDeleteAttachmentsSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
exports.batchGetAttachmentsSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
