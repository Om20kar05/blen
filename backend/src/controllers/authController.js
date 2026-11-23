import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'blen_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn });
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    // Find user by email and include password for verification
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('department', 'name')
      .populate('reportingManager', 'name email role')
      .populate('leaveBalances.leaveType', 'name code yearlyQuota isPaid');

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (user.status !== 'active') {
      return sendError(res, 'Account is deactivated. Please contact HR or System Administrator.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user);

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const userObj = user.toJSON();

    return sendSuccess(res, 'Login successful', {
      user: userObj,
      token
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  return sendSuccess(res, 'Logged out successfully');
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email role')
      .populate('leaveBalances.leaveType', 'name code yearlyQuota isPaid');

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, 'User profile retrieved', { user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();

    await user.save();

    return sendSuccess(res, 'Profile updated successfully', { user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};
