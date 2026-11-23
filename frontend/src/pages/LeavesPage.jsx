import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import {
  CalendarDays,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { toast } from 'sonner';

export const LeavesPage = () => {
  const { user, refreshUser } = useAuth();
  const role = user?.role || 'employee';

  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');

  // Apply Leave Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  // Review Modal state (Manager / Admin)
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchBalances = async () => {
    try {
      const res = await api.get('/leaves/balances');
      setBalances(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await api.get('/leave-types');
      const active = (res.data || []).filter(t => t.isActive);
      setLeaveTypes(active);
      if (active.length > 0 && !applyForm.leaveTypeId) {
        setApplyForm(prev => ({ ...prev, leaveTypeId: active[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaves = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const endpoint = role === 'employee' ? '/leaves/my' : '/leaves';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (statusFilter) params.append('status', statusFilter);
      if (leaveTypeFilter) params.append('leaveTypeId', leaveTypeFilter);

      const res = await api.get(`${endpoint}?${params.toString()}`);
      setLeaves(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch leaves');
    } finally {
      setIsLoading(false);
    }
  }, [role, statusFilter, leaveTypeFilter]);

  useEffect(() => {
    fetchBalances();
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    fetchLeaves(1);
  }, [fetchLeaves]);

  // Duration calculation for apply modal
  const computedDuration = (applyForm.startDate && applyForm.endDate)
    ? Math.max(0, differenceInCalendarDays(new Date(applyForm.endDate), new Date(applyForm.startDate)) + 1)
    : 0;

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (computedDuration <= 0) {
      toast.error('End date cannot precede start date');
      return;
    }

    try {
      setIsSubmittingApply(true);
      const res = await api.post('/leaves', applyForm);
      toast.success(res.message || 'Leave request submitted!');
      setIsApplyModalOpen(false);
      setApplyForm({
        leaveTypeId: leaveTypes[0]?._id || '',
        startDate: '',
        endDate: '',
        reason: ''
      });
      await fetchLeaves(1);
      await fetchBalances();
      await refreshUser();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingApply(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Cancel this leave request? Reserved days will be restored.')) return;
    try {
      const res = await api.patch(`/leaves/${leaveId}/cancel`);
      toast.success(res.message || 'Leave request cancelled');
      await fetchLeaves(pagination.page);
      await fetchBalances();
      await refreshUser();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openReviewModal = (leave, action) => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setReviewComment(action === 'approve' ? 'Approved, coverage confirmed.' : '');
    setRejectionReason('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
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
        toast.success(res.message || 'Leave approved');
      } else {
        const res = await api.patch(`/leaves/${selectedLeave._id}/reject`, {
          rejectionReason,
          reviewComment
        });
        toast.success(res.message || 'Leave rejected');
      }
      setSelectedLeave(null);
      await fetchLeaves(pagination.page);
      await fetchBalances();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-600">
            Workforce Absence Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Leave Requests & Quota Balances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Apply for planned leaves, view remaining quota allocations, and monitor approval workflows.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsApplyModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Apply for Leave
        </Button>
      </div>

      {/* Leave Balances Grid (For current user) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {balances.map((b) => (
          <div
            key={b.leaveTypeId}
            className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {b.name}
              </span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {b.code}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{b.available}</span>
              <span className="text-xs text-slate-400 font-medium">days left</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Quota: {b.allocated}</span>
              <span>Used: {b.used}</span>
              <span>Pending: {b.pending}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Selectors */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    statusFilter === st
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st === '' ? 'All Requests' : st}
                </button>
              ))}
            </div>

            {/* Leave Type Selector */}
            <div className="w-full sm:w-64">
              <Select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                placeholder="All Leave Types"
                options={leaveTypes.map((t) => ({
                  value: t._id,
                  label: t.name
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Table */}
      {isLoading ? (
        <LoadingSkeleton className="h-96 w-full rounded-xl" />
      ) : leaves.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No Leave Requests Found"
          description="There are no leave records matching the chosen filters."
          actionLabel="Apply for Leave"
          onAction={() => setIsApplyModalOpen(true)}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                {role !== 'employee' && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Decision / Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((l) => {
                const empId = l.employee?._id ? l.employee._id.toString() : (l.employee ? l.employee.toString() : '');
                const isOwner = empId === user?._id?.toString() || role === 'employee';
                const canApprove =
                  ['admin', 'manager'].includes(role) &&
                  l.status === 'Pending' &&
                  !isOwner;
                const canCancel =
                  isOwner && ['Pending', 'Approved'].includes(l.status);

                return (
                  <TableRow key={l._id}>
                    {role !== 'employee' && (
                      <TableCell>
                        <p className="font-bold text-slate-900">{l.employee?.name}</p>
                        <p className="text-xs text-slate-400">
                          {l.employee?.department?.name || l.employee?.designation}
                        </p>
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="font-semibold text-slate-800">{l.leaveType?.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                        ({l.leaveType?.code})
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {format(new Date(l.startDate), 'MMM dd')} - {format(new Date(l.endDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800">
                      {l.totalDays} day{l.totalDays > 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate" title={l.reason}>
                      {l.reason}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={l.status} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {l.rejectionReason ? (
                        <span className="text-rose-600 font-medium">
                          Reason: {l.rejectionReason}
                        </span>
                      ) : l.reviewComment ? (
                        <span>{l.reviewComment}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canApprove && (
                          <>
                            <Button
                              variant="success"
                              size="xs"
                              onClick={() => openReviewModal(l, 'approve')}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => openReviewModal(l, 'reject')}
                              leftIcon={<XCircle className="w-3.5 h-3.5" />}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {canCancel && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => handleCancelLeave(l._id)}
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchLeaves(p)}
          />
        </Card>
      )}

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        description="Select dates and provide a reason. Overlapping dates with existing requests are strictly blocked."
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          <Select
            label="Leave Type"
            required
            value={applyForm.leaveTypeId}
            onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
            options={leaveTypes.map((t) => ({
              value: t._id,
              label: `${t.name} (${t.code}) - ${t.yearlyQuota} days/yr`
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={applyForm.startDate}
              onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={applyForm.endDate}
              onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
            />
          </div>

          {computedDuration > 0 && (
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs font-semibold text-brand-800 flex items-center justify-between">
              <span>Duration Calculated:</span>
              <span>{computedDuration} Day{computedDuration > 1 ? 's' : ''}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="State the detailed reason for your absence..."
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingApply}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Decision Modal */}
      <Modal
        isOpen={!!selectedLeave}
        onClose={() => setSelectedLeave(null)}
        title={reviewAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        description={`Decision for ${selectedLeave?.employee?.name}'s request (${selectedLeave?.totalDays} days)`}
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
                placeholder="State the business rationale for rejecting this leave application..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Decision Note (Optional)
            </label>
            <Input
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="e.g. Approved, tasks covered."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setSelectedLeave(null)}>
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
