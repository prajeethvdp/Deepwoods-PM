import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar, User, AlertCircle, Building, Plus, Paperclip, FileText, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Priority, TaskStatus, TaskAttachment } from '../../types';
import { PRIORITY_CONFIG } from '../../lib/constants';
import { toYYYYMMDD } from '../../lib/dateUtils';
import { normalizeRole } from '../../lib/permissions';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: TaskStatus;
  defaultDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  defaultStatus = 'To Do',
  defaultDate,
}) => {
  const { createTask, projects, teamMembers, selectedProjectId } = useData();
  const { user, isEmployee } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [assignorId, setAssignorId] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [startDate, setStartDate] = useState(toYYYYMMDD(new Date()));
  const [dueDate, setDueDate] = useState(
    toYYYYMMDD(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setProjectId(selectedProjectId !== 'ALL' ? selectedProjectId : projects[0]?.id || '');
      const assignable = teamMembers.filter((m) => normalizeRole(m.role) === 'Employee');
      setAssigneeId(assignable[0]?.id || teamMembers[0]?.id || '');
      const assignorMembers = teamMembers.filter((m) => {
        const norm = normalizeRole(m.role);
        return norm === 'Admin' || norm === 'Product Manager';
      });
      const defaultAssignor = assignorMembers.find((m) => m.id === user?.id) || assignorMembers[0] || user;
      setAssignorId(defaultAssignor?.id || user?.id || '');
      setPriority('Medium');
      setStatus(defaultStatus);
      const initialDate = defaultDate || toYYYYMMDD(new Date());
      setStartDate(initialDate);
      setDueDate(initialDate);
      setAttachments([]);
    }
  }, [isOpen]);

  if (!isOpen || isEmployee) return null;

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
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const selectedAssigneeMember = teamMembers.find((m) => m.id === assigneeId);
      const selectedAssignorMember = teamMembers.find((m) => m.id === assignorId);
      const activeAssignor = selectedAssignorMember || user;

      await createTask({
        title: title.trim(),
        description: description.trim(),
        projectId: projectId || projects[0]?.id || 'p-1',
        assigneeId: assigneeId || teamMembers[0]?.id || '',
        assigneeEmail: selectedAssigneeMember?.email || '',
        assignorId: activeAssignor?.id || user?.id || '',
        assignorEmail: activeAssignor?.email || user?.email || '',
        assignorName: activeAssignor?.name || user?.name || 'Assignor',
        assignorRole: activeAssignor?.role || user?.role || 'Admin',
        priority,
        status,
        startDate: toYYYYMMDD(startDate),
        dueDate: toYYYYMMDD(dueDate),
        attachments,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-none max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight font-serif">Create & Assign Task</h3>
              <p className="text-xs text-slate-500 font-medium">Specify task details, project, assignee, and dates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-none transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full bg-slate-50 border border-slate-200 rounded-none p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-600 transition"
            />
          </div>

          {/* Project & Assignee Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-none p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-none p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {teamMembers.filter((m) => m.role !== 'Admin').map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role || 'Employee'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignor & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600" /> Assigned By (Assignor)
              </label>
              <select
                value={assignorId}
                onChange={(e) => setAssignorId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-none p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {teamMembers
                  .filter((m) => {
                    const norm = normalizeRole(m.role);
                    return norm === 'Admin' || norm === 'Product Manager';
                  })
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({normalizeRole(m.role)})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-none p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-none p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Target Deadline
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-none p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, technical requirements, or instructions for the assignee..."
              className="w-full bg-slate-50 border border-slate-200 rounded-none p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition resize-none"
            />
          </div>

          {/* Attach Documents Section */}
          <div className="bg-slate-50/80 p-3.5 rounded-none border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                <span>Attach Documents</span>
              </label>
              <label className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-500 text-emerald-700 rounded-none cursor-pointer text-[11px] font-semibold transition flex items-center gap-1">
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

            {attachments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-none border border-slate-200 text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{att.fileName}</span>
                      <span className="text-[10px] text-slate-400">({att.fileSize})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-none transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-none shadow-2xs transition cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{isSaving ? 'Creating Task...' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
