export class BaseError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class NotFoundError extends BaseError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}
export class BadRequestError extends BaseError {
    constructor(message = 'Bad Request') {
        super(message, 400);
    }
}
