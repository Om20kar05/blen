import LeaveType from '../models/LeaveType.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getLeaveTypes = async (req, res, next) => {
  try {
    const leaveTypes = await LeaveType.find().sort({ name: 1 });
    return sendSuccess(res, 'Leave types fetched successfully', leaveTypes);
  } catch (err) {
    next(err);
  }
};

export const createLeaveType = async (req, res, next) => {
  try {
    const { name, code, description, yearlyQuota, isPaid } = req.body;

    if (!name || !code || yearlyQuota === undefined) {
      return sendError(res, 'Name, code, and yearlyQuota are required', 400);
    }

    const existing = await LeaveType.findOne({
      $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }]
    });

    if (existing) {
      return sendError(res, 'Leave type with this name or code already exists', 409);
    }

    const leaveType = await LeaveType.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description ? description.trim() : '',
      yearlyQuota: Number(yearlyQuota),
      isPaid: isPaid !== undefined ? isPaid : true,
      isActive: true
    });

    // Automatically synchronize new leave type into active employees' balances
    await User.updateMany(
      { status: 'active', 'leaveBalances.leaveType': { $ne: leaveType._id } },
      {
        $push: {
          leaveBalances: {
            leaveType: leaveType._id,
            allocated: Number(yearlyQuota),
            used: 0,
            pending: 0
          }
        }
      }
    );

    return sendSuccess(res, 'Leave type created successfully and allocated to employees', leaveType, 201);
  } catch (err) {
    next(err);
  }
};

export const updateLeaveType = async (req, res, next) => {
  try {
    const { name, description, yearlyQuota, isPaid, isActive } = req.body;

    const leaveType = await LeaveType.findById(req.params.id);
    if (!leaveType) {
      return sendError(res, 'Leave type not found', 404);
    }

    if (name) leaveType.name = name.trim();
    if (description !== undefined) leaveType.description = description.trim();
    if (yearlyQuota !== undefined) leaveType.yearlyQuota = Number(yearlyQuota);
    if (isPaid !== undefined) leaveType.isPaid = isPaid;
    if (isActive !== undefined) leaveType.isActive = isActive;

    await leaveType.save();

    return sendSuccess(res, 'Leave type updated successfully', leaveType);
  } catch (err) {
    next(err);
  }
};

export const toggleLeaveTypeStatus = async (req, res, next) => {
  try {
    const leaveType = await LeaveType.findById(req.params.id);
    if (!leaveType) {
      return sendError(res, 'Leave type not found', 404);
    }

    leaveType.isActive = !leaveType.isActive;
    await leaveType.save();

    return sendSuccess(
      res,
      `Leave type ${leaveType.isActive ? 'activated' : 'deactivated'} successfully`,
      leaveType
    );
  } catch (err) {
    next(err);
  }
};
