import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Users,
  Building2,
  FileCheck,
  Bell,
  LogOut,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'employee';

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'employee']
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: CalendarCheck,
      roles: ['admin', 'manager', 'employee']
    },
    {
      label: 'Leave Management',
      path: '/leaves',
      icon: CalendarDays,
      roles: ['admin', 'manager', 'employee']
    },
    {
      label: 'Employee Directory',
      path: '/employees',
      icon: Users,
      roles: ['admin', 'manager']
    },
    {
      label: 'Departments',
      path: '/departments',
      icon: Building2,
      roles: ['admin']
    },
    {
      label: 'Leave Policies',
      path: '/leave-types',
      icon: FileCheck,
      roles: ['admin']
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      roles: ['admin', 'manager', 'employee']
    }
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  const roleLabels = {
    admin: { label: 'Administrator', bg: 'bg-purple-100 text-purple-700 border-purple-200' },
    manager: { label: 'Team Manager', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
    employee: { label: 'Employee', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
  };

  const currentRole = roleLabels[role] || roleLabels.employee;

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-lg shadow-brand-500/30">
            B
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">BLEN DIGITAL</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">HR SaaS Platform</p>
          </div>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">Session Role</span>
        <span className={cn('text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border', currentRole.bg)}>
          {currentRole.label}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )
              }
            >
              <Icon className="w-4 h-4 stroke-[2]" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-700/60 border border-brand-500/40 flex items-center justify-center font-bold text-xs text-brand-200 shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
