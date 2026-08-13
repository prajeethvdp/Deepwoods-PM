import React, { useState } from 'react';
import {
  X,
  Bell,
  Mail,
  CheckCircle2,
  Clock,
  UserCheck,
  Paperclip,
  Trash2,
  Download,
  FileText,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { EmailNotification } from '../../types';
import { LOGO_IMAGE_DATA_URL } from '../../lib/emailService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { emailNotifications, tasks, markNotificationAsRead, clearNotifications } = useData();
  const { user } = useAuth();
  const [selectedNotification, setSelectedNotification] = useState<EmailNotification | null>(null);

  if (!isOpen) return null;

  // Filter notifications for currently logged in user (recipient match)
  const displayNotifications = emailNotifications.filter((n) => {
    if (!user) return true;
    const userEmail = user.email.trim().toLowerCase();
    const recipientEmail = (n.recipientEmail || '').trim().toLowerCase();
    const userName = (user.name || '').trim().toLowerCase();
    const recipientName = (n.recipientName || '').trim().toLowerCase();

    // 1. Direct recipient match
    if (recipientEmail && userEmail && recipientEmail === userEmail) return true;
    if (recipientName && userName && recipientName === userName) return true;

    // 2. Email prefix match (e.g. prajeethv100@gmail.com)
    const userPrefix = userEmail.split('@')[0];
    const recipientPrefix = recipientEmail.split('@')[0];
    if (userPrefix && recipientPrefix && userPrefix === recipientPrefix) return true;

    // 3. Associated task assignee match
    if (n.taskId) {
      const task = tasks.find((t) => t.id === n.taskId);
      if (task) {
        if (task.assigneeId === user.id) return true;
        if (task.assigneeEmail && task.assigneeEmail.toLowerCase() === userEmail) return true;
      }
    }

    return false;
  });

  const selectedTaskObj = selectedNotification
    ? tasks.find((t) => t.id === selectedNotification.taskId)
    : null;

  const taskAttachments = selectedTaskObj?.attachments || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity duration-200">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">Email & Notifications Log</h3>
              <p className="text-[11px] text-slate-500">Live dispatch history for task emails</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {displayNotifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Clear Notification History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayNotifications.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800">No Email Dispatches Yet</h4>
              <p className="text-xs text-slate-400 mt-1">
                Creating or assigning tasks, marking completion, or triggering reminders will log automated email notifications here.
              </p>
            </div>
          ) : (
            displayNotifications.map((notif) => {
              const isAssignment = notif.type === 'ASSIGNMENT';
              const isReminder = notif.type === 'REMINDER';
              const isCompletion = notif.type === 'COMPLETION';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    setSelectedNotification(notif);
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${
                    notif.read
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-cyan-50/40 border-cyan-200 text-slate-900 shadow-2xs'
                  }`}
                >
                  {/* Top line: Icon, Type Badge, Sent time */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isAssignment && (
                        <span className="flex items-center gap-1 text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full text-[10px] uppercase">
                          <UserCheck className="w-3 h-3" /> Task Assigned
                        </span>
                      )}
                      {isReminder && (
                        <span className="flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px] uppercase">
                          <Clock className="w-3 h-3" /> Reminder
                        </span>
                      )}
                      {isCompletion && (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] uppercase">
                          <CheckCircle2 className="w-3 h-3" /> Task Completed
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Subject line */}
                  <h4 className="font-semibold text-slate-900 leading-snug mb-1">
                    {notif.subject}
                  </h4>

                  {/* Recipient info */}
                  <div className="text-[11px] text-slate-500 mb-2 flex items-center justify-between">
                    <span>To: <b>{notif.recipientName}</b> ({notif.recipientEmail})</span>
                  </div>

                  {/* Footer attachments info */}
                  {notif.attachmentsCount > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1 text-[10px] text-cyan-700 font-medium">
                      <Paperclip className="w-3 h-3" />
                      <span>{notif.attachmentsCount} Attached Document(s) - Click to View & Download</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Email Preview Modal Overlay */}
        {selectedNotification && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-600" />
                  <span className="font-bold text-slate-900 text-xs uppercase">Email Dispatch Preview</span>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs overflow-y-auto pr-1">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Subject</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedNotification.subject}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">To Recipient</span>
                    <span className="text-slate-800 font-semibold">{selectedNotification.recipientName} ({selectedNotification.recipientEmail})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Sender</span>
                    <span className="text-slate-800 font-semibold">{selectedNotification.senderName}</span>
                  </div>
                </div>

                {/* Attached Documents with Clickable Download Buttons */}
                {((selectedNotification.attachmentNames && selectedNotification.attachmentNames.length > 0) || taskAttachments.length > 0) && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-2 flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-cyan-600" /> Attached Documents (Click to Download)
                    </span>
                    <div className="space-y-1.5">
                      {taskAttachments.length > 0
                        ? taskAttachments.map((att) => (
                            <div key={att.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                                <span className="font-bold text-slate-800 truncate">{att.fileName}</span>
                                <span className="text-[10px] text-slate-400">({att.fileSize})</span>
                              </div>
                              {att.dataUrl && (
                                <a
                                  href={att.dataUrl}
                                  download={att.fileName}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </a>
                              )}
                            </div>
                          ))
                        : (selectedNotification.attachmentNames || []).map((name, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-cyan-600" />
                                <span className="font-bold text-slate-800">{name}</span>
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                )}

                {/* Styled Email HTML Render */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-2">Trebuchet MS Formatted Email Output</span>
                  <div
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs overflow-x-auto max-h-60 text-left"
                    dangerouslySetInnerHTML={{
                      __html: (selectedNotification.body || '').replace('src="cid:company_logo"', `src="${LOGO_IMAGE_DATA_URL}"`),
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-slate-100">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
