import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveType from '../models/LeaveType.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { sendSuccess } from '../utils/response.js';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const getTodayDateString = (date = new Date()) => {
  return format(date, 'yyyy-MM-dd');
};

export const getEmployeeDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const todayStr = getTodayDateString();
    const now = new Date();

    // 1. Today's attendance
    const todayAttendance = await Attendance.findOne({ user: userId, date: todayStr });

    // 2. Current Month Attendance Percentage & Stats
    const monthStartStr = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEndStr = format(endOfMonth(now), 'yyyy-MM-dd');

    const monthlyRecords = await Attendance.find({
      user: userId,
      date: { $gte: monthStartStr, $lte: monthEndStr }
    });

    const presentDays = monthlyRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const halfDays = monthlyRecords.filter(r => r.status === 'Half Day').length;
    const totalWorkingHours = monthlyRecords.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);

    // Business assumption: Calendar elapsed working days or records count
    const daysElapsed = Math.min(now.getDate(), 22); // roughly up to standard monthly workdays
    const attendancePercentage = daysElapsed > 0 
      ? Math.min(100, Math.round(((presentDays + halfDays * 0.5) / Math.max(1, monthlyRecords.length || daysElapsed)) * 100))
      : 100;

    // 3. Available Leave Balances
    const user = await User.findById(userId).populate('leaveBalances.leaveType');
    const balances = (user.leaveBalances || [])
      .filter(b => b.leaveType && b.leaveType.isActive)
      .map(b => ({
        leaveTypeId: b.leaveType._id,
        name: b.leaveType.name,
        code: b.leaveType.code,
        isPaid: b.leaveType.isPaid,
        allocated: b.allocated,
        used: b.used,
        pending: b.pending,
        available: Math.max(0, b.allocated - (b.used + b.pending))
      }));

    // 4. Pending & Recent Leave Requests
    const pendingLeavesCount = await LeaveRequest.countDocuments({ employee: userId, status: 'Pending' });
    const recentLeaves = await LeaveRequest.find({ employee: userId })
      .populate('leaveType', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Recent Attendance Logs (last 5)
    const recentAttendance = await Attendance.find({ user: userId })
      .sort({ date: -1 })
      .limit(5);

    return sendSuccess(res, 'Employee dashboard data retrieved', {
      today: {
        hasCheckedIn: !!todayAttendance,
        hasCheckedOut: !!(todayAttendance && todayAttendance.checkOut),
        checkIn: todayAttendance ? todayAttendance.checkIn : null,
        checkOut: todayAttendance ? todayAttendance.checkOut : null,
        workingHours: todayAttendance ? todayAttendance.workingHours : 0,
        status: todayAttendance ? todayAttendance.status : 'Not Checked In'
      },
      stats: {
        monthPresentDays: presentDays,
        monthHalfDays: halfDays,
        monthTotalHours: Math.round(totalWorkingHours * 100) / 100,
        attendancePercentage,
        pendingLeavesCount
      },
      balances,
      recentLeaves,
      recentAttendance
    });
  } catch (err) {
    next(err);
  }
};

