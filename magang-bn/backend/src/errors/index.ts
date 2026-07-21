import { SentriError } from 'sentri/express';

export class BadRequestError extends SentriError {
  constructor(message: string = 'Bad Request') {
    super('BAD_REQUEST', message, 400);
  }
}

export class NotFoundError extends SentriError {
  constructor(message: string = 'Tidak Ditemukan') {
    super('NOT_FOUND', message, 404);
  }
}

export class ValidationError extends SentriError {
  constructor(message: string = 'Validation Error', public errors?: unknown) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class ForbiddenError extends SentriError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class UnauthorizedError extends SentriError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class InternalServerError extends SentriError {
  constructor(message: string = 'Internal Server Error') {
    super('INTERNAL_SERVER_ERROR', message, 500);
  }
}

export class MethodNotAllowedError extends SentriError {
  constructor(message: string = 'Method Not Allowed') {
    super('METHOD_NOT_ALLOWED', message, 405);
  }
}
