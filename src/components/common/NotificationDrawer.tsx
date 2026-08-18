import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  UserCheck,
  Paperclip,
  Trash2,
  FileText,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { EmailNotification } from '../../types';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { emailNotifications, tasks, markNotificationAsRead, clearNotifications, openTaskDetail } = useData();
  const { user } = useAuth();

  if (!isOpen) return null;

  // Filter notifications for currently logged in user
  const displayNotifications = emailNotifications.filter((n) => {
    if (!user) return true;

    const userEmail = (user.email || '').trim().toLowerCase();
    const roleStr = (user.role || '').toLowerCase();
    const isAdmin = roleStr.includes('admin') || roleStr.includes('manager') || roleStr.includes('lead');

    // 1. Admins, PMs, and Workspace Leads see all notifications
    if (isAdmin) return true;

    // 2. Direct recipient email match
    const recipientEmail = (n.recipientEmail || '').trim().toLowerCase();
    if (recipientEmail && userEmail && recipientEmail === userEmail) return true;

    // 3. Task role match
    if (n.taskId) {
      const task = tasks.find((t) => t.id === n.taskId);
      if (task) {
        if (n.type === 'COMPLETION') {
          if (task.assignorId === user.id) return true;
          if (task.assignorEmail && task.assignorEmail.trim().toLowerCase() === userEmail) return true;
        } else {
          if (task.assigneeId === user.id) return true;
          if (task.assigneeEmail && task.assigneeEmail.trim().toLowerCase() === userEmail) return true;
        }
      }
    }

    return false;
  });

  const handleNotificationClick = (notif: EmailNotification) => {
    markNotificationAsRead(notif.id);
    const associatedTask = tasks.find((t) => t.id === notif.taskId);
    if (associatedTask) {
      onClose();
      openTaskDetail(associatedTask);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity duration-200">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in relative select-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight font-serif">Notifications</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {displayNotifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none transition"
                title="Clear Notification History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-none transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayNotifications.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 font-serif">No Notifications Yet</h4>
              <p className="text-xs text-slate-400 mt-1">
                You're all caught up! Updates on task assignments, completions, and reminders will appear here.
              </p>
            </div>
          ) : (
            displayNotifications.map((notif) => {
              const isAssignment = notif.type === 'ASSIGNMENT';
              const isReminder = notif.type === 'REMINDER';
              const isCompletion = notif.type === 'COMPLETION';

              let timeAgoStr = '';
              try {
                timeAgoStr = formatDistanceToNow(parseISO(notif.sentAt), { addSuffix: true });
              } catch {
                timeAgoStr = new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 rounded-none border transition cursor-pointer text-xs space-y-2 ${
                    notif.read
                      ? 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/60'
                      : 'bg-emerald-50/40 border-emerald-300 text-slate-900 shadow-2xs hover:bg-emerald-50/70'
                  }`}
                >
                  {/* Top Header: Badge + Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isAssignment && (
                        <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded-none text-[10px] uppercase font-mono">
                          <UserCheck className="w-3 h-3" /> Task Assigned
                        </span>
                      )}
                      {isReminder && (
                        <span className="flex items-center gap-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded-none text-[10px] uppercase font-mono">
                          <Clock className="w-3 h-3" /> Deadline Reminder
                        </span>
                      )}
                      {isCompletion && (
                        <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-none text-[10px] uppercase font-mono">
                          <CheckCircle2 className="w-3 h-3" /> Task Completed
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium">
                      {timeAgoStr}
                    </span>
                  </div>

                  {/* Body Text */}
                  <div className="text-xs text-slate-800 font-medium leading-snug">
                    {isCompletion && (
                      <span>
                        <strong className="text-slate-900">{notif.senderName || 'An employee'}</strong> marked task{' '}
                        <strong className="text-emerald-700">"{notif.taskTitle}"</strong> as <span className="font-bold text-emerald-600">Completed</span>.
                      </span>
                    )}

                    {isAssignment && (
                      <span>
                        <strong className="text-slate-900">{notif.senderName || 'Admin'}</strong> assigned task{' '}
                        <strong className="text-blue-700">"{notif.taskTitle}"</strong> to{' '}
                        <strong className="text-slate-900">{notif.recipientName}</strong>.
                      </span>
                    )}

                    {isReminder && (
                      <span>
                        Deadline reminder for task <strong className="text-amber-700">"{notif.taskTitle}"</strong>.
                      </span>
                    )}
                  </div>

                  {/* Attachment Indicator */}
                  {notif.attachmentsCount > 0 && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{notif.attachmentsCount} Attachment(s) • Click to open task detail</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
