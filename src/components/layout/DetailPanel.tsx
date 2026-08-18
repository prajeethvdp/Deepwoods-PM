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
  History,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Priority, TaskStatus, TaskAttachment } from '../../types';
import { canDeleteTask, findTeamMemberByAssigneeId } from '../../lib/permissions';
import { isBefore, startOfDay, formatDistanceToNow, parseISO } from 'date-fns';
import { toYYYYMMDD, formatDisplayDate } from '../../lib/dateUtils';

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
    activities,
    addComment,
    addAttachmentToTask,
    removeAttachmentFromTask,
  } = useData();

  const { user, isEmployee } = useAuth();

  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
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

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description);
      setProjectId(selectedTask.projectId);
      setAssigneeId(selectedTask.assigneeId);
      setAssignorId(selectedTask.assignorId || '');
      setPriority(selectedTask.priority);
      setStatus(selectedTask.status);
      setStartDate(toYYYYMMDD(selectedTask.startDate));
      setDueDate(toYYYYMMDD(selectedTask.dueDate));
      setShowDeleteConfirm(false);
      setActiveTab('details');
    }
  }, [selectedTask?.id]);

  if (!isDetailPanelOpen || !selectedTask) return null;

  const today = startOfDay(new Date());
  const dueYmd = toYYYYMMDD(selectedTask.dueDate);
  const taskDueDate = dueYmd ? startOfDay(new Date(dueYmd)) : null;
  const isOverdue = taskDueDate && isBefore(taskDueDate, today) && selectedTask.status !== 'Done';

  const currentAssignee = findTeamMemberByAssigneeId(
    assigneeId || selectedTask.assigneeId,
    teamMembers,
    selectedTask.assigneeEmail
  );

  // Resolve Assignor (Who assigned the task)
  const assignorMember = teamMembers.find(
    (m) =>
      (selectedTask.assignorId && m.id === selectedTask.assignorId) ||
      (selectedTask.assignorEmail && m.email.trim().toLowerCase() === selectedTask.assignorEmail.trim().toLowerCase()) ||
      (selectedTask.assignorName && m.name.trim().toLowerCase() === selectedTask.assignorName.trim().toLowerCase())
  );

  const fallbackAdminOrLead = teamMembers.find((m) => m.role === 'Admin' || m.role === 'Product Manager') || teamMembers[0];

  const assignorName =
    assignorMember?.name ||
    selectedTask.assignorName ||
    (selectedTask.assignorEmail && selectedTask.assignorEmail.includes('@')
      ? selectedTask.assignorEmail.split('@')[0]
      : fallbackAdminOrLead?.name || 'Assignor');

  const assignorRole =
    assignorMember?.role ||
    selectedTask.assignorRole ||
    fallbackAdminOrLead?.role ||
    'Admin';

  const assignorColor = assignorMember?.color || fallbackAdminOrLead?.color || '#059669';

  const cleanId = (str: any): string => String(str || '').replace(/[\r\n\t]/g, '').trim();
  const currentProject = projects.find((p) => p.id === projectId);
  const taskComments = comments.filter((c) => cleanId(c.taskId) === cleanId(selectedTask.id));
  const taskAttachments = selectedTask.attachments || [];
  const taskActivities = activities.filter((a) => a.taskId === selectedTask.id);

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
    e.target.value = '';
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

  const priorityBadgeStyle =
    priority === 'Urgent'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : priority === 'High'
      ? 'bg-red-50 text-red-700 border-red-200'
      : priority === 'Medium'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity duration-200">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={closeTaskDetail} />

      {/* Slide-In Panel */}
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in relative select-none">
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
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 bg-slate-50 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-4 text-xs font-bold font-serif transition border-b-2 ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Task Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2.5 px-4 text-xs font-bold font-serif transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Activity Log ({taskActivities.length})
          </button>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-red-700 font-semibold">
              Delete this task permanently?
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-none transition"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-none transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <>
              {/* Title Header */}
              <div>
                {!isEmployee ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="w-full text-lg font-bold font-serif text-slate-900 border border-slate-200 focus:border-emerald-600 bg-white rounded-none px-3 py-1.5 transition focus:outline-none"
                    placeholder="Task title..."
                  />
                ) : (
                  <h2 className="text-lg font-bold font-serif text-slate-900 tracking-tight leading-snug">
                    {title}
                  </h2>
                )}
              </div>

              {/* Status Bar (Always editable so employees can move status To Do -> In Progress -> Done) */}
              <div className="bg-emerald-50/50 p-3.5 border border-emerald-200/80 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-emerald-900 font-serif flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Task Status
                </span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as TaskStatus);
                    handleFieldChange('status', e.target.value);
                  }}
                  className="bg-white border border-slate-300 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-none focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                </select>
              </div>

              {/* Task Metadata Section */}
              {!isEmployee ? (
                /* ADMIN EDITABLE METADATA GRID */
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200 rounded-none text-xs">
                  {/* Assigned By (Read-Only) */}
                  <div className="col-span-2 bg-white p-2.5 border border-slate-200/80 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Assigned By
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: assignorColor }}
                      >
                        {assignorName.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-semibold text-slate-800 text-xs">
                        {assignorName} ({assignorRole})
                      </span>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => {
                        setPriority(e.target.value as Priority);
                        handleFieldChange('priority', e.target.value);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-none px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Assignee */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Assignee
                    </label>
                    <select
                      value={assigneeId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setAssigneeId(newId);
                        const matched = findTeamMemberByAssigneeId(newId, teamMembers);
                        handleFieldChange('assigneeId', newId);
                        if (matched?.email) {
                          handleFieldChange('assigneeEmail', matched.email);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-none px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role || 'Employee'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Project */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Project
                    </label>
                    <select
                      value={projectId}
                      onChange={(e) => {
                        setProjectId(e.target.value);
                        handleFieldChange('projectId', e.target.value);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-none px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        handleFieldChange('startDate', e.target.value);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-none px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Target Deadline
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => {
                        setDueDate(e.target.value);
                        handleFieldChange('dueDate', e.target.value);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-none px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              ) : (
                /* EMPLOYEE CLEAN READ-ONLY METADATA DISPLAY */
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Assigned By */}
                  <div className="bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                      Assigned By
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: assignorColor }}
                      >
                        {assignorName.charAt(0).toUpperCase()}
                      </span>
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 text-xs truncate block">
                          {assignorName}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {assignorRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                      Assignee
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                        style={{ backgroundColor: currentAssignee?.color || '#2563EB' }}
                      >
                        {(currentAssignee?.name || 'Unassigned').charAt(0).toUpperCase()}
                      </span>
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 text-xs truncate block">
                          {currentAssignee?.name || 'Unassigned'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {currentAssignee?.role || 'Team Member'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Project */}
                  <div className="bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                      Project
                    </span>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: currentProject?.color || '#06B6D4' }}
                      />
                      <span className="font-semibold text-slate-800 text-xs truncate">
                        {currentProject?.name || 'Project'}
                      </span>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                      Priority
                    </span>
                    <div className="pt-0.5">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-bold border ${priorityBadgeStyle}`}>
                        {priority}
                      </span>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                      Start Date
                    </span>
                    <span className="font-semibold text-slate-800 text-xs block">
                      {formatDisplayDate(startDate) || 'Not set'}
                    </span>
                  </div>

                  {/* Target Deadline */}
                  <div className="bg-slate-50 p-3 border border-slate-200">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                      Target Deadline
                    </span>
                    <span
                      className={`font-semibold text-xs block ${
                        isOverdue ? 'text-rose-600 font-extrabold' : 'text-slate-800'
                      }`}
                    >
                      {formatDisplayDate(dueDate) || 'Not set'}
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 font-serif block mb-1.5">
                  Description
                </label>
                {!isEmployee ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    rows={4}
                    placeholder="Task details and instructions..."
                    className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-none p-3 focus:outline-none focus:border-emerald-600 focus:bg-white resize-none"
                  />
                ) : (
                  <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap py-1">
                    {description || <span className="text-slate-400 italic">No description provided for this task.</span>}
                  </p>
                )}
              </div>

              {/* Attachments Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 font-serif flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    Attachments ({taskAttachments.length})
                  </label>

                  <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none cursor-pointer transition flex items-center gap-1">
                    <Paperclip className="w-3 h-3 text-emerald-600" />
                    <span>Upload File</span>
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {taskAttachments.length > 0 ? (
                  <div className="space-y-2">
                    {taskAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between bg-slate-50 p-2.5 border border-slate-200 rounded-none text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-cyan-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 truncate block">
                              {att.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {att.fileSize} • Uploaded by {att.uploadedBy}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {att.dataUrl && (
                            <a
                              href={att.dataUrl}
                              download={att.fileName}
                              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-none transition"
                              title="Download Attachment"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {(!isEmployee || att.uploadedBy === user?.name) && (
                            <button
                              onClick={() => removeAttachmentFromTask(selectedTask.id, att.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-none transition"
                              title="Delete Attachment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-none text-xs text-slate-400">
                    No files attached yet
                  </div>
                )}
              </div>

              {/* Comments Stream */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 font-serif flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  Activity Comments ({taskComments.length})
                </label>

                {/* Comment List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {taskComments.map((c) => {
                    const author = teamMembers.find(
                      (m) =>
                        m.id === c.authorId ||
                        (c.authorId && m.email && m.email.trim().toLowerCase() === c.authorId.trim().toLowerCase())
                    );
                    const authorName = author?.name || (c.authorId.includes('@') ? c.authorId.split('@')[0] : 'Team Member');
                    return (
                      <div
                        key={c.id}
                        className="bg-slate-50 p-3 border border-slate-200 rounded-none space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: author?.color || '#10B981' }}
                            />
                            {authorName}
                          </span>
                          <span className="text-slate-400">
                            {new Date(c.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">{c.text}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-none px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-none transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* TAB 2: ACTIVITY LOG AUDIT STREAM */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-700 font-serif block">
                Audit History & Event Timeline
              </span>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                {taskActivities.map((act) => (
                  <div key={act.id} className="relative flex items-start gap-3 pl-7">
                    <div
                      className="absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ring-1 ring-slate-300 shrink-0"
                      style={{ backgroundColor: act.userColor || '#059669' }}
                    />

                    <div className="bg-slate-50 p-3 border border-slate-200 rounded-none flex-1 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-900">{act.userName}</span>
                        <span className="text-slate-400">
                          {formatDistanceToNow(parseISO(act.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{act.details}</p>
                    </div>
                  </div>
                ))}

                {taskActivities.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 italic">
                    No activity recorded yet for this task
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
