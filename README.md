# BLEN DIGITAL – Employee Leave & Attendance Management System

[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

An enterprise-grade, production-ready Full-Stack MERN (MongoDB, Express.js, React.js, Node.js) Human Resources Software-as-a-Service (SaaS) application developed for **BLEN DIGITAL**.

Engineered with strict backend **Role-Based Access Control (RBAC)**, robust transactional attendance tracking with late and half-day duration rules, mathematical leave overlap prevention, dynamic database-driven leave policies, and real-time MongoDB aggregation analytics visualizations.

---

## 1. Project Overview

BLEN DIGITAL requires an HR system that streamlines daily employee operations while providing supervisory controls for team managers and global oversight for corporate administrators.

The application enforces a dual-tier security architecture:
1. **Frontend Experience**: Linear/Vercel-inspired minimal SaaS dashboard with responsive navigation, Lucide icons, status badges, and Recharts data visualizations.
2. **Backend Integrity**: Centralized API architecture with JWT authentication, bcrypt password hashing, express-validator validation, atomic balance calculations, and team-scoped authorization.

---

## 2. Key Features by User Role

### 👤 Employee Role (Self-Service)
- **Authentication**: Secure login, session persistence, automatic token renewal, and profile management.
- **Attendance Check-In / Check-Out**:
  - Live check-in with automatic `Present` vs. `Late` evaluation (standard shift: 09:30 AM).
  - Single daily check-in validation (blocks duplicate check-in attempts).
  - Check-out with automatic hours worked computation and half-day evaluation.
- **Personal Attendance Audit**: Paginated attendance logs filterable by date range and status (`Present`, `Late`, `Half Day`, `Absent`).
- **Leave Self-Service**:
  - Real-time leave balance overview across all active leave categories (Casual, Sick, Earned, Unpaid).
  - Leave application modal with real-time day calculation and overlap prevention.
  - Leave status tracking with reviewer notes.
  - Self-cancellation of pending or future approved requests with automatic balance rollback.
- **In-App Notifications**: Real-time alerts for leave approvals, rejections, and attendance check-in confirmations.

### 👔 Manager Role (Team Supervision)
- **Manager Dashboard**:
  - Real-time team metrics: Headcount, Present today, Late today, Absent today, Pending leave approvals.
  - Live team shift status feed for today.
  - Assigned direct reports directory.
- **Team Scoped Authorization**:
  - Strict backend enforcement: Managers can **only** inspect records of employees reporting directly to them (`reportingManager === managerId`).
- **Leave Adjudication Workflow**:
  - Review team leave applications with full employee context and reason.
  - 1-Click approval with optional reviewer comments.
  - Rejection with **mandatory business justification** recorded and delivered to the employee.
  - Prevention of self-approval (managers cannot approve their own leaves).

### 🛡️ Admin Role (Corporate Governance)
- **Executive Analytics Dashboard**:
  - High-level KPIs: Total Headcount, Active accounts, Daily presence/absence breakdown, System-wide leave counts.
  - **5 Dynamic Recharts Data Visualizations** powered by real MongoDB aggregation pipelines:
    1. *Monthly Attendance Trend* (Area chart tracking 14-day history).
    2. *Leave Request Distribution* (Donut chart by leave category).
    3. *Today's Shift Status Breakdown* (Donut chart).
    4. *Department Headcount Distribution* (Bar chart).
    5. *Annual Leave Usage vs Quota Allocation* (Grouped bar chart).
- **Employee Lifecycle Management**:
  - Add employee with automated leave balance initialization based on active quotas.
  - Edit employee details (designation, department, reporting manager, role).
  - Soft deactivation/activation toggle (`status: 'active' | 'inactive'`).
- **Department Hierarchy Management**:
  - Add and update organizational divisions with assigned department lead managers and active headcount tracking.
- **Leave Policy Management**:
  - Database-driven leave categories (no hardcoded limits).
  - Set annual quota allowances, paid/unpaid status, and policy descriptions.
  - Activate/deactivate leave policies with auto-sync to active employee balances.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, React Router v6, Axios, Recharts 2, Lucide React, Sonner |
| **Backend** | Node.js v20+, Express.js 4, REST APIs, JSON Web Tokens (JWT), bcryptjs, Morgan, Helmet, CORS |
| **Database** | MongoDB 7+, Mongoose 8 (with fallback to high-performance Embedded MongoDB for zero-config evaluation) |
| **Testing** | Node.js native test runner (`node:test`, `node:assert/strict`) |

---

## 4. Architecture & System Design

```
                     ┌────────────────────────────────────────┐
                     │          BLEN React Frontend           │
                     │  (Vite + Tailwind CSS + Lucide Icons)  │
                     └───────────────────┬────────────────────┘
                                         │ Axios + Bearer JWT
                                         ▼
                     ┌────────────────────────────────────────┐
                     │          Express REST API Gateway      │
                     │      (Helmet, CORS, Morgan, Error)     │
                     └───────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
      ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
      │   Auth Middleware   │ │   RBAC Validator    │ │   Centralized Error │
      │ (JWT / Token Verify)│ │ (Admin/Mgr/Emp Scope│ │  (Uniform Response)  │
      └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         ▼
                     ┌────────────────────────────────────────┐
                     │        Controllers & Services          │
                     │  (Auth, Attendance, Leave, Dashboards) │
                     └───────────────────┬────────────────────┘
                                         ▼
                     ┌────────────────────────────────────────┐
                     │         Mongoose Data Models           │
                     │  (User, Attendance, LeaveRequest, etc) │
                     └───────────────────┬────────────────────┘
                                         ▼
                     ┌────────────────────────────────────────┐
                     │         MongoDB Database Server        │
                     │  (Unique Indexes + Aggregation Engine) │
                     └────────────────────────────────────────┘
```

---

## 5. Folder Structure

```
blen/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection (supports Atlas & embedded memory fallback)
│   │   ├── controllers/     # Business logic controllers
│   │   │   ├── authController.js
│   │   │   ├── employeeController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── leaveController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── departmentController.js
│   │   │   ├── leaveTypeController.js
│   │   │   └── notificationController.js
│   │   ├── middleware/      # JWT auth, RBAC authorization, centralized error handler
│   │   ├── models/          # 6 Mongoose Schemas (User, Attendance, LeaveRequest, etc.)
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Notification and shared domain services
│   │   ├── utils/           # Response formatter, seed script
│   │   └── server.js        # Express app entrypoint
│   ├── tests/
│   │   └── api.test.js      # 20 integration tests for auth, attendance, leave overlap, RBAC
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # Sidebar, Header, AppLayout
│   │   │   └── ui/          # Reusable UI kit (Button, Input, Select, Modal, Card, Table, Badge, etc.)
│   │   ├── context/         # AuthContext, NotificationContext
│   │   ├── pages/
│   │   │   ├── dashboards/  # AdminDashboard, ManagerDashboard, EmployeeDashboard
│   │   │   ├── LoginPage.jsx
│   │   │   ├── AttendancePage.jsx
│   │   │   ├── LeavesPage.jsx
│   │   │   ├── EmployeesPage.jsx
│   │   │   ├── DepartmentsPage.jsx
│   │   │   ├── LeaveTypesPage.jsx
│   │   │   └── NotificationsPage.jsx
│   │   ├── routes/          # ProtectedRoute, RoleRoute
│   │   ├── services/        # Axios API client with interceptors
│   │   ├── utils/           # Styling and helper utilities
│   │   ├── App.jsx          # Route dispatcher
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── REQUIREMENTS.md          # 29-section requirement checklist & implementation matrix
├── INTERVIEW_PREP.md        # Technical interview mentor defense guide & live coding exercises
├── README.md                # Comprehensive system documentation
└── .env.example             # Template environment variables
```

---

## 6. Business Rules & Logic Integrity

### 6.1 Attendance Engine Rules
1. **Single Shift Per Day**: An employee cannot check in more than once on the same calendar date (`YYYY-MM-DD`). Enforced both at controller level and database level via `{ user: 1, date: 1 }` unique compound index.
2. **Orderly Sequence**:
   - Check-out without check-in is rejected with HTTP 400 (`"Cannot check out without checking in first"`).
   - Duplicate check-out is rejected with HTTP 400 (`"Already checked out for today"`).
3. **Late Arrival Determination**: Standard shift start time is **09:30 AM**. Check-ins recorded after 09:30 AM local time are marked `Late`; at or prior to 09:30 AM are marked `Present`.
4. **Working Hours & Half-Day Calculation**:
   - `workingHours = Math.round(((checkOutTime - checkInTime) / 3600000) * 100) / 100`.
   - Duration `< 2.0 hours`: status becomes `Absent`.
   - Duration `>= 2.0 hours` and `< 7.5 hours`: status becomes `Half Day`.
   - Duration `>= 7.5 hours`: preserves `Present` (or `Late` if arrival was late).

### 6.2 Leave Engine Rules
1. **Chronological Validity**: Start date must precede or equal end date (`startDate <= endDate`).
2. **Mathematical Overlap Prevention**: Prevents concurrent or conflicting leaves:
   $$\text{existing.startDate} \le \text{request.endDate} \quad \text{AND} \quad \text{existing.endDate} \ge \text{request.startDate}$$
   Applies against all existing records in `['Pending', 'Approved']` status.
3. **Leave Balance Integrity**:
   - When an employee applies for paid leave, available days are validated:
     $$\text{Available} = \text{Allocated} - (\text{Used} + \text{Pending})$$
   - If requested days exceed available balance, request is rejected with HTTP 400.
   - Upon submission, requested days are reserved (`pending += days`).
   - Upon approval, reserved days convert to consumed days (`pending -= days; used += days`).
   - Upon rejection, reserved days are restored (`pending -= days`).
   - Upon cancellation, balance is restored cleanly (from pending or used).
4. **Segregation of Duties & RBAC Scoping**:
   - Employees cannot approve or reject their own leave requests.
   - Managers can **only** approve/reject leave requests for their assigned team members.
   - Rejection **strictly requires** a non-empty business justification string.

---

## 7. Test Credentials & Demo Accounts

The database comes pre-seeded with multi-tier test accounts for instant evaluator review:

| Role | Email Address | Password | Permissions & Scope |
|---|---|---|---|
| **Admin** | `admin@blen.com` | `Admin@123` | Complete corporate access, all analytics, all employees, policies |
| **Manager** | `manager@blen.com` | `Manager@123` | Engineering Manager, manages direct reports (Rohan & Priya) |
| **Employee** | `employee@blen.com` | `Employee@123` | Senior Frontend Dev (reports to Ananya Iyer), self-service |

> **Evaluator Tip**: The Login screen features **1-Click Test Account buttons** that automatically populate credentials and log in with zero typing required!

---

## 8. Installation & Setup

### Prerequisites
- Node.js v18.0.0 or higher
- Git

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/your-username/blen-hr-system.git
cd blen

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 2. Environment Variables
Copy `.env.example` to `backend/.env` and `frontend/.env`:
```bash
# backend/.env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/blen_hr
JWT_SECRET=blen_digital_ultra_secure_jwt_secret_token_2026_intern_test
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173

# frontend/.env
VITE_API_URL=http://localhost:5000/api
```

> **Smart Database Fallback**: If you do not have a local MongoDB daemon running on port 27017, the backend automatically boots an **Embedded MongoDB Server** with full MongoDB aggregation and transaction capabilities. Zero manual database installation required!

### 3. Seed Database
```bash
cd backend
npm run seed
```

### 4. Run the Full Stack Application
Open two terminal tabs:

**Terminal 1 (Backend API)**:
```bash
cd backend
npm run dev
# Server listening on http://localhost:5000
```

**Terminal 2 (Frontend Client)**:
```bash
cd frontend
npm run dev
# Vite client ready at http://localhost:5173
```

---

## 9. Automated Testing

The backend includes a comprehensive automated test suite testing 20 critical business workflows:

```bash
cd backend
npm test
```

### Verified Test Suites:
- ✅ Valid login across Admin, Manager, and Employee
- ✅ Rejection of invalid credentials with HTTP 401
- ✅ Route protection and session token expiration handling
- ✅ Role-Based Access Control (Employee blocked from manager/admin endpoints)
- ✅ Manager access strictly scoped to assigned direct reports
- ✅ Attendance check-in and automatic status determination
- ✅ **CRITICAL**: Duplicate check-in prevention on same date
- ✅ Attendance check-out and automatic working hours calculation
- ✅ **CRITICAL**: Duplicate check-out prevention on same date
- ✅ Leave application with duration calculation
- ✅ **CRITICAL**: Overlapping leave request prevention algorithm
- ✅ Rejection of backwards date ranges (`endDate < startDate`)
- ✅ **CRITICAL**: Self-approval prevention for employees
- ✅ **CRITICAL**: Mandatory rejection reason enforcement
- ✅ Manager approval with balance transfer from pending to used
- ✅ **CRITICAL**: Double approval prevention on approved records
- ✅ Real-time admin dashboard MongoDB aggregation queries
- ✅ Personalized employee dashboard metrics

---

## 10. API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account with auto-allocated leave balances |
| `POST` | `/api/auth/login` | Public | Authenticate user, set cookie, and return JWT |
| `POST` | `/api/auth/logout` | Public | Clear session and cookies |
| `GET` | `/api/auth/me` | Authenticated | Fetch current user profile with department and manager |
| `PUT` | `/api/auth/profile` | Authenticated | Update personal name and phone number |

### Attendance (`/api/attendance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/attendance/check-in` | Employee | Record today's check-in (`Present` vs `Late`) |
| `POST` | `/api/attendance/check-out` | Employee | Record check-out, calculate hours and half-day status |
| `GET` | `/api/attendance/today` | Employee | Get today's check-in/out status |
| `GET` | `/api/attendance/my` | Employee | Paginated personal attendance history with date filters |
| `GET` | `/api/attendance` | Manager, Admin | Paginated team or system attendance logs with filters |

### Leave Management (`/api/leaves`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/leaves` | Employee | Submit leave request with balance and overlap checks |
| `GET` | `/api/leaves/my` | Employee | Paginated personal leave requests |
| `GET` | `/api/leaves/balances` | Employee | Active leave balances (Allocated, Used, Pending, Available) |
| `GET` | `/api/leaves` | Manager, Admin | List leave requests (team-scoped for managers) |
| `GET` | `/api/leaves/:id` | Authenticated | Get leave request details |
| `PATCH` | `/api/leaves/:id/approve` | Manager, Admin | Approve leave and convert pending balance to used |
| `PATCH` | `/api/leaves/:id/reject` | Manager, Admin | Reject leave with mandatory rejection reason |
| `PATCH` | `/api/leaves/:id/cancel` | Employee | Cancel pending/future leave and restore balance |

### Dashboards (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/employee` | Employee | Personal shift, monthly %, balances, and recent logs |
| `GET` | `/api/dashboard/manager` | Manager, Admin | Team headcount, shift feed, and pending approvals |
| `GET` | `/api/dashboard/admin` | Admin | Company KPIs and 5 Recharts MongoDB aggregations |

### Employees (`/api/employees`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/employees` | Manager, Admin | Paginated, searchable employee directory |
| `POST` | `/api/employees` | Admin | Create employee and initialize leave balances |
| `GET` | `/api/employees/:id` | Authenticated | Get employee profile details |
| `PUT` | `/api/employees/:id` | Admin | Update employee department, manager, or role |
| `PATCH` | `/api/employees/:id/status` | Admin | Soft activate or deactivate employee account |

### Policies & Departments
- `/api/leave-types`: Admin management of dynamic leave policies and annual quotas.
- `/api/departments`: Admin management of organizational divisions and leads.
- `/api/notifications`: User notification list and mark-as-read endpoints.

---

## 11. Deployment Guidelines

### Frontend Deployment (Vercel)
1. Push repository to GitHub.
2. Link project in Vercel. Set Root Directory to `frontend`.
3. Set Build Command: `npm run build`, Output Directory: `dist`.
4. Configure Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api`.

### Backend Deployment (Render / Railway)
1. Link repository in Render as Web Service. Set Root Directory to `backend`.
2. Build Command: `npm install`.
3. Start Command: `npm start`.
4. Configure Environment Variables:
   - `NODE_ENV=production`
   - `MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/blen_hr?retryWrites=true&w=majority`
   - `JWT_SECRET=production_strong_secret_key`
   - `FRONTEND_URL=https://your-frontend.vercel.app`

---

## 12. License & Author

Developed for the **BLEN DIGITAL** MERN Stack Developer Machine Evaluation.  
License: ISC
