import React, { useState } from 'react';
import {
  UserCheck,
  Calendar,
  Trash2,
  X,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { isDeadlineBeforeStartDate } from '../../lib/dateUtils';

export const BulkActionBar: React.FC = () => {
  const {
    tasks,
    selectedTaskIds,
    clearTaskSelection,
    bulkUpdateTasks,
    bulkDeleteTasks,
    teamMembers,
  } = useData();

  const { isEmployee } = useAuth();

  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedDueDate, setSelectedDueDate] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const assignableMembers = teamMembers.filter((m) => m.role !== 'Admin');
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  if (selectedTaskIds.length === 0) return null;

  const hasPendingChanges = Boolean(
    selectedAssigneeId || selectedStatus || selectedPriority || selectedDueDate
  );

  const handleDatePickerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === 'function') {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      } catch (err) {
        dateInputRef.current.focus();
      }
    }
  };

  const handleApplyChanges = async () => {
    if (!hasPendingChanges || isApplying) return;

    if (selectedDueDate) {
      const invalidTask = tasks.find(
        (t) => selectedTaskIds.includes(t.id) && isDeadlineBeforeStartDate(t.startDate, selectedDueDate)
      );
      if (invalidTask) {
        setBulkError(`Target deadline cannot be earlier than start date for "${invalidTask.title}".`);
        return;
      }
    }

    setBulkError(null);
    setIsApplying(true);

    try {
      const updates: Record<string, any> = {};
      if (selectedAssigneeId) updates.assigneeId = selectedAssigneeId;
      if (selectedStatus) updates.status = selectedStatus;
      if (selectedPriority) updates.priority = selectedPriority;
      if (selectedDueDate) updates.dueDate = selectedDueDate;

      await bulkUpdateTasks(selectedTaskIds, updates);

      // Reset state
      setSelectedAssigneeId('');
      setSelectedStatus('');
      setSelectedPriority('');
      setSelectedDueDate('');
      setBulkError(null);
    } finally {
      setIsApplying(false);
    }
  };

  const handleConfirmDelete = () => {
    bulkDeleteTasks(selectedTaskIds);
    setShowDeleteConfirm(false);
  };

  const handleClearSelection = () => {
    setSelectedAssigneeId('');
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedDueDate('');
    setBulkError(null);
    clearTaskSelection();
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-none shadow-2xl px-5 py-3 border border-slate-700/80 select-none flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
      {bulkError && (
        <div className="bg-rose-950/90 border border-rose-700 text-rose-200 px-3 py-1.5 rounded-none text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{bulkError}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
      {/* Count Indicator */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-700/80">
        <div className="w-6 h-6 rounded-none bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
          {selectedTaskIds.length}
        </div>
        <span className="text-xs font-bold text-slate-200 font-serif">
          {selectedTaskIds.length === 1 ? 'Task Selected' : 'Tasks Selected'}
        </span>
      </div>

      {/* Action 1: Reassign (Admin & PM only) */}
      {!isEmployee && (
        <div className="relative flex items-center">
          <select
            value={selectedAssigneeId}
            onChange={(e) => setSelectedAssigneeId(e.target.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-none border focus:outline-none focus:border-emerald-500 cursor-pointer transition appearance-none pr-7 ${
              selectedAssigneeId
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <option value="">Reassign To...</option>
            {assignableMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>
      )}

      {/* Action 2: Status (Available for all roles) */}
      <div className="relative flex items-center">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={`text-xs font-medium px-3 py-1.5 rounded-none border focus:outline-none focus:border-emerald-500 cursor-pointer transition appearance-none pr-7 ${
            selectedStatus
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <option value="">Status...</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="In Review">In Review</option>
          <option value="Done">Done</option>
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
      </div>

      {/* Action 3: Priority (Admin & PM only) */}
      {!isEmployee && (
        <div className="relative flex items-center">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-none border focus:outline-none focus:border-emerald-500 cursor-pointer transition appearance-none pr-7 ${
              selectedPriority
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <option value="">Priority...</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>
      )}

      {/* Action 4: Due Date (Admin & PM only) */}
      {!isEmployee && (
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={handleDatePickerClick}
            className={`text-xs font-medium px-3 py-1.5 rounded-none border cursor-pointer flex items-center gap-1.5 transition ${
              selectedDueDate
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{selectedDueDate ? `Due: ${selectedDueDate}` : 'Set Due Date'}</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDueDate}
            onChange={(e) => setSelectedDueDate(e.target.value)}
            className="sr-only absolute"
          />
          {selectedDueDate && (
            <button
              type="button"
              onClick={() => setSelectedDueDate('')}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-none transition"
              title="Clear date"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Action 5: Explicit Reassign & Apply Button */}
      <button
        type="button"
        onClick={handleApplyChanges}
        disabled={!hasPendingChanges || isApplying}
        className={`px-4 py-1.5 text-xs font-extrabold transition flex items-center gap-1.5 rounded-none border cursor-pointer ${
          hasPendingChanges
            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-md shadow-emerald-950/50'
            : 'bg-slate-800/60 text-slate-500 border-slate-700/60 cursor-not-allowed'
        }`}
      >
        {isApplying ? (
          <span className="inline-block animate-spin font-sans font-normal">...</span>
        ) : (
          <UserCheck className="w-3.5 h-3.5" />
        )}
        <span>{selectedAssigneeId ? 'Reassign & Apply' : 'Apply Changes'}</span>
      </button>

      {/* Action 6: Delete (Admin & PM only) */}
      {!isEmployee && (
        !showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-bold px-3 py-1.5 rounded-none transition flex items-center gap-1.5 cursor-pointer ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 bg-rose-950 p-1 border border-rose-700">
            <span className="text-[11px] text-rose-200 px-1 font-bold">Confirm Delete?</span>
            <button
              onClick={handleConfirmDelete}
              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold rounded-none"
            >
              Yes
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-none"
            >
              No
            </button>
          </div>
        )
      )}

      {/* Close Selection */}
      <button
        onClick={handleClearSelection}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-none transition ml-2 border-l border-slate-700/80 pl-3"
        title="Clear Selection"
      >
        <X className="w-4 h-4" />
      </button>
      </div>
    </div>
  );
};

