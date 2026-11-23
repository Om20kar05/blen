import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import {
  CalendarCheck,
  Search,
  Filter,
  LogIn,
  LogOut,
  RefreshCw,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AttendancePage = () => {
  const { user } = useAuth();
  const role = user?.role || 'employee';

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState([]);

  // Self-service check-in state
  const [todayStatus, setTodayStatus] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      setTodayStatus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const endpoint = role === 'employee' ? '/attendance/my' : '/attendance';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (dateFilter) params.append('date', dateFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (deptFilter && role === 'admin') params.append('departmentId', deptFilter);

      const res = await api.get(`${endpoint}?${params.toString()}`);
      setRecords(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch attendance');
    } finally {
      setIsLoading(false);
    }
  }, [role, dateFilter, statusFilter, deptFilter]);

  const fetchDepartments = async () => {
    if (role === 'admin') {
      try {
        const res = await api.get('/departments');
        setDepartments(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchAttendance(1);
  }, [fetchAttendance]);

  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true);
      const res = await api.post('/attendance/check-in', {});
      toast.success(res.message || 'Check-in recorded!');
      await fetchTodayStatus();
      await fetchAttendance(pagination.page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsCheckingOut(true);
      const res = await api.post('/attendance/check-out', {});
      toast.success(res.message || 'Check-out recorded!');
      await fetchTodayStatus();
      await fetchAttendance(pagination.page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-600">
            Attendance Logs & Time Tracking
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            {role === 'employee' ? 'My Attendance History' : role === 'manager' ? 'Team Attendance Audit' : 'Enterprise Attendance Registry'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Standard check-in threshold: 09:30 AM (Late arrival policy). Full shift: 7.5+ hours.
          </p>
        </div>

        {/* Quick Check-In / Out Button for Employee */}
        {role === 'employee' && todayStatus && (
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
            {!todayStatus.hasCheckedIn ? (
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                isLoading={isCheckingIn}
                onClick={handleCheckIn}
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Check In Now
              </Button>
            ) : !todayStatus.hasCheckedOut ? (
              <Button
                variant="danger"
                size="sm"
                className="font-bold"
                isLoading={isCheckingOut}
                onClick={handleCheckOut}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Check Out
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <Clock className="w-4 h-4" />
                <span>Today's Shift Logged ({todayStatus.attendance?.workingHours} hrs)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Controls Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              type="date"
              label="Filter by Date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            <Select
              label="Shift Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Statuses"
              options={[
                { value: 'Present', label: 'Present' },
                { value: 'Late', label: 'Late' },
                { value: 'Half Day', label: 'Half Day' },
                { value: 'Absent', label: 'Absent' }
              ]}
            />

            {role === 'admin' && (
              <Select
                label="Department"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                placeholder="All Departments"
                options={departments.map((d) => ({
                  value: d._id,
                  label: d.name
                }))}
              />
            )}

            <div className="flex items-end gap-2">
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() => {
                  setDateFilter('');
                  setStatusFilter('');
                  setDeptFilter('');
                }}
              >
                Reset Filters
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => fetchAttendance(1)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      {isLoading ? (
        <LoadingSkeleton className="h-96 w-full rounded-xl" />
      ) : records.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No Attendance Records Found"
          description="No attendance entries found matching the specified date or status criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setDateFilter('');
            setStatusFilter('');
            setDeptFilter('');
          }}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                {role !== 'employee' && <TableHead>Employee</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r._id}>
                  {role !== 'employee' && (
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-900">{r.user?.name || 'Employee'}</p>
                        <p className="text-xs text-slate-400">
                          {r.user?.department?.name || r.user?.designation || 'Staff'}
                        </p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="font-medium text-slate-900">
                    {format(new Date(r.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {r.checkIn ? format(new Date(r.checkIn), 'hh:mm a') : '-'}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {r.checkOut ? format(new Date(r.checkOut), 'hh:mm a') : (
                      <span className="text-amber-600 text-xs font-semibold">Active</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {r.workingHours > 0 ? `${r.workingHours} hrs` : '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                    {r.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchAttendance(p)}
          />
        </Card>
      )}
    </div>
  );
};
