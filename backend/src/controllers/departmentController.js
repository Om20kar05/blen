import Department from '../models/Department.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find()
      .populate('manager', 'name email role')
      .sort({ name: 1 });

    // Include headcount count per department
    const deptsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const count = await User.countDocuments({ department: dept._id, status: 'active' });
        return {
          ...dept.toObject(),
          employeeCount: count
        };
      })
    );

    return sendSuccess(res, 'Departments retrieved successfully', deptsWithCount);
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, description, managerId } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 'Department name is required', 400);
    }

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return sendError(res, 'A department with this name already exists', 409);
    }

    const department = await Department.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      manager: managerId || undefined
    });

    const populated = await Department.findById(department._id).populate('manager', 'name email');
    return sendSuccess(res, 'Department created successfully', populated, 201);
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { name, description, managerId, isActive } = req.body;

    const department = await Department.findById(req.params.id);
    if (!department) {
      return sendError(res, 'Department not found', 404);
    }

    if (name) department.name = name.trim();
    if (description !== undefined) department.description = description.trim();
    if (managerId !== undefined) department.manager = managerId || null;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    const populated = await Department.findById(department._id).populate('manager', 'name email');
    return sendSuccess(res, 'Department updated successfully', populated);
  } catch (err) {
    next(err);
  }
};
