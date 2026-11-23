# BLEN DIGITAL – Employee Leave & Attendance Management System
## Comprehensive System Requirements & Architectural Specification

**Document Version:** 1.0.0  
**Target Platform:** Full-Stack MERN (MongoDB, Express.js, React.js, Node.js)  
**Specification Reference:** BLEN DIGITAL 29-Section Company Specification  
**Status:** In Progress (Phase 1 Initial Analysis & Setup)

---

## 1. Executive Summary & Project Objectives
This project is an enterprise-grade HR SaaS platform engineered for **BLEN DIGITAL** to manage employee attendance, leave workflows, department organizational hierarchies, and administrative oversight. The platform strictly enforces Role-Based Access Control (RBAC) across three distinct roles:
1. **Employee**: Self-service check-in/out, personal attendance audit, leave requests, balance tracking, and request cancellation.
2. **Manager**: Team-scoped management, direct report attendance monitoring, leave approvals/rejections with mandatory rationale, and team metrics.
3. **Admin**: Global corporate oversight, employee lifecycle management (creation, updates, deactivation), manager and department assignments, leave type configuration with annual quota policies, comprehensive attendance logs, system-wide leave overrides, and real-time MongoDB aggregation analytics.

---

## 2. Requirement Checklist & Implementation Matrix (All 29 Sections)

| Section # | Section Name | Scope & Key Deliverables | Type | Status |
|---|---|---|---|---|
| **Sec 1** | Initial Analysis | 29-section breakdown, checklist, architecture, business rules, models | Mandatory | ✅ Done |
| **Sec 2** | Technology Stack | Vite, React, Tailwind CSS, Node, Express, MongoDB, Mongoose, JWT, bcrypt | Mandatory | ✅ Done |
| **Sec 3** | Professional UI Design | Linear/Vercel SaaS aesthetic, Lucide icons, responsive layout, reusable UI kit | Mandatory | ✅ Done |
| **Sec 4** | Three User Roles | Strict backend RBAC: Employee, Manager (team-scoped), Admin (full access) | Mandatory | ✅ Done |
| **Sec 5** | Authentication | JWT authentication, bcrypt hashing, protected routes, /api/auth/me, session handling | Mandatory | ✅ Done |
| **Sec 6** | Employee Dashboard | Today's check-in/out status, hours, monthly percentage, leave balance, recent requests | Mandatory | ✅ Done |
| **Sec 7** | Attendance Management | Check-in/out, auto hours calculation, duplicate prevention, late/half-day rules, history | Mandatory | ✅ Done |
| **Sec 8** | Leave Management | CL, SL, EL, Unpaid leave, date calc, overlap prevention, balance verification, approval flow | Mandatory | ✅ Done |
| **Sec 9** | Manager Dashboard | Team metrics (Present/Absent/Late), team attendance logs, leave review with reason | Mandatory | ✅ Done |
| **Sec 10** | Admin Dashboard | System stats, 5 Recharts (Monthly attendance, leave dist, status, dept, usage) | Mandatory | ✅ Done |
| **Sec 11** | Employee Management | Add, edit, view, soft deactivate, assign manager/dept/role, search, pagination | Mandatory | ✅ Done |
| **Sec 12** | Leave Type Management | Dynamic DB-driven leave types, yearly quotas, activate/deactivate | Mandatory | ✅ Done |
| **Sec 13** | Search & Filtering | Server-side query filtering across Employees, Attendance, and Leave records | Mandatory | ✅ Done |
| **Sec 14** | Pagination | Standardized pagination response (`{ success, data, pagination: { page, limit, total, totalPages } }`) | Mandatory | ✅ Done |
| **Sec 15** | Required REST APIs | Auth, Employees, Attendance, Leaves, Dashboard, Dept, LeaveType, Notification APIs | Mandatory | ✅ Done |
| **Sec 16** | Database Architecture | 6 Mongoose models (User, Attendance, LeaveRequest, LeaveType, Department, Notification) | Mandatory | ✅ Done |
| **Sec 17** | Notifications | In-app notifications for leave status changes, approval requests, attendance alerts | Mandatory | ✅ Done |
| **Sec 18** | Validation | Double-tier validation (express-validator on backend, client validation on forms) | Mandatory | ✅ Done |
| **Sec 19** | Error Handling | Centralized error handler returning uniform JSON structure | Mandatory | ✅ Done |
| **Sec 20** | Security Hardening | JWT, bcrypt, CORS, helmet, HTTP-only cookies/headers, sanitize inputs, RBAC guards | Mandatory | ✅ Done |
| **Sec 21** | Project Structure | Clean modular architecture (backend/src/controllers, services, models; frontend/src) | Mandatory | ✅ Done |
| **Sec 22** | Testing & Verification | Comprehensive test scripts covering auth, attendance, leave overlap, balance, manager scope | Mandatory | ✅ Done (20/20 Passed) |
| **Sec 23** | Code Quality | DRY, modular services, indexing, clean naming, no hardcoded stats, reusable UI | Mandatory | ✅ Done |
| **Sec 24** | Git & Version Control | Granular feature commits (`feat:`, `fix:`) following conventional commits standard | Mandatory | ✅ Done |
| **Sec 25** | README & Documentation| Complete README covering architecture, API endpoints, setup, seed, business rules | Mandatory | ✅ Done |
| **Sec 26** | Deployment Readiness | Production build scripts, environment variables template, MongoDB Atlas readiness | Mandatory | ✅ Done |
| **Sec 27** | Interview Preparation | Technical Q&A guide, schema explanation, concurrency, RBAC & business logic defense | Mandatory | ✅ Done (`INTERVIEW_PREP.md`) |
| **Sec 28** | Development Execution | Execution across Phases 1 through 7 with step-by-step verification | Mandatory | ✅ Done |
| **Sec 29** | Final Submission | Final deliverables audit, seed data verification, working full-stack demo | Mandatory | ✅ Done |

