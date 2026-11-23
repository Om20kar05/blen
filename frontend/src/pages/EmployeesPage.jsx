import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Power,
  Shield,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const EmployeesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    designation: '',
    reportingManager: '',
    role: 'employee',
    joiningDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAuxiliaryData = async () => {
    try {
      const [deptRes, mgrRes] = await Promise.all([
        api.get('/departments'),
        api.get('/employees?managerOnly=true&limit=100')
      ]);
      setDepartments(deptRes.data || []);
      setManagers(mgrRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (searchQuery) params.append('search', searchQuery);
      if (deptFilter) params.append('department', deptFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/employees?${params.toString()}`);
      setEmployees(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, deptFilter, roleFilter, statusFilter]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      department: departments[0]?._id || '',
      designation: '',
      reportingManager: managers[0]?._id || '',
      role: 'employee',
      joiningDate: format(new Date(), 'yyyy-MM-dd')
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp) => {
    setModalMode('edit');
    setSelectedId(emp._id);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      password: '',
      phone: emp.phone || '',
      department: emp.department?._id || emp.department || '',
      designation: emp.designation || '',
      reportingManager: emp.reportingManager?._id || emp.reportingManager || '',
      role: emp.role || 'employee',
      joiningDate: emp.joiningDate ? format(new Date(emp.joiningDate), 'yyyy-MM-dd') : ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (modalMode === 'create') {
        const res = await api.post('/employees', formData);
        toast.success(res.message || 'Employee created successfully');
      } else {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        const res = await api.put(`/employees/${selectedId}`, payload);
        toast.success(res.message || 'Employee updated successfully');
      }
      setIsModalOpen(false);
      await fetchEmployees(pagination.page);
      await fetchAuxiliaryData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Are you sure you want to set ${emp.name} to ${newStatus}?`)) return;

    try {
      const res = await api.patch(`/employees/${emp._id}/status`, { status: newStatus });
      toast.success(res.message || `Employee ${newStatus}`);
      await fetchEmployees(pagination.page);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-600">
            Workforce Directory & Organizational Structure
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Employee Directory & Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage company employee accounts, assign reporting hierarchies, departments, and system roles.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add New Employee
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              placeholder="Search by name, email, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />

            <Select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              placeholder="All Departments"
              options={departments.map((d) => ({
                value: d._id,
                label: d.name
              }))}
            />

            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              placeholder="All Roles"
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'manager', label: 'Manager' },
                { value: 'employee', label: 'Employee' }
              ]}
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Statuses"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      {isLoading ? (
        <LoadingSkeleton className="h-96 w-full rounded-xl" />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Employees Found"
          description="No employee accounts matched the search query or active filters."
          actionLabel={isAdmin ? 'Add Employee' : 'Clear Filters'}
          onAction={isAdmin ? openCreateModal : () => {
            setSearchQuery('');
            setDeptFilter('');
            setRoleFilter('');
            setStatusFilter('');
          }}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Reporting Manager</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center border border-slate-200">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.designation || 'Staff'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 font-medium">
                    {emp.department?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        emp.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : emp.role === 'manager'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {emp.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {emp.reportingManager?.name || 'None (Top Level)'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    <p>{emp.email}</p>
                    <p className="text-[11px] text-slate-400">{emp.phone || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={emp.status} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => openEditModal(emp)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className={emp.status === 'active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}
                          onClick={() => handleToggleStatus(emp)}
                          leftIcon={<Power className="w-3.5 h-3.5" />}
                        >
                          {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchEmployees(p)}
          />
        </Card>
      )}

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Employee' : 'Edit Employee Details'}
        description="Configure employee profile, organizational unit, hierarchy, and system access role."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
            />
            <Input
              label="Email Address"
              type="email"
              required
              disabled={modalMode === 'edit'}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@blen.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={modalMode === 'create' ? 'Password' : 'Password (leave blank to keep unchanged)'}
              type="password"
              required={modalMode === 'create'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={departments.map((d) => ({
                value: d._id,
                label: d.name
              }))}
            />
            <Input
              label="Designation / Job Title"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g. Senior Frontend Dev"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Reporting Manager"
              value={formData.reportingManager}
              onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
              placeholder="Select Reporting Manager"
              options={managers.map((m) => ({
                value: m._id,
                label: `${m.name} (${m.role})`
              }))}
            />
            <Select
              label="System Role"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'employee', label: 'Employee (Standard Self-Service)' },
                { value: 'manager', label: 'Manager (Team Oversight & Leaves)' },
                { value: 'admin', label: 'Administrator (Complete Access)' }
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Create Employee' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
