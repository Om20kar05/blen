import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seed.js';
import app from '../src/server.js';
import http from 'node:http';

let server;
let baseUrl;

const post = async (endpoint, body = {}, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
};

const get = async (endpoint, token = null) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers
  });
  const data = await res.json();
  return { status: res.status, data };
};

const patch = async (endpoint, body = {}, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
};

describe('BLEN DIGITAL HR SaaS - Integration Test Suite', () => {
  let adminToken = '';
  let managerToken = '';
  let employeeToken = '';
  let employeeId = '';
  let clTypeId = '';

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
  // SECTION 5: AUTHENTICATION TESTS
  // ==========================================
  describe('Authentication & RBAC Security', () => {
    test('1. Valid Admin Login succeeds and returns JWT', async () => {
      const res = await post('/auth/login', {
        email: 'admin@blen.com',
        password: 'Admin@123'
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.token);
      assert.equal(res.data.data.user.role, 'admin');
      adminToken = res.data.data.token;
    });

    test('2. Valid Manager Login succeeds', async () => {
      const res = await post('/auth/login', {
        email: 'manager@blen.com',
        password: 'Manager@123'
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.user.role, 'manager');
      managerToken = res.data.data.token;
    });

    test('3. Valid Employee Login succeeds', async () => {
      const res = await post('/auth/login', {
        email: 'employee@blen.com',
        password: 'Employee@123'
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.user.role, 'employee');
      employeeToken = res.data.data.token;
      employeeId = res.data.data.user._id;
    });

    test('4. Invalid credentials rejected with 401', async () => {
      const res = await post('/auth/login', {
        email: 'admin@blen.com',
        password: 'WrongPassword!'
      });
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    test('5. Accessing protected endpoint without token returns 401', async () => {
      const res = await get('/auth/me');
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    test('6. RBAC: Employee blocked from Admin endpoints (403)', async () => {
      const res = await get('/dashboard/admin', employeeToken);
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    test('7. RBAC: Manager blocked from Admin dashboard (403)', async () => {
      const res = await get('/dashboard/admin', managerToken);
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });
  });

  // ==========================================
  // SECTION 7: ATTENDANCE MANAGEMENT TESTS
  // ==========================================
  describe('Attendance Business Rules Enforcement', () => {
    test('8. Employee checks in successfully', async () => {
      const res = await post('/attendance/check-in', { notes: 'Automated test check-in' }, employeeToken);
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.checkIn);
    });

    test('9. CRITICAL RULE: Prevent duplicate check-in on same day (400)', async () => {
      const res = await post('/attendance/check-in', {}, employeeToken);
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /Already checked in/i);
    });

    test('10. Employee checks out successfully and calculates working hours', async () => {
      const res = await post('/attendance/check-out', { notes: 'Shift completed' }, employeeToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.checkOut);
      assert.ok(typeof res.data.data.workingHours === 'number');
    });

    test('11. CRITICAL RULE: Prevent duplicate check-out on same day (400)', async () => {
      const res = await post('/attendance/check-out', {}, employeeToken);
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /Already checked out/i);
    });
  });

  // ==========================================
  // SECTION 8: LEAVE WORKFLOW & OVERLAP TESTS
  // ==========================================
  describe('Leave Management & Business Logic Integrity', () => {
    let testLeaveId = '';

    before(async () => {
      const ltRes = await get('/leave-types', employeeToken);
      const cl = ltRes.data.data.find(t => t.code === 'CL');
      clTypeId = cl._id;
    });

    test('12. Employee applies for leave with valid parameters', async () => {
      const res = await post('/leaves', {
        leaveTypeId: clTypeId,
        startDate: '2026-12-15',
        endDate: '2026-12-16',
        reason: 'Integration test medical appointment'
      }, employeeToken);

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.totalDays, 2);
      assert.equal(res.data.data.status, 'Pending');
      testLeaveId = res.data.data._id;
    });

    test('13. CRITICAL RULE: Prevent overlapping leave request (400)', async () => {
      const res = await post('/leaves', {
        leaveTypeId: clTypeId,
        startDate: '2026-12-16', // Overlaps with 2026-12-15 to 2026-12-16
        endDate: '2026-12-17',
        reason: 'Overlapping request attempt'
      }, employeeToken);

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /overlap/i);
    });

    test('14. CRITICAL RULE: End date cannot precede start date (400)', async () => {
      const res = await post('/leaves', {
        leaveTypeId: clTypeId,
        startDate: '2026-12-20',
        endDate: '2026-12-18',
        reason: 'Backwards dates'
      }, employeeToken);

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /precede/i);
    });

    test('15. CRITICAL RULE: Employee cannot approve their own leave (403)', async () => {
      const res = await patch(`/leaves/${testLeaveId}/approve`, {}, employeeToken);
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    test('16. CRITICAL RULE: Rejection requires a mandatory reason (400)', async () => {
      const res = await patch(`/leaves/${testLeaveId}/reject`, {
        rejectionReason: '' // Empty reason
      }, managerToken);

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /reason is required/i);
    });

    test('17. Manager approves assigned direct report leave request', async () => {
      const res = await patch(`/leaves/${testLeaveId}/approve`, {
        reviewComment: 'Approved via automated test'
      }, managerToken);

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, 'Approved');
    });

    test('18. CRITICAL RULE: Prevent double approval of approved leave (400)', async () => {
      const res = await patch(`/leaves/${testLeaveId}/approve`, {}, managerToken);
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /already Approved/i);
    });
  });

  // ==========================================
  // SECTION 10: ADMIN DASHBOARD & AGGREGATIONS
  // ==========================================
  describe('Admin Analytics & Aggregation Queries', () => {
    test('19. Admin dashboard returns real aggregated metrics and charts', async () => {
      const res = await get('/dashboard/admin', adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.metrics.totalEmployees >= 6);
      assert.ok(res.data.data.charts.monthlyAttendance.length > 0);
      assert.ok(Array.isArray(res.data.data.charts.departmentHeadcount));
      assert.ok(Array.isArray(res.data.data.charts.leaveUsage));
    });

    test('20. Employee dashboard returns personalized attendance & balance KPIs', async () => {
      const res = await get('/dashboard/employee', employeeToken);
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.today.hasCheckedIn, true);
      assert.equal(res.data.data.today.hasCheckedOut, true);
      assert.ok(Array.isArray(res.data.data.balances));
    });
  });
});