---

## 3. Mandatory vs. Optional Requirements Breakdown

### Mandatory Requirements (Core Deliverables - Zero Compromise)
1. Complete Full-Stack MERN integration (React 18/Vite + Node/Express + MongoDB/Mongoose).
2. Production-grade Authentication with JWT, bcrypt hashing (rounds=10), and route protection.
3. Strict Backend Role-Based Access Control (RBAC):
   - Admin: System-wide read/write.
   - Manager: Strictly scoped to assigned team members (`reportingManager == managerId`).
   - Employee: Strictly scoped to self (`userId == authUser._id`).
4. Real Attendance Workflow:
   - Check-in with status determination (`Present` vs `Late`).
   - Check-out with automatic duration calculation (`workingHours`).
   - Daily duplicate check-in blocking, orphan check-out blocking, duplicate check-out blocking.
   - Half-Day evaluation based on duration thresholds.
5. Robust Leave Management Workflow:
   - Dynamic Leave Types with DB-stored annual quotas.
   - Overlap validation (preventing overlapping date ranges for pending or approved leaves).
   - Real-time leave balance validation before application.
   - Manager/Admin approval and rejection (with mandatory rejection comment).
   - Balance deduction/restoration integrity (preventing double deductions or invalid restoration).
   - Self-cancellation by employees for eligible leaves with automatic balance restoration.
