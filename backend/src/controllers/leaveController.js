import LeaveRequest from '../models/LeaveRequest.js';
import LeaveType from '../models/LeaveType.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createNotification } from '../services/notificationService.js';
import { format, differenceInCalendarDays } from 'date-fns';

export const applyLeave = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { leaveTypeId, startDate, endDate, reason } = req.body;

    if (!leaveTypeId || !startDate || !endDate || !reason) {
      return sendError(res, 'All fields are required (leaveTypeId, startDate, endDate, reason)', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Business Rule 1: End date cannot precede start date
    if (end < start) {
      return sendError(res, 'End date cannot precede start date', 400);
    }

    // Calculate total days (inclusive of both start and end dates)
    const days = differenceInCalendarDays(end, start) + 1;
    if (days <= 0) {
      return sendError(res, 'Invalid leave date duration', 400);
    }

    // Verify leave type exists and is active
    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType || !leaveType.isActive) {
      return sendError(res, 'Invalid or inactive leave type selected', 400);
    }

    // Business Rule 2: Prevent overlapping leave requests
    // Existing leave in Pending or Approved status where:
    // existing.startDate <= request.endDate AND existing.endDate >= request.startDate
    const overlapping = await LeaveRequest.findOne({
      employee: userId,
      status: { $in: ['Pending', 'Approved'] },
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    if (overlapping) {
      return sendError(
        res,
        `You already have an existing ${overlapping.status} leave request from ${format(overlapping.startDate, 'yyyy-MM-dd')} to ${format(overlapping.endDate, 'yyyy-MM-dd')} that has an overlapping date range with this period.`,
        400
      );
    }

    // Business Rule 3: Check and reserve leave balance for paid leaves
    const user = await User.findById(userId);
    let userBalance = user.leaveBalances.find(b => b.leaveType.toString() === leaveTypeId.toString());

    // If leave balance entry is missing for this leave type, initialize it from yearly quota
    if (!userBalance) {
      user.leaveBalances.push({
        leaveType: leaveTypeId,
        allocated: leaveType.yearlyQuota,
        used: 0,
        pending: 0
      });
      userBalance = user.leaveBalances[user.leaveBalances.length - 1];
    }

    if (leaveType.isPaid) {
      const available = userBalance.allocated - (userBalance.used + userBalance.pending);
      if (days > available) {
        return sendError(
          res,
          `Insufficient leave balance for ${leaveType.name}. Requested: ${days} days, Available: ${Math.max(0, available)} days (Allocated: ${userBalance.allocated}, Used: ${userBalance.used}, Pending: ${userBalance.pending})`,
          400
        );
      }

      // Reserve balance in pending
      userBalance.pending += days;
      await user.save();
    }

    // Create Leave Request
    const leaveRequest = await LeaveRequest.create({
      employee: userId,
      leaveType: leaveTypeId,
      startDate: start,
      endDate: end,
      totalDays: days,
      reason: reason.trim(),
      status: 'Pending'
    });

    // Notify employee
    await createNotification({
      recipient: userId,
      title: 'Leave Application Submitted',
      message: `Your request for ${days} day(s) of ${leaveType.name} (${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}) has been submitted for approval.`,
      type: 'leave_applied',
      relatedId: leaveRequest._id
    });

    // Notify manager if assigned
    if (user.reportingManager) {
      await createNotification({
        recipient: user.reportingManager,
        title: 'New Leave Request Awaiting Approval',
        message: `${user.name} applied for ${days} day(s) of ${leaveType.name}. Reason: "${reason.substring(0, 50)}..."`,
        type: 'leave_applied',
        relatedId: leaveRequest._id
      });
    }

    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate('leaveType', 'name code yearlyQuota isPaid')
      .populate('employee', 'name email designation department');

    return sendSuccess(res, 'Leave request submitted successfully', populated, 201);
  } catch (err) {
    next(err);
  }
};

export const getMyLeaves = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { status, leaveTypeId, year } = req.query;

    const query = { employee: userId };

    if (status) {
      query.status = status;
    }

    if (leaveTypeId) {
      query.leaveType = leaveTypeId;
    }

    if (year) {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      query.startDate = { $gte: startOfYear, $lte: endOfYear };
    }

    const total = await LeaveRequest.countDocuments(query);
    const leaves = await LeaveRequest.find(query)
      .populate('leaveType', 'name code yearlyQuota isPaid')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'My leave requests fetched', leaves, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    next(err);
  }
};

