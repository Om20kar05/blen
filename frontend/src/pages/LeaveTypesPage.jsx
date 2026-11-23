import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { FileCheck, Plus, Edit2, Power } from 'lucide-react';
import { toast } from 'sonner';

export const LeaveTypesPage = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    yearlyQuota: 12,
    isPaid: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaveTypes = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/leave-types');
      setLeaveTypes(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch leave types');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      yearlyQuota: 12,
      isPaid: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lt) => {
    setModalMode('edit');
    setSelectedId(lt._id);
    setFormData({
      name: lt.name,
      code: lt.code,
      description: lt.description || '',
      yearlyQuota: lt.yearlyQuota,
      isPaid: lt.isPaid
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (modalMode === 'create') {
        const res = await api.post('/leave-types', formData);
        toast.success(res.message || 'Leave policy created');
      } else {
        const res = await api.put(`/leave-types/${selectedId}`, formData);
        toast.success(res.message || 'Leave policy updated');
      }
      setIsModalOpen(false);
      await fetchLeaveTypes();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (lt) => {
    try {
      const res = await api.patch(`/leave-types/${lt._id}/status`);
      toast.success(res.message || 'Status updated');
      await fetchLeaveTypes();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-600">
            Corporate HR Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Leave Policies & Annual Quotas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure dynamic database-driven leave categories, annual day limits, and compensation rules.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Leave Type
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-72 w-full rounded-xl" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Leave Type</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Annual Quota</TableHead>
                <TableHead>Compensation</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((lt) => (
                <TableRow key={lt._id}>
                  <TableCell className="font-bold text-slate-900">{lt.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {lt.code}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-slate-800">
                    {lt.yearlyQuota} days / yr
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        lt.isPaid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {lt.isPaid ? 'Paid Leave' : 'Unpaid'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-sm">
                    {lt.description || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        lt.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {lt.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openEditModal(lt)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className={lt.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}
                        onClick={() => handleToggleStatus(lt)}
                        leftIcon={<Power className="w-3.5 h-3.5" />}
                      >
                        {lt.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add Leave Policy' : 'Edit Leave Policy'}
        description="Specify leave identification, annual quota allocation, and compensation policy."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Leave Type Name"
              required
              placeholder="e.g. Casual Leave"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Short Code"
              required
              placeholder="e.g. CL"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Yearly Limit (Days)"
              type="number"
              min="0"
              required
              value={formData.yearlyQuota}
              onChange={(e) => setFormData({ ...formData, yearlyQuota: e.target.value })}
            />

            <div className="flex flex-col justify-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                />
                <span>Is Paid Leave (Deducts from paid balance)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Policy conditions and documentation guidelines..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Save Policy' : 'Update Policy'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
