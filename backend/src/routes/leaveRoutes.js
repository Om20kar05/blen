import { Router } from 'express';
import {
  applyLeave,
  getMyLeaves,
  getMyBalances,
  getAllLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  cancelLeave
} from '../controllers/leaveController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Employee self-service
router.post('/', applyLeave);
router.get('/my', getMyLeaves);
router.get('/balances', getMyBalances);

// Approvals & Administrative review (Admin & Manager)
router.get('/', authorize('admin', 'manager'), getAllLeaves);
router.get('/:id', getLeaveById);
router.patch('/:id/approve', authorize('admin', 'manager'), approveLeave);
router.patch('/:id/reject', authorize('admin', 'manager'), rejectLeave);
router.patch('/:id/cancel', cancelLeave);

export default router;