export const getMyBalances = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('leaveBalances.leaveType');
    const allActiveTypes = await LeaveType.find({ isActive: true });

    // Sync any newly created leave types into user balances if not present
    let modified = false;
    for (const lt of allActiveTypes) {
      const exists = user.leaveBalances.some(b => b.leaveType && b.leaveType._id.toString() === lt._id.toString());
      if (!exists) {
        user.leaveBalances.push({
          leaveType: lt._id,
          allocated: lt.yearlyQuota,
          used: 0,
          pending: 0
        });
        modified = true;
      }
    }

    if (modified) {
      await user.save();
      await user.populate('leaveBalances.leaveType');
    }

    const formattedBalances = user.leaveBalances
      .filter(b => b.leaveType && b.leaveType.isActive)
      .map(b => {
        const available = Math.max(0, b.allocated - (b.used + b.pending));
        return {
          leaveTypeId: b.leaveType._id,
          name: b.leaveType.name,
          code: b.leaveType.code,
          isPaid: b.leaveType.isPaid,
          allocated: b.allocated,
          used: b.used,
          pending: b.pending,
          available
        };
      });

    return sendSuccess(res, 'Leave balances retrieved', formattedBalances);
  } catch (err) {
    next(err);
  }
};

export const getAllLeaves = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { status, leaveTypeId, employeeId, startDate, endDate } = req.query;

    const query = {};

    // RBAC: Manager can only view leave requests of their assigned team
    if (req.user.role === 'manager') {
      const team = await User.find({ reportingManager: req.user._id }).select('_id');
      const teamIds = team.map(t => t._id);

      if (employeeId) {
        if (!teamIds.some(id => id.toString() === employeeId.toString())) {
          return sendError(res, 'Access denied: Selected employee is not in your assigned team.', 403);
        }
        query.employee = employeeId;
      } else {
        query.employee = { $in: teamIds };
      }
    } else if (employeeId) {
      query.employee = employeeId;
    }

    if (status) {
      query.status = status;
    }

    if (leaveTypeId) {
      query.leaveType = leaveTypeId;
    }

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    const total = await LeaveRequest.countDocuments(query);
    const leaves = await LeaveRequest.find(query)
      .populate({
        path: 'employee',
        select: 'name email designation department reportingManager',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'reportingManager', select: 'name email' }
        ]
      })
      .populate('leaveType', 'name code yearlyQuota isPaid')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Leave requests retrieved successfully', leaves, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    next(err);
  }
};

export const getLeaveById = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id)
      .populate({
        path: 'employee',
        select: 'name email designation department reportingManager',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'reportingManager', select: 'name email' }
        ]
      })
      .populate('leaveType', 'name code yearlyQuota isPaid')
      .populate('reviewedBy', 'name email role');

    if (!leave) {
      return sendError(res, 'Leave request not found', 404);
    }

    // Role-based visibility check
    if (req.user.role === 'employee' && leave.employee._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied', 403);
    }

    if (req.user.role === 'manager') {
      const isSelf = leave.employee._id.toString() === req.user._id.toString();
      const isReport = leave.employee.reportingManager && leave.employee.reportingManager._id.toString() === req.user._id.toString();
      if (!isSelf && !isReport) {
        return sendError(res, 'Access denied: You can only view leave requests for your team members', 403);
      }
    }

    return sendSuccess(res, 'Leave request details retrieved', leave);
  } catch (err) {
    next(err);
  }
};

export const approveLeave = async (req, res, next) => {
  try {
    const leaveId = req.params.id;
    const { reviewComment } = req.body;

    const leave = await LeaveRequest.findById(leaveId)
      .populate('employee')
      .populate('leaveType');

    if (!leave) {
      return sendError(res, 'Leave request not found', 404);
    }

    // Business Rule 4: Employee cannot approve their own leave
    if (leave.employee._id.toString() === req.user._id.toString()) {
      return sendError(res, 'Employees cannot approve their own leave requests', 403);
    }

    // RBAC: Manager can only approve direct reports
    if (req.user.role === 'manager') {
      const reportsToManager = leave.employee.reportingManager && leave.employee.reportingManager.toString() === req.user._id.toString();
      if (!reportsToManager) {
        return sendError(res, 'Access denied: You can only approve leave requests for your assigned team members', 403);
      }
    }

    // Business Rule: Prevent double approval
    if (leave.status !== 'Pending') {
      return sendError(res, `Cannot approve a leave request that is already ${leave.status}`, 400);
    }

    // Update status
    leave.status = 'Approved';
    leave.reviewedBy = req.user._id;
    leave.reviewComment = reviewComment ? reviewComment.trim() : 'Approved';
    leave.reviewedAt = new Date();
    await leave.save();

    // Adjust employee leave balance: move from pending to used
    const employee = await User.findById(leave.employee._id);
    const balance = employee.leaveBalances.find(b => b.leaveType.toString() === leave.leaveType._id.toString());
    if (balance && leave.leaveType.isPaid) {
      balance.pending = Math.max(0, balance.pending - leave.totalDays);
      balance.used += leave.totalDays;
      await employee.save();
    }

    // Notify employee
    await createNotification({
      recipient: leave.employee._id,
      title: 'Leave Request Approved',
      message: `Your leave request for ${leave.totalDays} day(s) from ${format(leave.startDate, 'MMM dd')} to ${format(leave.endDate, 'MMM dd')} was approved by ${req.user.name}.`,
      type: 'leave_approved',
      relatedId: leave._id
    });

    const populated = await LeaveRequest.findById(leave._id)
      .populate('leaveType', 'name code')
      .populate('employee', 'name email')
      .populate('reviewedBy', 'name email role');

    return sendSuccess(res, 'Leave request approved successfully', populated);
  } catch (err) {
    next(err);
  }
};

