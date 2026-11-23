import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import LeaveType from '../models/LeaveType.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createNotification } from '../services/notificationService.js';

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'blen_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, department, designation } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long', 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return sendError(res, 'An account with this email address already exists. Please sign in.', 409);
    }

    // Automatically allocate active leave types with annual quotas
    const activeLeaveTypes = await LeaveType.find({ isActive: true });
    const leaveBalances = activeLeaveTypes.map(lt => ({
      leaveType: lt._id,
      allocated: lt.yearlyQuota,
      used: 0,
      pending: 0
    }));

    // Allow selecting role for testing/intern demonstration, default to employee
    const validRoles = ['employee', 'manager', 'admin'];
    const assignedRole = validRoles.includes(role) ? role : 'employee';

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone ? phone.trim() : '',
      role: assignedRole,
      department: department || undefined,
      designation: designation ? designation.trim() : (assignedRole === 'admin' ? 'Administrator' : assignedRole === 'manager' ? 'Team Lead' : 'Associate Staff'),
      status: 'active',
      leaveBalances
    });

    // Create welcome notification
    await createNotification({
      recipient: user._id,
      title: 'Welcome to BLEN DIGITAL',
      message: `Your account has been registered successfully as ${assignedRole.toUpperCase()}. Your annual leave quotas are now active.`,
      type: 'system'
    });

    const token = generateToken(user);

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const populated = await User.findById(user._id)
      .populate('department', 'name')
      .populate('leaveBalances.leaveType', 'name code yearlyQuota isPaid');

    return sendSuccess(res, 'Account registered successfully', {
      user: populated.toJSON(),
      token
    }, 201);
  } catch (err) {
    next(err);
  }
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
