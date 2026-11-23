import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${req.method} ${req.originalUrl} - Error:`, err);

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    return sendError(res, `Resource not found with ID: ${err.value}`, 404);
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return sendError(res, `Duplicate entry for ${field}: "${value}". Please provide a unique value.`, 409);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    return sendError(res, 'Validation error', 400, errors);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired. Please log in again.', 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : (process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message);

  return sendError(res, message, statusCode);
};
