/**
 * Application-level error carrying an HTTP status code. Thrown anywhere in the
 * service/controller layers and translated into the response envelope by the
 * global error handler. `isOperational` distinguishes expected, handled errors
 * from unexpected programmer errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
