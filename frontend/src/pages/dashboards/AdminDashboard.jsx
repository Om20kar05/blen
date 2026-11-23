import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck,
  CalendarX,
  CheckCircle,
  TrendingUp,
  Building2,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { toast } from 'sonner';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/dashboard/admin');
      setData(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch admin dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton className="h-72" />
          <LoadingSkeleton className="h-72" />
        </div>
      </div>
    );
  }

  const { metrics, charts } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-brand-600">
          Executive Operations Overview
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
          Corporate Admin Dashboard & HR Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Live MongoDB aggregation pipelines tracking company headcount, daily attendance logs, and annual leave allocations.
        </p>
      </div>

      {/* KPI Stats Row 1: Employee & Attendance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={metrics.totalEmployees}
          subtitle={`${metrics.activeEmployees} active accounts`}
          icon={Users}
          color="brand"
        />
        <StatCard
          title="Present Today"
          value={metrics.presentToday}
          subtitle="Checked in on time"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Late Today"
          value={metrics.lateToday}
          subtitle="Arrived after 9:30 AM"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Absent Today"
          value={metrics.absentToday}
          subtitle="No record found"
          icon={UserX}
          color="rose"
        />
      </div>

      {/* KPI Stats Row 2: Leave Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Half Day Today"
          value={metrics.halfDayToday}
          subtitle="2 to 7.5 hrs recorded"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Pending Leaves"
          value={metrics.pendingLeaves}
          subtitle="Awaiting approvals"
          icon={CalendarCheck}
          color="amber"
        />
        <StatCard
          title="Approved Leaves"
          value={metrics.approvedLeaves}
          subtitle="Active & completed"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Rejected Leaves"
          value={metrics.rejectedLeaves}
          subtitle="With business reason"
          icon={CalendarX}
          color="rose"
        />
      </div>

      {/* Section 10 Chart 1: Monthly Attendance Trend */}
      <Card>
        <CardHeader
          title="1. Monthly Attendance Trend (Last 14 Days)"
          description="Daily breakdown of employee presence, late arrivals, and absence trends"
        />
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#presentGrad)" />
                <Area type="monotone" dataKey="late" name="Late" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#lateGrad)" />
                <Area type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Chart 2 & Chart 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 10 Chart 2: Leave Distribution by Type */}
        <Card>
          <CardHeader
            title="2. Leave Request Distribution"
            description="Breakdown of leave applications categorized by leave type"
          />
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.leaveDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {charts.leaveDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 10 Chart 3: Today's Attendance Status Breakdown */}
        <Card>
          <CardHeader
            title="3. Today's Shift Status Breakdown"
            description="Real-time distribution of workforce attendance today"
          />
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.attendanceStatusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {charts.attendanceStatusBreakdown.map((entry, index) => (
                      <Cell key={`cell-status-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid of Chart 4 & Chart 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 10 Chart 4: Department-wise Employee Distribution */}
        <Card>
          <CardHeader
            title="4. Department Headcount Distribution"
            description="Total active employees per organizational division"
          />
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.departmentHeadcount} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                  <Bar dataKey="count" name="Headcount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section 10 Chart 5: Leave Usage vs Allocation */}
        <Card>
          <CardHeader
            title="5. Annual Leave Usage vs Quota Allocation"
            description="Comparison of total allocated days vs days consumed by employees"
          />
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.leaveUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="allocated" name="Total Allocated" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="used" name="Consumed Days" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
