import { StatusCode } from "../types/api.js";

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: StatusCode,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, StatusCode.NOT_FOUND);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, StatusCode.BAD_REQUEST);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, StatusCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, StatusCode.FORBIDDEN);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, StatusCode.BAD_REQUEST);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests") {
    super(message, StatusCode.TOO_MANY_REQUESTS);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, StatusCode.INTERNAL_SERVER_ERROR);
  }
}