export const rejectLeave = async (req, res, next) => {
  try {
    const leaveId = req.params.id;
    const { rejectionReason, reviewComment } = req.body;

    // Business Rule 6: Rejection requires a reason
    if (!rejectionReason || !rejectionReason.trim()) {
      return sendError(res, 'Rejection reason is required', 400);
    }

    const leave = await LeaveRequest.findById(leaveId)
      .populate('employee')
      .populate('leaveType');

    if (!leave) {
      return sendError(res, 'Leave request not found', 404);
    }

    // Business Rule 4: Employee cannot reject their own leave
    if (leave.employee._id.toString() === req.user._id.toString()) {
      return sendError(res, 'Employees cannot reject their own leave requests', 403);
    }

    // RBAC: Manager can only reject direct reports
    if (req.user.role === 'manager') {
      const reportsToManager = leave.employee.reportingManager && leave.employee.reportingManager.toString() === req.user._id.toString();
      if (!reportsToManager) {
        return sendError(res, 'Access denied: You can only reject leave requests for your assigned team members', 403);
      }
    }

    if (leave.status !== 'Pending') {
      return sendError(res, `Cannot reject a leave request that is already ${leave.status}`, 400);
    }

    leave.status = 'Rejected';
    leave.rejectionReason = rejectionReason.trim();
    leave.reviewComment = reviewComment ? reviewComment.trim() : rejectionReason.trim();
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    // Release reserved pending balance back to employee
    const employee = await User.findById(leave.employee._id);
    const balance = employee.leaveBalances.find(b => b.leaveType.toString() === leave.leaveType._id.toString());
    if (balance && leave.leaveType.isPaid) {
      balance.pending = Math.max(0, balance.pending - leave.totalDays);
      await employee.save();
    }

    // Notify employee
    await createNotification({
      recipient: leave.employee._id,
      title: 'Leave Request Rejected',
      message: `Your leave request for ${leave.totalDays} day(s) was rejected by ${req.user.name}. Reason: "${rejectionReason.trim()}"`,
      type: 'leave_rejected',
      relatedId: leave._id
    });

    const populated = await LeaveRequest.findById(leave._id)
      .populate('leaveType', 'name code')
      .populate('employee', 'name email')
      .populate('reviewedBy', 'name email role');

    return sendSuccess(res, 'Leave request rejected', populated);
  } catch (err) {
    next(err);
  }
};

export const cancelLeave = async (req, res, next) => {
  try {
    const leaveId = req.params.id;
    const leave = await LeaveRequest.findById(leaveId)
      .populate('employee')
      .populate('leaveType');

    if (!leave) {
      return sendError(res, 'Leave request not found', 404);
    }

    // Authorization: User can only cancel their own leave (or Admin can override)
    const isOwner = leave.employee._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Access denied: You can only cancel your own leave requests', 403);
    }

    // Business Rule 8: Cancellation eligibility
    if (leave.status === 'Cancelled' || leave.status === 'Rejected') {
      return sendError(res, `Leave request is already ${leave.status}`, 400);
    }

    // If Approved, check if start date is in the future
    const now = new Date();
    if (leave.status === 'Approved' && new Date(leave.startDate) <= now && !isAdmin) {
      return sendError(res, 'Cannot cancel an approved leave that has already started. Please contact your manager or HR.', 400);
    }

    const previousStatus = leave.status;
    leave.status = 'Cancelled';
    await leave.save();

    // Restore balance integrity
    const employee = await User.findById(leave.employee._id);
    const balance = employee.leaveBalances.find(b => b.leaveType.toString() === leave.leaveType._id.toString());

    if (balance && leave.leaveType.isPaid) {
      if (previousStatus === 'Pending') {
        balance.pending = Math.max(0, balance.pending - leave.totalDays);
      } else if (previousStatus === 'Approved') {
        balance.used = Math.max(0, balance.used - leave.totalDays);
      }
      await employee.save();
    }

    // Notify manager
    if (employee.reportingManager) {
      await createNotification({
        recipient: employee.reportingManager,
        title: 'Leave Request Cancelled',
        message: `${employee.name} cancelled their ${leave.leaveType.name} request for ${format(leave.startDate, 'MMM dd')} - ${format(leave.endDate, 'MMM dd')}.`,
        type: 'leave_cancelled',
        relatedId: leave._id
      });
    }

    return sendSuccess(res, 'Leave request cancelled successfully. Balances have been restored.', leave);
  } catch (err) {
    next(err);
  }
};
