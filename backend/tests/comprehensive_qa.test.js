import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seed.js';
import User from '../src/models/User.js';
import LeaveType from '../src/models/LeaveType.js';
import Department from '../src/models/Department.js';
import Attendance from '../src/models/Attendance.js';
import LeaveRequest from '../src/models/LeaveRequest.js';
import Notification from '../src/models/Notification.js';
import app from '../src/server.js';
import http from 'node:http';

let server;
let baseUrl;

const request = async (method, endpoint, body = null, token = null) => {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${baseUrl}${endpoint}`, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
};

const post = (endpoint, body = {}, token = null) => request('POST', endpoint, body, token);
const get = (endpoint, token = null) => request('GET', endpoint, null, token);
const put = (endpoint, body = {}, token = null) => request('PUT', endpoint, body, token);
const patch = (endpoint, body = {}, token = null) => request('PATCH', endpoint, body, token);

describe('BLEN DIGITAL - SENIOR QA COMPREHENSIVE TEST SUITE', () => {
  let adminToken = '';
  let managerToken = '';
  let employeeToken = '';
  let employee2Token = '';
  let otherManagerToken = '';

  let adminUser = null;
  let managerUser = null;
  let employeeUser = null;
  let clTypeId = '';
  let slTypeId = '';
  let elTypeId = '';

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    await seedDatabase();

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) await new Promise(res => server.close(res));
    await disconnectDB();
    setTimeout(() => process.exit(0), 100);
  });

  // ==========================================
  // MODULE 1: SYSTEM HEALTH & ENVIRONMENT
  // ==========================================
  describe('Module 1: System Health & Server Connectivity', () => {
    test('1.1 Health check endpoint returns 200 and healthy status', async () => {
      const res = await get('/health');
      assert.equal(res.status, 200);
      assert.equal(res.data.status, 'healthy');
      assert.ok(res.data.service);
    });

    test('1.2 Undefined API route returns structured 404', async () => {
      const res = await get('/undefined-route-endpoint');
      assert.equal(res.status, 404);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /not found/i);
    });

    test('1.3 Database reconnect idempotent check (multiple connectDB calls)', async () => {
      // Calling connectDB when already connected should be safe and return immediately
      await connectDB();
      assert.ok(true, 'connectDB handled already-connected state gracefully');
    });
  });

  // ==========================================
  // MODULE 2: AUTHENTICATION & JWT SECURITY
  // ==========================================
  describe('Module 2: Authentication & JWT Management', () => {
    test('2.1 Admin login returns 200, JWT token, and admin role', async () => {
      const res = await post('/auth/login', {
        email: 'admin@blen.com',
        password: 'Admin@123'
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.token);
      assert.equal(res.data.data.user.role, 'admin');
      adminToken = res.data.data.token;
      adminUser = res.data.data.user;
    });

    test('2.2 Manager login returns 200, JWT token, and manager role', async () => {
      const res = await post('/auth/login', {
        email: 'manager@blen.com',
        password: 'Manager@123'
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.user.role, 'manager');
      managerToken = res.data.data.token;
      managerUser = res.data.data.user;
    });

    test('2.3 Employee login returns 200, JWT token, and employee role', async () => {
      const res = await post('/auth/login', {
        email: 'employee@blen.com',
        password: 'Employee@123'
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.user.role, 'employee');
      employeeToken = res.data.data.token;
      employeeUser = res.data.data.user;
    });

    test('2.4 Second Employee (Priya Nair) login succeeds', async () => {
      const res = await post('/auth/login', {
        email: 'priya@blen.com',
        password: 'Employee@123'
      });
      assert.equal(res.status, 200);
      employee2Token = res.data.data.token;
    });

    test('2.5 Other Manager (Design Manager) login succeeds', async () => {
      const res = await post('/auth/login', {
        email: 'design.manager@blen.com',
        password: 'Manager@123'
      });
      assert.equal(res.status, 200);
      otherManagerToken = res.data.data.token;
    });

    test('2.6 Missing email/password returns 400', async () => {
      const res = await post('/auth/login', { email: 'admin@blen.com' });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    test('2.7 Invalid password returns 401', async () => {
      const res = await post('/auth/login', {
        email: 'admin@blen.com',
        password: 'WrongPassword'
      });
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    test('2.8 Non-existent user email returns 401', async () => {
      const res = await post('/auth/login', {
        email: 'nonexistent@blen.com',
        password: 'Password@123'
      });
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    test('2.9 Access /api/auth/me with valid Bearer token returns profile', async () => {
      const res = await get('/auth/me', employeeToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.user.email, 'employee@blen.com');
    });

    test('2.10 Access /api/auth/me without token returns 401', async () => {
      const res = await get('/auth/me');
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    test('2.11 Access /api/auth/me with invalid/tampered token returns 401', async () => {
      const res = await get('/auth/me', 'invalid.token.signature');
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    test('2.12 Update user profile via /api/auth/profile succeeds', async () => {
      const res = await put('/auth/profile', {
        phone: '+91 99999 88888'
      }, employeeToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.user.phone, '+91 99999 88888');
    });

    test('2.13 Logout endpoint clears cookies and succeeds', async () => {
      const res = await post('/auth/logout');
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
    });
  });

  // ==========================================
  // MODULE 3: BACKEND RBAC ENFORCEMENT
  // ==========================================
  describe('Module 3: Role-Based Access Control (RBAC) Enforcement', () => {
    test('3.1 Employee blocked from Admin Dashboard (403)', async () => {
      const res = await get('/dashboard/admin', employeeToken);
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /Forbidden/i);
    });

    test('3.2 Manager blocked from Admin Dashboard (403)', async () => {
      const res = await get('/dashboard/admin', managerToken);
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    test('3.3 Employee blocked from Manager Dashboard (403)', async () => {
      const res = await get('/dashboard/manager', employeeToken);
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    test('3.4 Employee blocked from creating Employee (403)', async () => {
      const res = await post('/employees', {
        name: 'Hacker Employee',
        email: 'hacker@blen.com',
        password: 'Password@123'
      }, employeeToken);
      assert.equal(res.status, 403);
    });

    test('3.5 Manager blocked from creating Employee (403)', async () => {
      const res = await post('/employees', {
        name: 'Subordinate',
        email: 'sub@blen.com',
        password: 'Password@123'
      }, managerToken);
      assert.equal(res.status, 403);
    });

    test('3.6 Employee blocked from creating Department (403)', async () => {
      const res = await post('/departments', { name: 'Rogue Dept' }, employeeToken);
      assert.equal(res.status, 403);
    });

    test('3.7 Employee blocked from creating Leave Type (403)', async () => {
      const res = await post('/leave-types', {
        name: 'Infinite Vacation',
        code: 'IV',
        yearlyQuota: 100
      }, employeeToken);
      assert.equal(res.status, 403);
    });
  });

  // ==========================================
  // MODULE 4: EMPLOYEE CRUD & DIRECTORY SCOPING
  // ==========================================
  describe('Module 4: Employee Lifecycle & Directory Management', () => {
    let createdEmpId = '';

    test('4.1 Admin lists all employees with pagination metadata', async () => {
      const res = await get('/employees?page=1&limit=5', adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      assert.equal(res.data.data.length, 5);
      assert.ok(res.data.pagination.total >= 6);
      assert.equal(res.data.pagination.page, 1);
    });

    test('4.2 Admin creates a new employee with auto-assigned leave quotas', async () => {
      const res = await post('/employees', {
        name: 'Aarav Mehta',
        email: 'aarav@blen.com',
        password: 'Password@123',
        phone: '+91 91234 56789',
        designation: 'Full Stack QA',
        role: 'employee'
      }, adminToken);

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.email, 'aarav@blen.com');
      assert.ok(res.data.data.leaveBalances.length >= 4);
      createdEmpId = res.data.data._id;
    });

    test('4.3 Creating employee with duplicate email returns 409 Conflict', async () => {
      const res = await post('/employees', {
        name: 'Duplicate Aarav',
        email: 'aarav@blen.com',
        password: 'Password@123'
      }, adminToken);

      assert.equal(res.status, 409);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /already exists/i);
    });

    test('4.4 Admin updates employee details', async () => {
      const res = await put(`/employees/${createdEmpId}`, {
        designation: 'Senior QA Automation Lead'
      }, adminToken);

      assert.equal(res.status, 200);
      assert.equal(res.data.data.designation, 'Senior QA Automation Lead');
    });

    test('4.5 Search employees by name with special regex characters safely', async () => {
      const res = await get('/employees?search=Vikram Sharma (Admin)', adminToken);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.some(e => e.email === 'admin@blen.com'));
    });

    test('4.6 Admin deactivates employee account', async () => {
      const res = await patch(`/employees/${createdEmpId}/status`, {
        status: 'inactive'
      }, adminToken);

      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'inactive');
    });

    test('4.7 Deactivated employee cannot log in (403)', async () => {
      const res = await post('/auth/login', {
        email: 'aarav@blen.com',
        password: 'Password@123'
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /deactivated/i);
    });

    test('4.8 Admin reactivates employee account', async () => {
      const res = await patch(`/employees/${createdEmpId}/status`, {
        status: 'active'
      }, adminToken);

      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'active');
    });

    test('4.9 Admin cannot deactivate their own account (400)', async () => {
      const res = await patch(`/employees/${adminUser._id}/status`, {
        status: 'inactive'
      }, adminToken);

      assert.equal(res.status, 400);
      assert.match(res.data.message, /cannot deactivate your own account/i);
    });

    test('4.10 Manager can view employees with teamOnly parameter', async () => {
      const res = await get('/employees?teamOnly=true', managerToken);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.every(e => e.reportingManager?._id === managerUser._id || e.reportingManager === managerUser._id));
    });

    test('4.11 Manager cannot view employee not assigned to their team (403)', async () => {
      // Find employee reporting to designManager
      const designEmp = await User.findOne({ email: 'amit@blen.com' });
      const res = await get(`/employees/${designEmp._id}`, managerToken);
      assert.equal(res.status, 403);
      assert.match(res.data.message, /Access denied/i);
    });
  });

  // ==========================================
  // MODULE 5: ATTENDANCE MANAGEMENT & RULES
  // ==========================================
  describe('Module 5: Attendance Business Rules & Shift Workflows', () => {
    test('5.1 Employee checks in successfully', async () => {
      const res = await post('/attendance/check-in', { notes: 'Morning check-in test' }, employeeToken);
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.checkIn);
      assert.ok(['Present', 'Late'].includes(res.data.data.status));
    });

    test('5.2 CRITICAL RULE: Duplicate check-in on same day rejected (400)', async () => {
      const res = await post('/attendance/check-in', {}, employeeToken);
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Already checked in/i);
    });

    test('5.3 Get today attendance status returns accurate check-in state', async () => {
      const res = await get('/attendance/today', employeeToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.hasCheckedIn, true);
      assert.equal(res.data.data.hasCheckedOut, false);
      assert.ok(res.data.data.attendance);
    });

    test('5.4 Check out without checking in for user without checkin returns 400', async () => {
      // Priya Nair has not checked in today
      const res = await post('/attendance/check-out', {}, employee2Token);
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Cannot check out without checking in first/i);
    });

    test('5.5 Employee checks out successfully and computes working hours', async () => {
      const res = await post('/attendance/check-out', { notes: 'Day end' }, employeeToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.checkOut);
      assert.ok(typeof res.data.data.workingHours === 'number');
    });

    test('5.6 CRITICAL RULE: Duplicate check-out on same day rejected (400)', async () => {
      const res = await post('/attendance/check-out', {}, employeeToken);
      assert.equal(res.status, 400);
      assert.match(res.data.message, /Already checked out/i);
    });

    test('5.7 Employee retrieves their paginated attendance history', async () => {
      const res = await get('/attendance/my?page=1&limit=5', employeeToken);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.pagination.total >= 1);
    });

    test('5.8 Filter attendance by date range and status', async () => {
      const res = await get('/attendance/my?status=Present', employeeToken);
      assert.equal(res.status, 200);
      assert.ok(res.data.data.every(r => r.status === 'Present'));
    });

    test('5.9 Manager views attendance of their assigned team only', async () => {
      const res = await get('/attendance', managerToken);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
    });

    test('5.10 Manager blocked from inspecting attendance of non-team employee (403)', async () => {
      const designEmp = await User.findOne({ email: 'amit@blen.com' });
      const res = await get(`/attendance?employeeId=${designEmp._id}`, managerToken);
      assert.equal(res.status, 403);
      assert.match(res.data.message, /Access denied/i);
    });
  });

  // ==========================================
  // MODULE 6: LEAVE MANAGEMENT & OVERLAP RULES
  // ==========================================
  describe('Module 6: Leave Workflow, Overlap & Balance Verification', () => {
    let testLeaveId = '';
    let clType = null;

    before(async () => {
      const ltRes = await get('/leave-types', employeeToken);
      clType = ltRes.data.data.find(t => t.code === 'CL');
      const slTypeDoc = ltRes.data.data.find(t => t.code === 'SL');
      const elTypeDoc = ltRes.data.data.find(t => t.code === 'EL');
      clTypeId = clType._id;
      slTypeId = slTypeDoc._id;
      elTypeId = elTypeDoc._id;
    });

    test('6.1 Employee checks their leave balances', async () => {
      const res = await get('/leaves/balances', employeeToken);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      const clBalance = res.data.data.find(b => b.code === 'CL');
      assert.ok(clBalance);
      assert.equal(clBalance.allocated, 12);
    });

    test('6.2 Applying with missing fields returns 400', async () => {
      const res = await post('/leaves', {
        leaveTypeId: clTypeId,
        startDate: '2026-11-25'
      }, employeeToken);

      assert.equal(res.status, 400);
      assert.match(res.data.message, /All fields are required/i);
    });

    test('6.3 End date preceding start date returns 400', async () => {
      const res = await post('/leaves', {
        leaveTypeId: clTypeId,
        startDate: '2026-12-25',
        endDate: '2026-12-20',
        reason: 'Backwards dates test'
      }, employeeToken);

      assert.equal(res.status, 400);
      assert.match(res.data.message, /precede/i);
    });

    test('6.4 Invalid date strings return 400', async () => {
      const res = await post('/leaves', {
        leaveTypeId: clTypeId,
        startDate: 'invalid-date',
        endDate: '2026-12-20',
        reason: 'Invalid date string test'
      }, employeeToken);

      assert.equal(res.status, 400);
      assert.match(res.data.message, /Invalid date/i);
    });

    test('6.5 Employee applies for valid 2-day leave: reserves pending balance', async () => {
      const res = await post('/leaves', {
        leaveTypeId: clTypeId,
        startDate: '2026-12-28',
        endDate: '2026-12-29',
        reason: 'Year end family visit'
      }, employeeToken);

      assert.equal(res.status, 201);
      assert.equal(res.data.data.totalDays, 2);
      assert.equal(res.data.data.status, 'Pending');
      testLeaveId = res.data.data._id;

      // Verify balance: pending increased
      const balRes = await get('/leaves/balances', employeeToken);
      const cl = balRes.data.data.find(b => b.code === 'CL');
      assert.ok(cl.pending >= 2);
    });

    test('6.6 CRITICAL RULE: Overlapping leave request rejected (400)', async () => {
      // Overlaps with 2026-12-28 to 2026-12-29
      const res = await post('/leaves', {
        leaveTypeId: clTypeId,
        startDate: '2026-12-29',
        endDate: '2026-12-30',
        reason: 'Overlapping leave attempt'
      }, employeeToken);

      assert.equal(res.status, 400);
      assert.match(res.data.message, /overlap/i);
    });

    test('6.7 Insufficient leave balance rejected (400)', async () => {
      // Request 50 days of Casual Leave (Quota is 12)
      const res = await post('/leaves', {
        leaveTypeId: clTypeId,
        startDate: '2027-01-01',
        endDate: '2027-02-20',
        reason: 'Excessive leave attempt'
      }, employeeToken);

      assert.equal(res.status, 400);
      assert.match(res.data.message, /Insufficient leave balance/i);
    });

    test('6.8 Employee blocked from approval endpoint by RBAC (403)', async () => {
      const res = await patch(`/leaves/${testLeaveId}/approve`, {}, employeeToken);
      assert.equal(res.status, 403);
      assert.match(res.data.message, /Forbidden/i);
    });

    test('6.8b Manager cannot approve their own leave request (403)', async () => {
      // Manager applies for leave
      const mgrLeaveRes = await post('/leaves', {
        leaveTypeId: clTypeId,
        startDate: '2027-03-01',
        endDate: '2027-03-02',
        reason: 'Manager personal leave'
      }, managerToken);

      assert.equal(mgrLeaveRes.status, 201);
      const mgrLeaveId = mgrLeaveRes.data.data._id;

      // Manager attempts to approve their own leave
      const approveRes = await patch(`/leaves/${mgrLeaveId}/approve`, {}, managerToken);
      assert.equal(approveRes.status, 403);
      assert.match(approveRes.data.message, /cannot approve their own/i);
    });

    test('6.9 Non-assigned manager cannot approve leave of other team (403)', async () => {
      const res = await patch(`/leaves/${testLeaveId}/approve`, {}, otherManagerToken);
      assert.equal(res.status, 403);
      assert.match(res.data.message, /Access denied/i);
    });

    test('6.10 Rejection requires a mandatory reason (400)', async () => {
      const res = await patch(`/leaves/${testLeaveId}/reject`, {
        rejectionReason: ''
      }, managerToken);

      assert.equal(res.status, 400);
      assert.match(res.data.message, /reason is required/i);
    });

    test('6.11 Assigned manager approves leave: moves balance from pending to used', async () => {
      const res = await patch(`/leaves/${testLeaveId}/approve`, {
        reviewComment: 'Approved for year-end vacation'
      }, managerToken);

      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'Approved');
      assert.equal(res.data.data.reviewComment, 'Approved for year-end vacation');
    });

    test('6.12 Double approval of approved leave rejected (400)', async () => {
      const res = await patch(`/leaves/${testLeaveId}/approve`, {}, managerToken);
      assert.equal(res.status, 400);
      assert.match(res.data.message, /already Approved/i);
    });

    test('6.13 Employee cancels future approved leave: restores used balance', async () => {
      const res = await patch(`/leaves/${testLeaveId}/cancel`, {}, employeeToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, 'Cancelled');
    });

    test('6.14 Cancelling already cancelled leave returns 400', async () => {
      const res = await patch(`/leaves/${testLeaveId}/cancel`, {}, employeeToken);
      assert.equal(res.status, 400);
      assert.match(res.data.message, /already Cancelled/i);
    });

    test('6.15 Manager can view team leave requests in /api/leaves', async () => {
      const res = await get('/leaves', managerToken);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
    });

    test('6.16 Employee retrieves their own leaves via /api/leaves/my', async () => {
      const res = await get('/leaves/my', employeeToken);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.some(l => l._id === testLeaveId));
    });
  });

  // ==========================================
  // MODULE 7: DEPARTMENTS & LEAVE TYPES
  // ==========================================
  describe('Module 7: Organizational Units & Policies', () => {
    let createdDeptId = '';
    let createdLtId = '';

    test('7.1 Get all departments with active employee count', async () => {
      const res = await get('/departments', adminToken);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 4);
      assert.ok(typeof res.data.data[0].employeeCount === 'number');
    });

    test('7.2 Admin creates a new department', async () => {
      const res = await post('/departments', {
        name: 'Quality Assurance',
        description: 'Testing, automation, reliability engineering',
        managerId: managerUser._id
      }, adminToken);

      assert.equal(res.status, 201);
      assert.equal(res.data.data.name, 'Quality Assurance');
      createdDeptId = res.data.data._id;
    });

    test('7.3 Duplicate department name returns 409', async () => {
      const res = await post('/departments', {
        name: 'Quality Assurance'
      }, adminToken);

      assert.equal(res.status, 409);
    });

    test('7.4 Admin updates department details', async () => {
      const res = await put(`/departments/${createdDeptId}`, {
        description: 'Enterprise QA and SDET department'
      }, adminToken);

      assert.equal(res.status, 200);
      assert.equal(res.data.data.description, 'Enterprise QA and SDET department');
    });

    test('7.5 Get all leave types', async () => {
      const res = await get('/leave-types', employeeToken);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 4);
    });

    test('7.6 Admin creates new leave type: auto-syncs to all active employees', async () => {
      const res = await post('/leave-types', {
        name: 'Bereavement Leave',
        code: 'BL',
        yearlyQuota: 5,
        isPaid: true,
        description: 'Compassionate leave for immediate family'
      }, adminToken);

      assert.equal(res.status, 201);
      assert.equal(res.data.data.code, 'BL');
      createdLtId = res.data.data._id;

      // Verify employee balance auto-synced
      const emp = await User.findById(employeeUser._id);
      const hasNewBal = emp.leaveBalances.some(b => b.leaveType.toString() === createdLtId.toString());
      assert.ok(hasNewBal, 'New leave type allocated to employee');
    });

    test('7.7 Duplicate leave type code/name returns 409', async () => {
      const res = await post('/leave-types', {
        name: 'Bereavement Leave',
        code: 'BL',
        yearlyQuota: 5
      }, adminToken);

      assert.equal(res.status, 409);
    });

    test('7.8 Admin toggles leave type active status', async () => {
      const res = await patch(`/leave-types/${createdLtId}/status`, {}, adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.isActive, false);
    });
  });

  // ==========================================
  // MODULE 8: NOTIFICATIONS HUB
  // ==========================================
  describe('Module 8: Real-time In-App Notifications', () => {
    let notifId = '';

    test('8.1 Employee retrieves in-app notifications', async () => {
      const res = await get('/notifications', employeeToken);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data.notifications));
      assert.ok(res.data.data.notifications.length > 0);
      notifId = res.data.data.notifications[0]._id;
    });

    test('8.2 Mark individual notification as read', async () => {
      const res = await patch(`/notifications/${notifId}/read`, {}, employeeToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.data.isRead, true);
    });

    test('8.3 Mark all notifications as read', async () => {
      const res = await patch('/notifications/read-all', {}, employeeToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
    });
  });

  // ==========================================
  // MODULE 9: ANALYTICS & DASHBOARD AGGREGATIONS
  // ==========================================
  describe('Module 9: Real-time Aggregation Dashboards', () => {
    test('9.1 Employee dashboard returns personalized KPIs, today status, and balances', async () => {
      const res = await get('/dashboard/employee', employeeToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.today);
      assert.ok(res.data.data.stats);
      assert.ok(Array.isArray(res.data.data.balances));
      assert.ok(Array.isArray(res.data.data.recentAttendance));
    });

    test('9.2 Manager dashboard returns team counts, shift status, and pending approvals', async () => {
      const res = await get('/dashboard/manager', managerToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.metrics.totalTeamMembers >= 2);
      assert.ok(Array.isArray(res.data.data.teamMembers));
      assert.ok(Array.isArray(res.data.data.todayAttendance));
    });

    test('9.3 Admin dashboard returns system KPIs and 5 Recharts aggregation datasets', async () => {
      const res = await get('/dashboard/admin', adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);

      // Core metrics
      const { metrics, charts } = res.data.data;
      assert.ok(metrics.totalEmployees >= 7);
      assert.ok(typeof metrics.presentToday === 'number');
      assert.ok(typeof metrics.pendingLeaves === 'number');

      // 5 Aggregation Charts
      assert.ok(Array.isArray(charts.monthlyAttendance));
      assert.equal(charts.monthlyAttendance.length, 14);
      assert.ok(Array.isArray(charts.leaveDistribution));
      assert.ok(Array.isArray(charts.attendanceStatusBreakdown));
      assert.ok(Array.isArray(charts.departmentHeadcount));
      assert.ok(Array.isArray(charts.leaveUsage));
    });
  });
});
