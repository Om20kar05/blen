import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment
} from '../controllers/departmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getDepartments);
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin'), updateDepartment);

export default router;
