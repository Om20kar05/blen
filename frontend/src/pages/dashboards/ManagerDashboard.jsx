import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Review modal state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'reject'
  const [reviewComment, setReviewComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/dashboard/manager');
      setData(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load manager dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const openReviewModal = (leave, action) => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setReviewComment(action === 'approve' ? 'Approved, all work handed over.' : '');
    setRejectionReason('');
  };

  const closeReviewModal = () => {
    setSelectedLeave(null);
    setReviewAction(null);
    setReviewComment('');
    setRejectionReason('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeave || !reviewAction) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      toast.error('Rejection reason is mandatory');
      return;
    }

    try {
      setIsSubmittingReview(true);
      if (reviewAction === 'approve') {
        const res = await api.patch(`/leaves/${selectedLeave._id}/approve`, {
          reviewComment
        });
        toast.success(res.message || 'Leave approved successfully');
      } else {
        const res = await api.patch(`/leaves/${selectedLeave._id}/reject`, {
          rejectionReason,
          reviewComment
        });
        toast.success(res.message || 'Leave rejected');
      }

      closeReviewModal();
      await fetchDashboard();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const { metrics, teamMembers, todayAttendance, pendingLeaveRequests } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-brand-600">
          Team Management Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
          Manager Workspace & Team Supervision
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor your direct reports' daily presence, analyze team shifts, and adjudicate pending leave requests.
        </p>
      </div>

      {/* Team KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Team Headcount"
          value={metrics.totalTeamMembers}
          subtitle="Direct reports assigned"
          icon={Users}
          color="brand"
        />
        <StatCard
          title="Present Today"
          value={metrics.presentToday}
          subtitle="On time arrival"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Late Today"
          value={metrics.lateToday}
          subtitle="Checked in after 9:30 AM"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Absent Today"
          value={metrics.absentToday}
          subtitle="No check-in recorded"
          icon={UserX}
          color="rose"
        />
        <StatCard
          title="Pending Leaves"
          value={metrics.pendingLeaveRequests}
          subtitle="Awaiting your decision"
          icon={CalendarDays}
          color="purple"
        />
      </div>

      {/* Pending Leave Requests for Approval */}
      <Card>
        <CardHeader
          title="Team Leave Requests Awaiting Decision"
          description="Review applications from your direct reports with mandatory rationale for rejections"
        />
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {pendingLeaveRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All clear! No pending leave requests requiring review.
              </div>
            ) : (
              pendingLeaveRequests.map((leave) => (
                <div
                  key={leave._id}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-900">
                        {leave.employee?.name}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        ({leave.employee?.designation})
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                        {leave.leaveType?.name} ({leave.totalDays} day{leave.totalDays > 1 ? 's' : ''})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Dates:{' '}
                      <span className="font-semibold text-slate-800">
                        {format(new Date(leave.startDate), 'MMM dd, yyyy')} to{' '}
                        {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                      </span>
                    </p>

                    <p className="text-xs text-slate-500 italic bg-slate-100/70 p-2 rounded-lg max-w-xl">
                      "{leave.reason}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => openReviewModal(leave, 'approve')}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openReviewModal(leave, 'reject')}
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Attendance Today Feed & Team Members List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Team Attendance */}
        <Card>
          <CardHeader
            title="Team Shift Status (Today)"
            description="Live check-in and check-out logs for your assigned members"
          />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {todayAttendance.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No check-ins recorded yet for today
                </div>
              ) : (
                todayAttendance.map((att) => (
                  <div key={att._id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{att.user?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        In: {format(new Date(att.checkIn), 'hh:mm a')}
                        {att.checkOut && ` • Out: ${format(new Date(att.checkOut), 'hh:mm a')}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={att.status} />
                      {att.workingHours > 0 && (
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {att.workingHours} hrs
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Team Directory */}
        <Card>
          <CardHeader
            title="Assigned Direct Reports"
            description="List of employees under your reporting hierarchy"
          />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {teamMembers.map((member) => (
                <div key={member._id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{member.name}</p>
                      <p className="text-[11px] text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-700">
                      {member.designation || 'Engineer'}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {member.department?.name || 'Engineering'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Modal (Approve / Reject) */}
      <Modal
        isOpen={!!selectedLeave}
        onClose={closeReviewModal}
        title={reviewAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        description={`Decision for ${selectedLeave?.employee?.name}'s request for ${selectedLeave?.totalDays} day(s) of ${selectedLeave?.leaveType?.name}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          {reviewAction === 'reject' && (
            <div>
              <label className="block text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1.5">
                Rejection Reason (Mandatory) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                className="w-full rounded-lg border border-rose-300 p-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                placeholder="State the specific business justification for rejecting this leave request..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reviewer Comments (Optional)
            </label>
            <Input
              placeholder="e.g. Approved, task handover verified."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={closeReviewModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={reviewAction === 'approve' ? 'success' : 'danger'}
              isLoading={isSubmittingReview}
            >
              {reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
