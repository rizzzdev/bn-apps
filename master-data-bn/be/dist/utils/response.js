"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendResponse = void 0;
const sendResponse = (res, statusCode, message, data = null, pagination, error = false) => {
    const response = {
        error,
        statusCode,
        message,
        data,
        ...(pagination && { pagination })
    };
    return res.status(statusCode).json(response);
};
exports.sendResponse = sendResponse;
const sendError = (res, statusCode, message) => {
    return (0, exports.sendResponse)(res, statusCode, message, null, undefined, true);
};
exports.sendError = sendError;
