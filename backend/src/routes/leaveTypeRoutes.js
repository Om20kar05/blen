import { Router } from 'express';
import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  toggleLeaveTypeStatus
} from '../controllers/leaveTypeController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getLeaveTypes);
router.post('/', authorize('admin'), createLeaveType);
router.put('/:id', authorize('admin'), updateLeaveType);
router.patch('/:id/status', authorize('admin'), toggleLeaveTypeStatus);

export default router;
