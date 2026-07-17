import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handler middleware.
 * Catches all unhandled errors, logs them, and returns a structured JSON response.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational ?? false;

  // Log the error
  if (statusCode >= 500) {
    logger.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  } else {
    logger.warn('Client error', {
      message: err.message,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: isOperational ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message,
    }),
  });
}

/**
 * Factory for creating operational errors with status codes.
 */
export function createError(message: string, statusCode: number): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
