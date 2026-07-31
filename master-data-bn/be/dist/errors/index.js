"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.InternalServerError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = void 0;
const express_1 = require("sentri/express");
class BadRequestError extends express_1.SentriError {
    constructor(message = "Bad Request") {
        super("BAD_REQUEST", message, 400);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends express_1.SentriError {
    constructor(message = "Unauthorized") {
        super("UNAUTHORIZED", message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends express_1.SentriError {
    constructor(message = "Forbidden") {
        super("FORBIDDEN", message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends express_1.SentriError {
    constructor(message = "Tidak Ditemukan") {
        super("NOT_FOUND", message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class InternalServerError extends express_1.SentriError {
    constructor(message = "Internal Server Error") {
        super("INTERNAL_SERVER_ERROR", message, 500);
    }
}
exports.InternalServerError = InternalServerError;
class ValidationError extends express_1.SentriError {
    errors;
    constructor(message = "Validation Error", errors) {
        super("VALIDATION_ERROR", message, 400);
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
