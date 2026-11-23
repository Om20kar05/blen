import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Self-service attendance for employee
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);
router.get('/my', getMyAttendance);

// Attendance review for Manager and Admin
router.get('/', authorize('admin', 'manager'), getAllAttendance);

export default router;
