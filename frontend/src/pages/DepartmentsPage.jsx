import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Building2, Plus, Edit2, Users } from 'lucide-react';
import { toast } from 'sonner';

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [deptRes, mgrRes] = await Promise.all([
        api.get('/departments'),
        api.get('/employees?managerOnly=true&limit=100')
      ]);
      setDepartments(deptRes.data || []);
      setManagers(mgrRes.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch departments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setFormData({
      name: '',
      description: '',
      managerId: managers[0]?._id || ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (d) => {
    setModalMode('edit');
    setSelectedId(d._id);
    setFormData({
      name: d.name,
      description: d.description || '',
      managerId: d.manager?._id || d.manager || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (modalMode === 'create') {
        const res = await api.post('/departments', formData);
        toast.success(res.message || 'Department created');
      } else {
        const res = await api.put(`/departments/${selectedId}`, formData);
        toast.success(res.message || 'Department updated');
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-600">
            Corporate Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Department Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Define organizational divisions, assign leadership managers, and track active team counts.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Department
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton className="h-72 w-full rounded-xl" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Department Name</TableHead>
                <TableHead>Assigned Manager</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="font-bold text-slate-900">{d.name}</TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {d.manager?.name ? (
                      <span className="font-medium text-slate-900">{d.manager.name}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-sm">
                    {d.description || '-'}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      <Users className="w-3 h-3" />
                      {d.employeeCount || 0} members
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => openEditModal(d)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
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
        title={modalMode === 'create' ? 'Add Department' : 'Edit Department'}
        description="Set up department title, leadership assignment, and charter."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Department Name"
            required
            placeholder="e.g. Engineering"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Select
            label="Department Head / Lead Manager"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            placeholder="Select Manager"
            options={managers.map((m) => ({
              value: m._id,
              label: `${m.name} (${m.role})`
            }))}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Department responsibilities and mission..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Create Department' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
