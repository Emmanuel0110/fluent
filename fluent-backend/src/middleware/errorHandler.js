/**
 * Centralized error handling middleware
 * Hides sensitive error details in production
 */

import { logger } from "../logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
    err.message || "Request error"
  );

  // Determine if we're in production
  const isProduction = process.env.NODE_ENV === "production";

  // Default error response
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation error";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.name === "MongoError" || err.name === "MongoServerError") {
    if (err.code === 11000) {
      statusCode = 409;
      message = "Duplicate entry";
    } else {
      statusCode = 500;
      message = isProduction ? "Database error" : err.message;
    }
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // In production, never expose internal error details
  const response = {
    success: false,
    message: isProduction ? getGenericMessage(statusCode) : message,
    ...(isProduction
      ? {}
      : {
          // Only include detailed error info in development
          error: err.message,
          ...(err.stack && { stack: err.stack }),
        }),
  };

  res.status(statusCode).json(response);
};

/**
 * Get generic error messages for production
 */
const getGenericMessage = (statusCode) => {
  const messages = {
    400: "Bad request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not found",
    409: "Conflict",
    422: "Unprocessable entity",
    500: "Internal server error",
    503: "Service unavailable",
  };
  return messages[statusCode] || "An error occurred";
};

/**
 * Async error wrapper - catches errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

