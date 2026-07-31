"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const errors_1 = require("../errors");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            // Kita validasi req.body
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                // melempar ValidationError sesuai request
                return next(new errors_1.ValidationError(error.message, error.errors));
            }
            next(error);
        }
    };
};
exports.validate = validate;
