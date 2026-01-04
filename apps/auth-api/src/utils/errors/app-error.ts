export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode = 500, isOperational = true, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: any) {
    super(message, 404, true, details);
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed", details?: any) {
    super(message, 401, true, details);
  }
}

// Forbidden errors
export class ForbiddenError extends AppError {
  constructor(message = "Access forbidden", details?: any) {
    super(message, 403, true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", details?: any) {
    super(message, 429, true, details);
  }
}
