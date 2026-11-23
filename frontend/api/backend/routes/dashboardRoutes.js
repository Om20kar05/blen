import { Router } from 'express';
import {
  getEmployeeDashboard,
  getManagerDashboard,
  getAdminDashboard
} from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Role-specific dashboard endpoints
router.get('/employee', getEmployeeDashboard);
router.get('/manager', authorize('manager', 'admin'), getManagerDashboard);
router.get('/admin', authorize('admin'), getAdminDashboard);

export default router;
