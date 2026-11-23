import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavesPage } from './pages/LeavesPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { LeaveTypesPage } from './pages/LeaveTypesPage';
import { NotificationsPage } from './pages/NotificationsPage';

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/leaves" element={<LeavesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Manager and Admin Routes */}
            <Route element={<RoleRoute allowedRoles={['admin', 'manager']} />}>
              <Route path="/employees" element={<EmployeesPage />} />
            </Route>

            {/* Admin-Only Routes */}
            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/leave-types" element={<LeaveTypesPage />} />
            </Route>

            {/* Default root redirection */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
