// Domain error hierarchy for structured API error handling
export class AppError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(msg = "Not found") { super(msg, 404); }
}

export class ForbiddenError extends AppError {
  constructor(msg = "Forbidden") { super(msg, 403); }
}

export class ValidationError extends AppError {
  constructor(msg: string) { super(msg, 400); }
}

export class UnauthorizedS3KeyError extends ForbiddenError {
  constructor() { super("Invalid or unauthorized S3 key"); }
}