export const getManagerDashboard = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const todayStr = getTodayDateString();

    // 1. Identify team members
    const team = await User.find({ reportingManager: managerId, status: 'active' })
      .populate('department', 'name');
    const teamIds = team.map(t => t._id);

    const totalTeamMembers = teamIds.length;

    // 2. Today's attendance among team
    const teamTodayAttendance = await Attendance.find({
      user: { $in: teamIds },
      date: todayStr
    }).populate('user', 'name email designation');

    const presentCount = teamTodayAttendance.filter(a => a.status === 'Present').length;
    const lateCount = teamTodayAttendance.filter(a => a.status === 'Late').length;
    const halfDayCount = teamTodayAttendance.filter(a => a.status === 'Half Day').length;
    const absentCount = Math.max(0, totalTeamMembers - teamTodayAttendance.length);

    // 3. Pending leave requests from team
    const pendingLeavesCount = await LeaveRequest.countDocuments({
      employee: { $in: teamIds },
      status: 'Pending'
    });

    const pendingLeaveRequests = await LeaveRequest.find({
      employee: { $in: teamIds },
      status: 'Pending'
    })
      .populate('employee', 'name email designation department')
      .populate('leaveType', 'name code')
      .sort({ createdAt: -1 })
      .limit(10);

    return sendSuccess(res, 'Manager dashboard data retrieved', {
      metrics: {
        totalTeamMembers,
        presentToday: presentCount,
        lateToday: lateCount,
        halfDayToday: halfDayCount,
        absentToday: absentCount,
        pendingLeaveRequests: pendingLeavesCount
      },
      teamMembers: team,
      todayAttendance: teamTodayAttendance,
      pendingLeaveRequests
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const todayStr = getTodayDateString();

    // 1. Core KPIs
    const totalEmployees = await User.countDocuments();
    const activeEmployees = await User.countDocuments({ status: 'active' });

    const todayAttendance = await Attendance.find({ date: todayStr });
    const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
    const lateToday = todayAttendance.filter(a => a.status === 'Late').length;
    const halfDayToday = todayAttendance.filter(a => a.status === 'Half Day').length;
    const absentToday = Math.max(0, activeEmployees - todayAttendance.length);

    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });
    const approvedLeaves = await LeaveRequest.countDocuments({ status: 'Approved' });
    const rejectedLeaves = await LeaveRequest.countDocuments({ status: 'Rejected' });

    // 2. Chart 1: Monthly Attendance Trend (Last 14 - 30 days)
    const dates = [];
    for (let i = 13; i >= 0; i--) {
      dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
    }

    const rangeAttendance = await Attendance.find({
      date: { $in: dates }
    });

    const monthlyAttendanceChart = dates.map(d => {
      const dayRecords = rangeAttendance.filter(r => r.date === d);
      const dayPresent = dayRecords.filter(r => r.status === 'Present').length;
      const dayLate = dayRecords.filter(r => r.status === 'Late').length;
      const dayHalfDay = dayRecords.filter(r => r.status === 'Half Day').length;
      const dayAbsent = Math.max(0, activeEmployees - dayRecords.length);

      return {
        date: format(new Date(d + 'T00:00:00'), 'MMM dd'),
        present: dayPresent,
        late: dayLate,
        halfDay: dayHalfDay,
        absent: dayAbsent
      };
    });

    // 3. Chart 2: Leave Distribution by Type
    const leaveDistributionRaw = await LeaveRequest.aggregate([
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'leavetypes',
          localField: '_id',
          foreignField: '_id',
          as: 'leaveTypeDoc'
        }
      },
      { $unwind: '$leaveTypeDoc' },
      {
        $project: {
          name: '$leaveTypeDoc.name',
          code: '$leaveTypeDoc.code',
          value: '$count'
        }
      }
    ]);

    // 4. Chart 3: Attendance Status Breakdown Today
    const attendanceStatusBreakdown = [
      { name: 'Present', value: presentToday, color: '#10b981' },
      { name: 'Late', value: lateToday, color: '#f59e0b' },
      { name: 'Half Day', value: halfDayToday, color: '#6366f1' },
      { name: 'Absent', value: absentToday, color: '#ef4444' }
    ];

    // 5. Chart 4: Department-wise Employee Distribution
    const departmentHeadcount = await Department.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'employees'
        }
      },
      {
        $project: {
          name: 1,
          count: { $size: '$employees' }
        }
      }
    ]);

    // 6. Chart 5: Leave Usage vs Allocation
    const activeLeaveTypes = await LeaveType.find({ isActive: true });
    const allUsers = await User.find({ status: 'active' });

    const leaveUsageChart = activeLeaveTypes.map(lt => {
      let totalAllocated = 0;
      let totalUsed = 0;
      let totalPending = 0;

      for (const u of allUsers) {
        const bal = (u.leaveBalances || []).find(b => b.leaveType && b.leaveType.toString() === lt._id.toString());
        if (bal) {
          totalAllocated += bal.allocated || 0;
          totalUsed += bal.used || 0;
          totalPending += bal.pending || 0;
        }
      }

      return {
        name: lt.code || lt.name,
        fullName: lt.name,
        allocated: totalAllocated,
        used: totalUsed,
        pending: totalPending,
        available: Math.max(0, totalAllocated - (totalUsed + totalPending))
      };
    });

    return sendSuccess(res, 'Admin dashboard metrics retrieved', {
      metrics: {
        totalEmployees,
        activeEmployees,
        presentToday,
        absentToday,
        lateToday,
        halfDayToday,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves
      },
      charts: {
        monthlyAttendance: monthlyAttendanceChart,
        leaveDistribution: leaveDistributionRaw,
        attendanceStatusBreakdown,
        departmentHeadcount,
        leaveUsage: leaveUsageChart
      }
    });
  } catch (err) {
    next(err);
  }
};
