/**
 * Standardized API response helpers ensuring uniform JSON schema across the entire application
 * Section 19 Specification:
 * Success: { success: true, message: "...", data: {}, pagination?: {} }
 * Error:   { success: false, message: "...", errors?: [] }
 */

export const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200, pagination = null) => {
  const payload = {
    success: true,
    message,
    data
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  return res.status(statusCode).json(payload);
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};
