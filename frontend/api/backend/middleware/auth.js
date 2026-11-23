import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendError } from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Support both Bearer Authorization Header and Cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Access denied. No authentication token provided.', 401);
    }

    const secret = process.env.JWT_SECRET || 'blen_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email role');

    if (!user) {
      return sendError(res, 'User associated with this token no longer exists.', 401);
    }

    if (user.status !== 'active') {
      return sendError(res, 'User account is deactivated. Contact HR / Administrator.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

/**
 * Role-Based Access Control Middleware
 * @param  {...string} roles Allowed roles ('admin', 'manager', 'employee')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required: [${roles.join(', ')}]`,
        403
      );
    }

    next();
  };
};