6. Dashboards:
   - Employee Dashboard (today's status, working hours, month attendance %, balances, pending leaves).
   - Manager Dashboard (team counts, team present/absent/late, pending approvals, team log).
   - Admin Dashboard (company KPIs, 5 dynamic Recharts charts powered by MongoDB aggregation).
7. Server-Side Pagination, Filtering, and Search.
8. Seed Script with multi-role accounts (Admin, Manager, Employee), pre-populated departments, leave types, attendance records, and leave requests.
9. Comprehensive Documentation & Interview Mentor Preparation Guide.

### Optional Bonus Features (Deferred until mandatory completion)
- Real-time WebSockets / Socket.io notifications.
- Direct PDF / CSV report export generation.
- Email dispatch (SendGrid / Nodemailer).
- Dark mode toggle.
- CI/CD workflow files.

---

## 4. Explicit Business Rules & Unspecified Assumptions

### 4.1 Attendance Business Rules
1. **Single Shift Per Calendar Day**: An employee may check in at most once per calendar day (determined in UTC/local timezone). Subsequent check-in attempts return HTTP 400 with `"Already checked in for today"`.
2. **Sequence Enforcement**: An employee cannot check out without an active check-in for the day. Checkout attempts without prior check-in return HTTP 400 with `"Cannot check out without checking in first"`.
3. **Single Checkout**: Once checked out for the day, subsequent checkouts return HTTP 400 with `"Already checked out for today"`.
4. **Late Arrival Threshold**: Standard office start time is configured as **09:30 AM**. Check-ins recorded after 09:30 AM local time are marked with status `Late`; check-ins at or before 09:30 AM are marked `Present`.
5. **Working Hours & Half-Day Rules**:
   - Working hours are computed as: `(checkOutTime - checkInTime) in milliseconds / (1000 * 60 * 60)`, rounded to 2 decimal places.
   - Working hours `< 4.0 hours`: status becomes `Half Day` (or `Absent` if `< 2 hours`).
   - Working hours `>= 4.0 hours` and `< 7.5 hours`: status becomes `Half Day`.
   - Working hours `>= 7.5 hours`: preserves `Present` (or `Late` if arrival was late).
6. **Date Filtering**: All attendance logs support filtering by `startDate`, `endDate`, `status`, `department`, and `employeeId`.

### 4.2 Leave Management Business Rules
1. **Date Validity**: `startDate <= endDate`. Start dates in the past (more than 7 days ago) can be flagged or restricted.
2. **Leave Duration Calculation**: Leave days = `(difference in days) + 1` (inclusive of start and end date). (Excludes optional weekends if working-day calculation is toggled, default: calendar days count).
3. **No Overlapping Requests**: An employee cannot apply for a leave if any existing request by that employee in statuses `['Pending', 'Approved']` overlaps with the requested `[startDate, endDate]` range. Formula:
   `existing.startDate <= new.endDate && existing.endDate >= new.startDate`.
4. **Leave Balance Integrity**:
   - Each employee maintains a balance map or references active leave allotments per `LeaveType`.
   - Applying for paid leave (Casual, Sick, Earned) requires `availableDays >= requestedDays`.
   - Upon application, the days are either held or deducted upon approval. In our robust architecture:
     - `Pending`: Balance is reserved (`pendingDays += requestedDays`).
     - `Approved`: Reserved days convert to `usedDays += requestedDays` and `pendingDays -= requestedDays`.
     - `Rejected`: Reserved days are released (`pendingDays -= requestedDays`).
     - `Cancelled`: If cancelled while `Pending`, reserved days are released. If cancelled after `Approved` (before start date), `usedDays -= requestedDays`.
5. **Approval Authority & Conflicts of Interest**:
   - Employees cannot approve or reject their own leave requests.
   - Managers can only approve/reject leave requests of employees who report directly to them (`employee.reportingManager == manager._id`).
   - Admins can approve/reject any leave request across the organization.
   - Rejection **must** include a mandatory `rejectionReason` text field.
6. **Cancellation Privileges**:
   - An employee can cancel their own leave request if the status is `Pending`.
   - An employee can cancel an `Approved` leave request if the `startDate` is in the future. Once the leave period has commenced or concluded, cancellation requires Manager or Admin authorization.

---

## 5. Database Schema & Relational Architecture

### 5.1 Models

#### 1. User
- `name`: String, required, trim
- `email`: String, required, unique, lowercase, index
- `password`: String, required (hashed with bcrypt)
- `role`: Enum `['admin', 'manager', 'employee']`, default: `'employee'`, index
- `phone`: String
- `department`: ObjectId -> `Department`, index
- `designation`: String
- `reportingManager`: ObjectId -> `User` (must have role `manager` or `admin`), index
- `joiningDate`: Date, default: `Date.now`
- `status`: Enum `['active', 'inactive']`, default: `'active'`, index
- `leaveBalances`: Array of `{ leaveType: ObjectId -> LeaveType, allocated: Number, used: Number, pending: Number }`
- `timestamps`: true

#### 2. Department
- `name`: String, required, unique, trim
- `description`: String
- `manager`: ObjectId -> `User`
- `isActive`: Boolean, default: true
- `timestamps`: true

#### 3. LeaveType
- `name`: String, required, unique (e.g., 'Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave')
- `code`: String, required, unique (e.g., 'CL', 'SL', 'EL', 'UL')
- `description`: String
- `yearlyQuota`: Number, required (e.g., 12, 10, 15, 0)
- `isPaid`: Boolean, default: true
- `isActive`: Boolean, default: true
- `timestamps`: true

#### 4. Attendance
- `user`: ObjectId -> `User`, required, index
- `date`: String (YYYY-MM-DD format for fast unique compound indexing) & Date, index
- `checkIn`: Date, required
- `checkOut`: Date
- `workingHours`: Number, default: 0
- `status`: Enum `['Present', 'Late', 'Half Day', 'Absent']`, default: `'Present'`, index
- `notes`: String
- `compound index`: `{ user: 1, date: 1 }` with `{ unique: true }`
- `timestamps`: true

#### 5. LeaveRequest
- `employee`: ObjectId -> `User`, required, index
- `leaveType`: ObjectId -> `LeaveType`, required, index
- `startDate`: Date, required
- `endDate`: Date, required
- `totalDays`: Number, required
- `reason`: String, required
- `status`: Enum `['Pending', 'Approved', 'Rejected', 'Cancelled']`, default: `'Pending'`, index
- `reviewedBy`: ObjectId -> `User`
- `reviewComment`: String
- `rejectionReason`: String
- `reviewedAt`: Date
- `appliedAt`: Date, default: `Date.now`
- `timestamps`: true

#### 6. Notification
- `recipient`: ObjectId -> `User`, required, index
- `title`: String, required
- `message`: String, required
- `type`: Enum `['leave_applied', 'leave_approved', 'leave_rejected', 'leave_cancelled', 'attendance_alert', 'system']`
- `relatedId`: ObjectId (reference to LeaveRequest or Attendance)
- `isRead`: Boolean, default: false, index
- `timestamps`: true

---

## 6. Complete REST API Specification

### Authentication
- `POST /api/auth/login`: Email and password login, returns JWT and user payload.
- `POST /api/auth/logout`: Clears session / cookie.
- `GET /api/auth/me`: Validates JWT, returns fresh user profile with populated department & manager.
- `PUT /api/auth/profile`: Update self profile information.

### Employees (Admin & Scoped Manager)
- `GET /api/employees`: Paginated, searchable (`name`, `email`), filterable by `department`, `role`, `status`.
- `POST /api/employees`: Admin only - create new employee with role, manager, department, and default leave balance.
- `GET /api/employees/:id`: Get employee details with manager, department, and leave balances.
- `PUT /api/employees/:id`: Admin only - update employee profile, department, manager, or role.
- `PATCH /api/employees/:id/status`: Admin only - activate/deactivate employee (soft deletion).

### Attendance
- `POST /api/attendance/check-in`: Authenticated employee checks in. Calculates `Present` vs `Late`. Prevents duplicates.
- `POST /api/attendance/check-out`: Authenticated employee checks out. Calculates `workingHours` and updates `status`.
- `GET /api/attendance/today`: Fetches today's check-in/out status for current user.
- `GET /api/attendance/my`: Paginated, date-filterable attendance history for authenticated user.
- `GET /api/attendance`: Admin / Manager only. Filterable by date, date-range, employee, department, status. Manager strictly scoped to team.

### Leave Management
- `POST /api/leaves`: Apply for leave. Validates non-overlap, positive balance, and valid dates.
- `GET /api/leaves/my`: Current user's leave requests with status, filterable by status & date.
- `GET /api/leaves/balances`: Current user's available, pending, and used leave balance per leave type.
- `GET /api/leaves`: List leaves. Admin sees all; Manager sees team; filterable by status, leaveType, date.
- `GET /api/leaves/:id`: Get leave request detail.
- `PATCH /api/leaves/:id/approve`: Manager/Admin approval with optional approval comments. Converts pending days to used days.
- `PATCH /api/leaves/:id/reject`: Manager/Admin rejection with mandatory `rejectionReason`. Restores reserved days.
- `PATCH /api/leaves/:id/cancel`: Employee self-cancellation of pending/future leave. Restores balance.

### Dashboards & Analytics
- `GET /api/dashboard/employee`: Real-time personal KPIs: today's status, checkin/out time, hours, month attendance %, balances, pending requests.
- `GET /api/dashboard/manager`: Real-time team KPIs: total team members, present, absent, late, pending leave approvals, team attendance feed.
- `GET /api/dashboard/admin`: Comprehensive executive KPIs + 5 aggregation chart datasets:
  1. Monthly attendance trends (30 days / 12 months)
  2. Leave distribution by leave type
  3. Today's attendance status breakdown (Pie / Donut)
  4. Department-wise headcount distribution (Bar)
  5. Leave usage vs allocation metrics

### Departments & Leave Types
- `GET /api/departments`: List active departments.
- `POST /api/departments`: Admin only - create department.
- `PUT /api/departments/:id`: Admin only - update department.
- `GET /api/leave-types`: List leave types.
- `POST /api/leave-types`: Admin only - create leave type.
- `PUT /api/leave-types/:id`: Admin only - edit leave type and quota.
- `PATCH /api/leave-types/:id/status`: Admin only - toggle active/inactive.

### Notifications
- `GET /api/notifications`: Get user's notifications.
- `PATCH /api/notifications/:id/read`: Mark single notification as read.
- `PATCH /api/notifications/read-all`: Mark all notifications as read.

---

## 7. Frontend UI/UX Architecture

- **Theme & Aesthetic**: Modern HR SaaS inspired by Linear and Vercel. Slate/Zinc neutral scales with refined indigo/violet primary accents, high contrast typography, crisp borders (`border-slate-200 dark:border-slate-800`), and subtle drop shadows.
- **Component Hierarchy**:
  - `Layouts`: `AppLayout` (collapsible responsive sidebar, top navigation bar with user dropdown and notification popover).
  - `Shared UI Kit`: `Button`, `Input`, `Select`, `Card`, `Badge`, `Modal`, `Table`, `Pagination`, `EmptyState`, `LoadingSkeleton`, `StatCard`.
  - `Contexts`: `AuthContext` (token, user, login, logout, refresh), `NotificationContext` (notifications, unread count).
  - `Guards`: `ProtectedRoute` (checks token), `RoleRoute` (checks `['admin']` or `['manager']` or `['employee']`).
  - `Pages`:
    - `/login`: Professional authentication view with one-click test credential autofill for easy evaluation.
    - `/dashboard`: Dynamically renders `AdminDashboard`, `ManagerDashboard`, or `EmployeeDashboard` based on authenticated role.
    - `/attendance`: Check-in/out widget, attendance logs, date filters.
    - `/leaves`: Leave application modal, balance overview cards, leave request management table.
    - `/employees`: (Admin/Manager) Employee directory, add employee modal, edit/deactivate controls.
    - `/leave-types`: (Admin) Annual leave quota and policy manager.
    - `/departments`: (Admin) Department organizational hierarchy manager.
    - `/notifications`: Full notification center.

---

## 8. Realistic Implementation Roadmap

- **Phase 1: Foundation & Specs**: Initial analysis, requirements document, Git repository, MERN directory scaffolding, configuration, and database connection.
- **Phase 2: Authentication & RBAC & Employee Management**: User schema, bcrypt, JWT middleware, role guards, Auth APIs, Employee CRUD, soft deactivation, Seed script.
- **Phase 3: Attendance Management Engine**: Attendance schema with unique compound index, check-in with late calculation, check-out with automatic hours computation, attendance filtering, pagination, and history APIs.
- **Phase 4: Leave Management Engine**: LeaveType & LeaveRequest schemas, leave balance tracking, overlap prevention algorithm, application API, approval/rejection with mandatory reasons, self-cancellation, and balance reconciliation.
- **Phase 5: Real-time Dashboards & MongoDB Aggregations**: Employee personal stats, Manager team metrics, Admin company analytics with 5 dynamic Recharts visualizations.
- **Phase 6: Search, Filtering, Pagination, Notifications & UI Polish**: Server-side query filters, notification engine, responsive polish, empty states, loading skeletons.
- **Phase 7: End-to-End Testing, Documentation & Interview Mentorship**: Comprehensive test suite execution, README.md with all 17 sections, .env.example, seed verification, and technical interview defense guide.
