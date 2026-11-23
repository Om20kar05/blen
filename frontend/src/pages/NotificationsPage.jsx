import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Bell, CheckCheck, CheckCircle2, Clock, Info } from 'lucide-react';
import { format } from 'date-fns';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-600">
            System Communication Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Notifications & System Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stay informed about attendance check-in confirmations, leave application decisions, and administrative notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="md"
            onClick={markAllAsRead}
            leftIcon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications Found"
          description={filter === 'unread' ? "You're all caught up! No unread notifications." : "There are no notifications in your history."}
        />
      ) : (
        <Card>
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item._id}
                onClick={() => !item.isRead && markAsRead(item._id)}
                className={`p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                  !item.isRead ? 'bg-brand-50/20 hover:bg-brand-50/40' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${
                      item.type === 'leave_approved'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : item.type === 'leave_rejected'
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : item.type === 'attendance_alert'
                        ? 'bg-sky-50 text-sky-600 border-sky-200'
                        : 'bg-brand-50 text-brand-600 border-brand-200'
                    }`}
                  >
                    <Bell className="w-5 h-5 stroke-[1.75]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                      {item.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {format(new Date(item.createdAt), 'EEEE, MMM dd, yyyy • hh:mm a')}
                    </p>
                  </div>
                </div>

                {!item.isRead && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(item._id);
                    }}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
