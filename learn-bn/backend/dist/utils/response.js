export const sendResponse = (res, statusCode, message, data = null, pagination) => {
    const response = {
        error: false,
        statusCode,
        message,
        data,
        ...(pagination && { pagination })
    };
    return res.status(statusCode).json(response);
};
export const sendError = (res, statusCode, message) => {
    const response = {
        error: true,
        statusCode,
        message,
        data: null
    };
    return res.status(statusCode).json(response);
};
