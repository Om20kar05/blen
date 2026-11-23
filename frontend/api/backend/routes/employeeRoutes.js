import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus
} from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Only authenticated users can access employee routes
router.use(authenticate);

// View employees (Admin and Manager)
router.get('/', authorize('admin', 'manager'), getEmployees);
router.get('/:id', authorize('admin', 'manager', 'employee'), getEmployeeById);

// Admin-only management routes
router.post('/', authorize('admin'), createEmployee);
router.put('/:id', authorize('admin'), updateEmployee);
router.patch('/:id/status', authorize('admin'), updateEmployeeStatus);

export default router;
