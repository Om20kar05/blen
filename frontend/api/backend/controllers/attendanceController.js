import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createNotification } from '../services/notificationService.js';
import { format } from 'date-fns';

// Helper to get consistent YYYY-MM-DD date key
const getTodayDateString = (date = new Date()) => {
  return format(date, 'yyyy-MM-dd');
};

export const checkIn = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStr = getTodayDateString(now);

    // CRITICAL RULE 1: Prevent duplicate check-in on the same day
    const existing = await Attendance.findOne({ user: userId, date: todayStr });
    if (existing) {
      return sendError(res, 'Already checked in for today', 400);
    }

    // CRITICAL RULE 4 & 5: Determine status (Standard start time: 09:30 AM)
    // Check local hours and minutes
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 30);
    const initialStatus = isLate ? 'Late' : 'Present';

    const attendance = await Attendance.create({
      user: userId,
      date: todayStr,
      checkIn: now,
      status: initialStatus,
      notes: req.body.notes || ''
    });

    // Send in-app notification
    await createNotification({
      recipient: userId,
      title: 'Attendance Check-in',
      message: `Checked in successfully at ${format(now, 'hh:mm a')} (${initialStatus})`,
      type: 'attendance_alert',
      relatedId: attendance._id
    });

    return sendSuccess(res, `Check-in recorded successfully as ${initialStatus}`, attendance, 201);
  } catch (err) {
    // Catch unique compound index collision if concurrent calls occur
    if (err.code === 11000) {
      return sendError(res, 'Already checked in for today', 400);
    }
    next(err);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStr = getTodayDateString(now);

    // CRITICAL RULE 2: Prevent check-out without check-in
    const attendance = await Attendance.findOne({ user: userId, date: todayStr });
    if (!attendance) {
      return sendError(res, 'Cannot check out without checking in first', 400);
    }

    // CRITICAL RULE 3: Prevent duplicate checkout
    if (attendance.checkOut) {
      return sendError(res, 'Already checked out for today', 400);
    }

    attendance.checkOut = now;

    // CRITICAL RULE 6: Calculate working hours automatically
    const diffMs = now.getTime() - new Date(attendance.checkIn).getTime();
    const hoursWorked = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
    attendance.workingHours = hoursWorked;

    // Evaluate half-day / duration threshold rules
    if (hoursWorked < 2) {
      attendance.status = 'Absent'; // Worked less than 2 hours
    } else if (hoursWorked < 7.5) {
      attendance.status = 'Half Day'; // Worked between 2 and 7.5 hours
    } else {
      // If completed >= 7.5 hrs, preserve 'Late' if checked in late, else 'Present'
      if (attendance.status !== 'Late') {
        attendance.status = 'Present';
      }
    }

    if (req.body.notes) {
      attendance.notes = attendance.notes ? `${attendance.notes}; ${req.body.notes}` : req.body.notes;
    }

    await attendance.save();

    await createNotification({
      recipient: userId,
      title: 'Attendance Check-out',
      message: `Checked out at ${format(now, 'hh:mm a')}. Working hours: ${hoursWorked} hrs (${attendance.status})`,
      type: 'attendance_alert',
      relatedId: attendance._id
    });

    return sendSuccess(res, 'Check-out recorded successfully', attendance);
  } catch (err) {
    next(err);
  }
};

export const getTodayStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const todayStr = getTodayDateString();

    const attendance = await Attendance.findOne({ user: userId, date: todayStr });

    return sendSuccess(res, "Today's attendance status", {
      hasCheckedIn: !!attendance,
      hasCheckedOut: !!(attendance && attendance.checkOut),
      attendance: attendance || null
    });
  } catch (err) {
    next(err);
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { startDate, endDate, status } = req.query;

    const query = { user: userId };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    if (status) {
      query.status = status;
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'My attendance history fetched', records, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    next(err);
  }
};

export const getAllAttendance = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { employeeId, departmentId, date, startDate, endDate, status } = req.query;

    let targetUserIds = null;

    // RBAC: Manager can ONLY view attendance of their assigned team members
    if (req.user.role === 'manager') {
      const team = await User.find({ reportingManager: req.user._id }).select('_id');
      const teamIds = team.map(t => t._id.toString());
      // Also allow manager to see their own attendance
      teamIds.push(req.user._id.toString());

      if (employeeId) {
        if (!teamIds.includes(employeeId.toString())) {
          return sendError(res, 'Access denied: Selected employee is not in your assigned team.', 403);
        }
        targetUserIds = [employeeId];
      } else {
        targetUserIds = teamIds;
      }
    } else if (employeeId) {
      targetUserIds = [employeeId];
    } else if (departmentId) {
      const deptUsers = await User.find({ department: departmentId }).select('_id');
      targetUserIds = deptUsers.map(u => u._id);
    }

    const query = {};

    if (targetUserIds) {
      query.user = { $in: targetUserIds };
    }

    if (date) {
      query.date = date;
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    if (status) {
      query.status = status;
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate({
        path: 'user',
        select: 'name email designation department',
        populate: { path: 'department', select: 'name' }
      })
      .sort({ date: -1, checkIn: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Attendance records fetched successfully', records, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    next(err);
  }
};
