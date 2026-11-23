import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  Clock,
  CalendarCheck,
  CalendarDays,
  Percent,
  TrendingUp,
  LogIn,
  LogOut,
  AlertCircle,
  Plus,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const EmployeeDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check-in / out action state
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [attendanceNotes, setAttendanceNotes] = useState('');

  // Apply Leave Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveForm, setLeaveForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/dashboard/employee');
      setData(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load employee dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await api.get('/leave-types');
      const activeTypes = (res.data || []).filter(t => t.isActive);
      setLeaveTypes(activeTypes);
      if (activeTypes.length > 0 && !leaveForm.leaveTypeId) {
        setLeaveForm(prev => ({ ...prev, leaveTypeId: activeTypes[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchLeaveTypes();
  }, []);

  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true);
      const res = await api.post('/attendance/check-in', { notes: attendanceNotes });
      toast.success(res.message || 'Check-in recorded!');
      setAttendanceNotes('');
      await fetchDashboard();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsCheckingOut(true);
      const res = await api.post('/attendance/check-out', { notes: attendanceNotes });
      toast.success(res.message || 'Check-out recorded!');
      setAttendanceNotes('');
      await fetchDashboard();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.leaveTypeId || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error('All fields are required');
      return;
    }

    try {
      setIsSubmittingLeave(true);
      const res = await api.post('/leaves', leaveForm);
      toast.success(res.message || 'Leave request submitted successfully!');
      setIsApplyModalOpen(false);
      setLeaveForm({
        leaveTypeId: leaveTypes[0]?._id || '',
        startDate: '',
        endDate: '',
        reason: ''
      });
      await fetchDashboard();
      await refreshUser();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      const res = await api.patch(`/leaves/${leaveId}/cancel`);
      toast.success(res.message || 'Leave request cancelled');
      await fetchDashboard();
      await refreshUser();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LoadingSkeleton className="h-28" />
          <LoadingSkeleton className="h-28" />
          <LoadingSkeleton className="h-28" />
          <LoadingSkeleton className="h-28" />
        </div>
      </div>
    );
  }

  const { today, stats, balances, recentLeaves, recentAttendance } = data;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Check-In Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-400">
            Self-Service Employee Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            Hello, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
            Track daily work shifts, record check-in/out, monitor monthly attendance percentages, and manage leave balances.
          </p>
        </div>

        {/* Check-In / Out Card */}
        <div className="w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-xl flex flex-col sm:flex-row items-center gap-4">
          <div className="text-center sm:text-left">
            <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold block">
              Today's Attendance Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-white">
                {today.hasCheckedIn ? (today.hasCheckedOut ? 'Completed' : 'Shift In Progress') : 'Not Checked In'}
              </span>
              {today.hasCheckedIn && <StatusBadge status={today.status} />}
            </div>
            {today.hasCheckedIn && (
              <p className="text-[11px] text-slate-300 mt-0.5">
                In: {format(new Date(today.checkIn), 'hh:mm a')}
                {today.checkOut && ` • Out: ${format(new Date(today.checkOut), 'hh:mm a')}`}
                {today.workingHours > 0 && ` (${today.workingHours} hrs)`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!today.hasCheckedIn ? (
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 font-bold"
                isLoading={isCheckingIn}
                onClick={handleCheckIn}
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Check In Now
              </Button>
            ) : !today.hasCheckedOut ? (
              <Button
                variant="danger"
                size="md"
                className="w-full sm:w-auto font-bold"
                isLoading={isCheckingOut}
                onClick={handleCheckOut}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Check Out
              </Button>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                Shift Logged
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Attendance"
          value={`${stats.attendancePercentage}%`}
          subtitle="Overall attendance rate this month"
          icon={Percent}
          color="emerald"
        />
        <StatCard
          title="Days Present"
          value={`${stats.monthPresentDays} Days`}
          subtitle={`${stats.monthHalfDays} Half Days recorded`}
          icon={CalendarCheck}
          color="brand"
        />
        <StatCard
          title="Hours Logged"
          value={`${stats.monthTotalHours} hrs`}
          subtitle="Cumulative hours worked this month"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Pending Leaves"
          value={`${stats.pendingLeavesCount}`}
          subtitle="Awaiting manager review"
          icon={CalendarDays}
          color="amber"
        />
      </div>

      {/* Leave Balances Section */}
      <Card>
        <CardHeader
          title="Leave Balances & Quotas"
          description="Real-time allotment, usage, and available paid days for current annual cycle"
          action={
            <Button
              size="sm"
              onClick={() => setIsApplyModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Apply Leave
            </Button>
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {balances.map((b) => (
              <div
                key={b.leaveTypeId}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {b.name}
                  </span>
                  <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {b.code}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{b.available}</span>
                  <span className="text-xs text-slate-500 font-medium">days available</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Quota: {b.allocated}</span>
                  <span>Used: {b.used}</span>
                  <span>Pending: {b.pending}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Leaves & Recent Attendance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <Card>
          <CardHeader
            title="Recent Leave Requests"
            description="Your latest submitted leave applications and approval statuses"
          />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentLeaves.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No recent leave requests</div>
              ) : (
                recentLeaves.map((l) => (
                  <div key={l._id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{l.leaveType?.name}</span>
                        <StatusBadge status={l.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(l.startDate), 'MMM dd')} - {format(new Date(l.endDate), 'MMM dd, yyyy')} ({l.totalDays} day{l.totalDays > 1 ? 's' : ''})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 italic">"{l.reason}"</p>
                    </div>

                    {/* Self-cancellation button */}
                    {['Pending', 'Approved'].includes(l.status) && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleCancelLeave(l._id)}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Attendance Logs */}
        <Card>
          <CardHeader
            title="Recent Attendance Logs"
            description="Recent shifts and recorded working durations"
          />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentAttendance.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No attendance records found</div>
              ) : (
                recentAttendance.map((a) => (
                  <div key={a._id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {format(new Date(a.date), 'EEEE, MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        In: {format(new Date(a.checkIn), 'hh:mm a')}
                        {a.checkOut && ` • Out: ${format(new Date(a.checkOut), 'hh:mm a')}`}
                      </p>
                    </div>

                    <div className="text-right">
                      <StatusBadge status={a.status} />
                      <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                        {a.workingHours} hrs
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        description="Submit a new leave application. Leave requests will be routed to your reporting manager."
      >
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <Select
            label="Leave Type"
            required
            value={leaveForm.leaveTypeId}
            onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
            options={leaveTypes.map((lt) => ({
              value: lt._id,
              label: `${lt.name} (${lt.code}) - ${lt.yearlyQuota} days/yr`
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={leaveForm.startDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={leaveForm.endDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="State the reason for your leave application..."
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingLeave}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
