import User from '../models/User.js';
import LeaveType from '../models/LeaveType.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getEmployees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, department, role, status, managerOnly } = req.query;

    const query = {};

    // Role-based scoping: Managers can filter or view assigned team members
    if (req.user.role === 'manager' && req.query.teamOnly === 'true') {
      query.reportingManager = req.user._id;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    if (managerOnly === 'true') {
      query.role = { $in: ['manager', 'admin'] };
    }

    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .populate('department', 'name')
      .populate('reportingManager', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Employees fetched successfully', employees, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    next(err);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email role')
      .populate('leaveBalances.leaveType', 'name code yearlyQuota isPaid');

    if (!employee) {
      return sendError(res, 'Employee not found', 404);
    }

    // Manager authorization check: Managers can only view their own team or themselves
    if (req.user.role === 'manager') {
      const isSelf = req.user._id.toString() === employee._id.toString();
      const isReport = employee.reportingManager && employee.reportingManager._id.toString() === req.user._id.toString();
      if (!isSelf && !isReport) {
        return sendError(res, 'Access denied: You can only view employees in your assigned team.', 403);
      }
    }

    return sendSuccess(res, 'Employee retrieved successfully', employee);
  } catch (err) {
    next(err);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const { name, email, password, phone, department, designation, reportingManager, role, joiningDate } = req.body;

    // Check email uniqueness
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return sendError(res, 'An employee with this email already exists', 409);
    }

    // Automatically allocate active leave types with their yearly quotas
    const activeLeaveTypes = await LeaveType.find({ isActive: true });
    const leaveBalances = activeLeaveTypes.map(lt => ({
      leaveType: lt._id,
      allocated: lt.yearlyQuota,
      used: 0,
      pending: 0
    }));

    const newEmployee = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password || 'Blen@123',
      phone: phone ? phone.trim() : undefined,
      department: department || undefined,
      designation: designation ? designation.trim() : undefined,
      reportingManager: reportingManager || undefined,
      role: role || 'employee',
      joiningDate: joiningDate || new Date(),
      status: 'active',
      leaveBalances
    });

    const populated = await User.findById(newEmployee._id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email');

    return sendSuccess(res, 'Employee created successfully', populated, 201);
  } catch (err) {
    next(err);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const { name, phone, department, designation, reportingManager, role, joiningDate, password } = req.body;

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return sendError(res, 'Employee not found', 404);
    }

    if (name) employee.name = name.trim();
    if (phone !== undefined) employee.phone = phone.trim();
    if (department !== undefined) employee.department = department || null;
    if (designation !== undefined) employee.designation = designation.trim();
    if (reportingManager !== undefined) employee.reportingManager = reportingManager || null;
    if (role) employee.role = role;
    if (joiningDate) employee.joiningDate = joiningDate;
    if (password) employee.password = password; // Trigger pre-save hook

    await employee.save();

    const updated = await User.findById(employee._id)
      .populate('department', 'name')
      .populate('reportingManager', 'name email');

    return sendSuccess(res, 'Employee updated successfully', updated);
  } catch (err) {
    next(err);
  }
};

export const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return sendError(res, 'Status must be active or inactive', 400);
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return sendError(res, 'Employee not found', 404);
    }

    // Prevent deactivating own account
    if (req.user._id.toString() === employee._id.toString()) {
      return sendError(res, 'You cannot deactivate your own account', 400);
    }

    employee.status = status;
    await employee.save();

    return sendSuccess(res, `Employee ${status === 'active' ? 'activated' : 'deactivated'} successfully`, {
      _id: employee._id,
      name: employee.name,
      status: employee.status
    });
  } catch (err) {
    next(err);
  }
};
