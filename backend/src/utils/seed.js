import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import LeaveType from '../models/LeaveType.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Notification from '../models/Notification.js';
import { format, subDays } from 'date-fns';

dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      LeaveType.deleteMany({}),
      Attendance.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('[Seed] Creating Leave Types...');
    const leaveTypes = await LeaveType.create([
      {
        name: 'Casual Leave',
        code: 'CL',
        description: 'For unforeseen personal matters and short leaves',
        yearlyQuota: 12,
        isPaid: true,
        isActive: true
      },
      {
        name: 'Sick Leave',
        code: 'SL',
        description: 'Medical and health related recovery leaves',
        yearlyQuota: 10,
        isPaid: true,
        isActive: true
      },
      {
        name: 'Earned Leave',
        code: 'EL',
        description: 'Privilege leaves accumulated for planned vacations',
        yearlyQuota: 15,
        isPaid: true,
        isActive: true
      },
      {
        name: 'Unpaid Leave',
        code: 'UL',
        description: 'Leave without pay for extended absence beyond quotas',
        yearlyQuota: 30,
        isPaid: false,
        isActive: true
      }
    ]);

    const clType = leaveTypes.find(lt => lt.code === 'CL');
    const slType = leaveTypes.find(lt => lt.code === 'SL');
    const elType = leaveTypes.find(lt => lt.code === 'EL');
    const ulType = leaveTypes.find(lt => lt.code === 'UL');

    console.log('[Seed] Creating Departments...');
    const departments = await Department.create([
      {
        name: 'Engineering',
        description: 'Core software engineering, fullstack and infrastructure teams',
        isActive: true
      },
      {
        name: 'Product Design',
        description: 'UI/UX design, customer journey research and design systems',
        isActive: true
      },
      {
        name: 'Human Resources',
        description: 'Talent acquisition, company culture, employee operations',
        isActive: true
      },
      {
        name: 'Marketing & Sales',
        description: 'Brand expansion, client onboarding, growth engineering',
        isActive: true
      }
    ]);

    const engDept = departments.find(d => d.name === 'Engineering');
    const designDept = departments.find(d => d.name === 'Product Design');
    const hrDept = departments.find(d => d.name === 'Human Resources');

    // Helper to build initial leave balances for a user
    const createInitialBalances = () => [
      { leaveType: clType._id, allocated: clType.yearlyQuota, used: 2, pending: 0 },
      { leaveType: slType._id, allocated: slType.yearlyQuota, used: 1, pending: 0 },
      { leaveType: elType._id, allocated: elType.yearlyQuota, used: 3, pending: 0 },
      { leaveType: ulType._id, allocated: ulType.yearlyQuota, used: 0, pending: 0 }
    ];

    console.log('[Seed] Creating Users (Admin, Managers, Employees)...');

    // 1. Admin
    const admin = await User.create({
      name: 'Vikram Sharma (Admin)',
      email: 'admin@blen.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 43210',
      department: hrDept._id,
      designation: 'Head of People & Operations',
      status: 'active',
      joiningDate: new Date('2023-01-15'),
      leaveBalances: createInitialBalances()
    });

    // 2. Engineering Manager
    const engManager = await User.create({
      name: 'Ananya Iyer (Eng Lead)',
      email: 'manager@blen.com',
      password: 'Manager@123',
      role: 'manager',
      phone: '+91 98765 43211',
      department: engDept._id,
      designation: 'Senior Engineering Manager',
      reportingManager: admin._id,
      status: 'active',
      joiningDate: new Date('2023-03-01'),
      leaveBalances: createInitialBalances()
    });

    // Assign manager to Engineering department
    engDept.manager = engManager._id;
    await engDept.save();

    // 3. Design Manager
    const designManager = await User.create({
      name: 'Rahul Verma (Design Lead)',
      email: 'design.manager@blen.com',
      password: 'Manager@123',
      role: 'manager',
      phone: '+91 98765 43212',
      department: designDept._id,
      designation: 'Lead UI/UX Architect',
      reportingManager: admin._id,
      status: 'active',
      joiningDate: new Date('2023-04-10'),
      leaveBalances: createInitialBalances()
    });

    designDept.manager = designManager._id;
    await designDept.save();

    // 4. Employee 1 (Assigned to Ananya Iyer)
    const emp1 = await User.create({
      name: 'Rohan Patil (Frontend)',
      email: 'employee@blen.com',
      password: 'Employee@123',
      role: 'employee',
      phone: '+91 98765 43213',
      department: engDept._id,
      designation: 'Senior Frontend Engineer',
      reportingManager: engManager._id,
      status: 'active',
      joiningDate: new Date('2024-01-10'),
      leaveBalances: [
        { leaveType: clType._id, allocated: 12, used: 2, pending: 1 },
        { leaveType: slType._id, allocated: 10, used: 1, pending: 0 },
        { leaveType: elType._id, allocated: 15, used: 0, pending: 0 },
        { leaveType: ulType._id, allocated: 30, used: 0, pending: 0 }
      ]
    });

    // 5. Employee 2 (Assigned to Ananya Iyer)
    const emp2 = await User.create({
      name: 'Priya Nair (Backend)',
      email: 'priya@blen.com',
      password: 'Employee@123',
      role: 'employee',
      phone: '+91 98765 43214',
      department: engDept._id,
      designation: 'Node.js Backend Engineer',
      reportingManager: engManager._id,
      status: 'active',
      joiningDate: new Date('2024-02-15'),
      leaveBalances: createInitialBalances()
    });

    // 6. Employee 3 (Assigned to Rahul Verma)
    const emp3 = await User.create({
      name: 'Amit Kulkarni (UI Designer)',
      email: 'amit@blen.com',
      password: 'Employee@123',
      role: 'employee',
      phone: '+91 98765 43215',
      department: designDept._id,
      designation: 'Product UI Designer',
      reportingManager: designManager._id,
      status: 'active',
      joiningDate: new Date('2024-03-01'),
      leaveBalances: createInitialBalances()
    });

    const allUsers = [admin, engManager, designManager, emp1, emp2, emp3];

    console.log('[Seed] Populating historical attendance for analytics...');
    const attendanceRecords = [];

    // Create realistic attendance for past 14 days
    for (let i = 13; i >= 1; i--) {
      const pastDate = subDays(new Date(), i);
      const dateStr = format(pastDate, 'yyyy-MM-dd');

      // Skip Sunday (day 0)
      if (pastDate.getDay() === 0) continue;

      for (const u of allUsers) {
        // Pseudo-random distribution: 75% Present, 15% Late, 5% Half Day, 5% Absent
        const rand = (u.name.length + i) % 10;
        let status = 'Present';
        let checkInHour = 9;
        let checkInMin = 15;
        let workingHours = 8.5;

        if (rand === 7 || rand === 8) {
          status = 'Late';
          checkInHour = 9;
          checkInMin = 48;
          workingHours = 8.0;
        } else if (rand === 9) {
          status = 'Half Day';
          checkInHour = 10;
          checkInMin = 0;
          workingHours = 4.5;
        }

        const checkIn = new Date(pastDate);
        checkIn.setHours(checkInHour, checkInMin, 0, 0);

        const checkOut = new Date(pastDate);
        checkOut.setHours(checkInHour + Math.floor(workingHours), checkInMin + 30, 0, 0);

        attendanceRecords.push({
          user: u._id,
          date: dateStr,
          checkIn,
          checkOut,
          workingHours,
          status,
          notes: status === 'Late' ? 'Traffic delay on highway' : ''
        });
      }
    }

    // Insert historical attendance
    await Attendance.insertMany(attendanceRecords);

    // Today's attendance for demo (Admin and Manager already checked in, Employee pending check-in)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayCheckInAdmin = new Date();
    todayCheckInAdmin.setHours(9, 10, 0, 0);

    const todayCheckInMgr = new Date();
    todayCheckInMgr.setHours(9, 25, 0, 0);

    await Attendance.create([
      {
        user: admin._id,
        date: todayStr,
        checkIn: todayCheckInAdmin,
        status: 'Present',
        notes: 'Office check-in'
      },
      {
        user: engManager._id,
        date: todayStr,
        checkIn: todayCheckInMgr,
        status: 'Present',
        notes: 'Engineering standup attendance'
      }
    ]);

    console.log('[Seed] Creating Leave Requests...');
    await LeaveRequest.create([
      // 1. Pending leave from emp1 (reports to engManager)
      {
        employee: emp1._id,
        leaveType: clType._id,
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        totalDays: 1,
        reason: 'Family function in hometown',
        status: 'Pending'
      },
      // 2. Pending leave from emp2 (reports to engManager)
      {
        employee: emp2._id,
        leaveType: slType._id,
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        totalDays: 2,
        reason: 'Dental appointment and recovery',
        status: 'Pending'
      },
      // 3. Approved leave in past
      {
        employee: emp1._id,
        leaveType: clType._id,
        startDate: subDays(new Date(), 10),
        endDate: subDays(new Date(), 9),
        totalDays: 2,
        reason: 'Personal urgent work',
        status: 'Approved',
        reviewedBy: engManager._id,
        reviewComment: 'Approved, project tasks handed over.',
        reviewedAt: subDays(new Date(), 11)
      },
      // 4. Rejected leave
      {
        employee: emp3._id,
        leaveType: elType._id,
        startDate: subDays(new Date(), 5),
        endDate: subDays(new Date(), 4),
        totalDays: 2,
        reason: 'Long weekend trip',
        status: 'Rejected',
        reviewedBy: designManager._id,
        rejectionReason: 'Critical sprint design review scheduled on these dates',
        reviewedAt: subDays(new Date(), 6)
      }
    ]);

    console.log('[Seed] Creating Notifications...');
    await Notification.create([
      {
        recipient: emp1._id,
        title: 'Welcome to BLEN HR',
        message: 'Welcome to BLEN DIGITAL Employee Portal. Explore your attendance and leave balances.',
        type: 'system',
        isRead: false
      },
      {
        recipient: engManager._id,
        title: 'Leave Request Pending Review',
        message: 'Rohan Patil applied for 1 day Casual Leave awaiting your approval.',
        type: 'leave_applied',
        isRead: false
      },
      {
        recipient: admin._id,
        title: 'System Initialized',
        message: 'Database seeded with default enterprise organizational units and roles.',
        type: 'system',
        isRead: true
      }
    ]);

    console.log('\n======================================================');
    console.log('       BLEN DIGITAL - DATABASE SEED COMPLETED         ');
    console.log('======================================================');
    console.log('Test Accounts:');
    console.log('  1. ADMIN:    admin@blen.com    / Admin@123');
    console.log('  2. MANAGER:  manager@blen.com  / Manager@123');
    console.log('  3. EMPLOYEE: employee@blen.com / Employee@123');
    console.log('======================================================\n');
  } catch (err) {
    console.error('[Seed] Database seeding failed:', err);
    throw err;
  }
};

// If run directly via `node src/utils/seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async () => {
      await disconnectDB();
      process.exit(1);
    });
}
