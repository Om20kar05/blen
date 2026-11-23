import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment
} from '../controllers/departmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Allow public read of departments for employee registration
router.get('/', getDepartments);

// Administrative modification routes
router.use(authenticate);
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin'), updateDepartment);

export default router;
