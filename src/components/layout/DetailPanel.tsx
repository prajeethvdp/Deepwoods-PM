import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  Building,
  CheckCircle2,
  Paperclip,
  FileText,
  Download,
  Bell,
  MailCheck,
  Check,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Priority, TaskStatus, TaskAttachment } from '../../types';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../../lib/constants';
import { canDeleteTask } from '../../lib/permissions';
import { isBefore, startOfDay } from 'date-fns';
import { toYYYYMMDD } from '../../lib/dateUtils';

export const DetailPanel: React.FC = () => {
  const {
    selectedTask,
    isDetailPanelOpen,
    closeTaskDetail,
    updateTask,
    deleteTask,
    projects,
    teamMembers,
    comments,
    addComment,
    sendDeadlineReminder,
    addAttachmentToTask,
    removeAttachmentFromTask,
  } = useData();

  const { user, isEmployee } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [assignorId, setAssignorId] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [newCommentText, setNewCommentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description);
      setProjectId(selectedTask.projectId);
      setAssigneeId(selectedTask.assigneeId);
      setAssignorId(selectedTask.assignorId || 'tm-3');
      setPriority(selectedTask.priority);
      setStatus(selectedTask.status);
      setStartDate(toYYYYMMDD(selectedTask.startDate));
      setDueDate(toYYYYMMDD(selectedTask.dueDate));
      setShowDeleteConfirm(false);
      setReminderSent(false);
    }
  }, [selectedTask]);

  if (!isDetailPanelOpen || !selectedTask) return null;

  const today = startOfDay(new Date());
  const dueYmd = toYYYYMMDD(selectedTask.dueDate);
  const taskDueDate = dueYmd ? startOfDay(new Date(dueYmd)) : null;
  const isOverdue = taskDueDate && isBefore(taskDueDate, today) && selectedTask.status !== 'Done';

  const currentAssignee = teamMembers.find((m) => m.id === assigneeId);
  const currentAssignor = teamMembers.find((m) => m.id === assignorId);
  const currentProject = projects.find((p) => p.id === projectId);
  const taskComments = comments.filter((c) => c.taskId === selectedTask.id);
  const taskAttachments = selectedTask.attachments || [];

  const handleTitleBlur = () => {
    if (title.trim() && title !== selectedTask.title) {
      updateTask(selectedTask.id, { title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== selectedTask.description) {
      updateTask(selectedTask.id, { description });
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    updateTask(selectedTask.id, { [field]: value });
  };

  const handleSendReminder = async () => {
    const success = await sendDeadlineReminder(selectedTask.id);
    if (success) {
      setReminderSent(true);
      setTimeout(() => setReminderSent(false), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: TaskAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          fileType: file.type || 'document',
          dataUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.name || 'Team Member',
        };
        addAttachmentToTask(selectedTask.id, newAttachment);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteTask(selectedTask.id);
    setIsDeleting(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !user) return;
    await addComment(selectedTask.id, user.id, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity duration-200">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={closeTaskDetail} />

      {/* Slide-In Panel */}
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in relative">
        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: currentProject?.color || '#06B6D4' }}
            />
            <span className="text-xs font-bold text-slate-700 truncate">
              {currentProject?.name || 'Project Task'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isOverdue && (
              <span className="inline-flex items-center gap-1 bg-white text-rose-600 border border-slate-200 text-[10px] font-extrabold px-2.5 py-1 rounded-none uppercase shrink-0">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>Overdue</span>
              </span>
            )}

            {/* Send Deadline Reminder Email Action Button (Admin & PM only) */}
            {!isEmployee && (
              <button
                onClick={handleSendReminder}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-xs font-bold transition whitespace-nowrap border shadow-2xs ${
                  reminderSent
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
                title="Send Deadline Reminder Email to Assignee"
              >
                {reminderSent ? <MailCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Bell className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                <span>{reminderSent ? 'Reminder Sent!' : 'Remind Deadline'}</span>
              </button>
            )}

            {canDeleteTask(user?.role, selectedTask, user?.id) && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={closeTaskDetail}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <textarea
              value={title}
              disabled={isEmployee}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              rows={2}
              className={`w-full text-lg font-bold text-slate-900 border border-transparent rounded-lg resize-none transition ${
                isEmployee
                  ? 'bg-transparent cursor-default focus:outline-none'
                  : 'hover:border-slate-300 focus:border-cyan-500 focus:outline-none p-2'
              }`}
              placeholder="Task Title..."
            />
          </div>

          {/* Properties Grid */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
            {/* Status (Employees CAN update status of their assigned tasks) */}
            <div className="grid grid-cols-3 items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Status
              </span>
              <div className="col-span-2">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as TaskStatus);
                    handleFieldChange('status', e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                >
                  {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div className="grid grid-cols-3 items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Priority
              </span>
              <div className="col-span-2">
                <select
                  value={priority}
                  disabled={isEmployee}
                  onChange={(e) => {
                    setPriority(e.target.value as Priority);
                    handleFieldChange('priority', e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-75 disabled:bg-slate-100/80 disabled:cursor-not-allowed"
                >
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignee */}
            <div className="grid grid-cols-3 items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Assignee
              </span>
              <div className="col-span-2">
                <select
                  value={assigneeId}
                  disabled={isEmployee}
                  onChange={(e) => {
                    setAssigneeId(e.target.value);
                    handleFieldChange('assigneeId', e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-75 disabled:bg-slate-100/80 disabled:cursor-not-allowed"
                >
                  {teamMembers.filter(m => m.role !== 'Admin').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role || 'Employee'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignor */}
            <div className="grid grid-cols-3 items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-600" /> Assigned By
              </span>
              <div className="col-span-2">
                <select
                  value={assignorId}
                  disabled={isEmployee}
                  onChange={(e) => {
                    setAssignorId(e.target.value);
                    handleFieldChange('assignorId', e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-75 disabled:bg-slate-100/80 disabled:cursor-not-allowed"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project */}
            <div className="grid grid-cols-3 items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Project
              </span>
              <div className="col-span-2">
                <select
                  value={projectId}
                  disabled={isEmployee}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    handleFieldChange('projectId', e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-75 disabled:bg-slate-100/80 disabled:cursor-not-allowed"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div className="grid grid-cols-3 items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date
              </span>
              <div className="col-span-2">
                <input
                  type="date"
                  value={startDate}
                  disabled={isEmployee}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handleFieldChange('startDate', e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-75 disabled:bg-slate-100/80 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="grid grid-cols-3 items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Deadline / Due
              </span>
              <div className="col-span-2">
                <input
                  type="date"
                  value={dueDate}
                  disabled={isEmployee}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    handleFieldChange('dueDate', e.target.value);
                  }}
                  className={`w-full bg-white border rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 disabled:opacity-75 disabled:bg-slate-100/80 disabled:cursor-not-allowed ${
                    isOverdue
                      ? 'border-red-400 text-red-700 bg-red-50 focus:ring-red-400'
                      : 'border-slate-200 text-slate-800 focus:ring-cyan-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Attached Documents Section */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2 font-serif">
                <Paperclip className="w-3.5 h-3.5 text-cyan-600" />
                Attached Documents ({taskAttachments.length})
              </h3>

              <label className="px-2.5 py-1 bg-white border border-slate-200 hover:border-cyan-500 text-cyan-700 rounded-lg cursor-pointer text-[11px] font-semibold transition flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                <span>Upload File</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {taskAttachments.length === 0 ? (
              <div className="text-xs text-slate-400 italic bg-white p-3 rounded-lg border border-dashed border-slate-200 text-center">
                No documents attached yet. Click 'Upload File' to attach reports, invoices, or specifications.
              </div>
            ) : (
              <div className="space-y-2">
                {taskAttachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 truncate">{att.fileName}</div>
                        <div className="text-[10px] text-slate-400">
                          {att.fileSize} • Uploaded by {att.uploadedBy}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {att.dataUrl && (
                        <a
                          href={att.dataUrl}
                          download={att.fileName}
                          className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => removeAttachmentFromTask(selectedTask.id, att.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Remove Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Task Description
            </label>
            <textarea
              value={description}
              disabled={isEmployee}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              rows={4}
              placeholder="Add detailed task notes or technical guidance..."
              className="w-full text-xs text-slate-800 bg-slate-50/60 border border-slate-200 rounded-lg p-3 focus:bg-white focus:border-cyan-500 focus:outline-none transition resize-y disabled:opacity-75 disabled:bg-slate-100/80 disabled:cursor-not-allowed"
            />
          </div>

          {/* Comments Thread (Nice-To-Have Feature) */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2 font-serif">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
              Activity & Comments ({taskComments.length})
            </h3>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {taskComments.length === 0 ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                  No comments yet. Leave a note for the team!
                </div>
              ) : (
                taskComments.map((comm) => {
                  const author = teamMembers.find((m) => m.id === comm.authorId);
                  return (
                    <div key={comm.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: author?.color || '#64748B' }}
                          />
                          <span>{author?.name || 'Team Member'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700">{comm.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-cyan-500 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-10">
            <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base font-serif">Delete Task?</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete "{selectedTask.title}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
