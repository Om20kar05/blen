import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  className
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border tracking-wide uppercase',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    // Attendance
    Present: { variant: 'success', label: 'Present' },
    Late: { variant: 'warning', label: 'Late' },
    'Half Day': { variant: 'purple', label: 'Half Day' },
    Absent: { variant: 'danger', label: 'Absent' },
    // Leave
    Pending: { variant: 'warning', label: 'Pending Review' },
    Approved: { variant: 'success', label: 'Approved' },
    Rejected: { variant: 'danger', label: 'Rejected' },
    Cancelled: { variant: 'default', label: 'Cancelled' },
    // User status
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'danger', label: 'Inactive' }
  };

  const config = map[status] || { variant: 'default', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
