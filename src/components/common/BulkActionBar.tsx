import React, { useState } from 'react';
import {
  CheckSquare,
  User,
  AlertCircle,
  Calendar,
  Trash2,
  X,
  ChevronDown,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Priority, TaskStatus } from '../../types';

export const BulkActionBar: React.FC = () => {
  const {
    selectedTaskIds,
    clearTaskSelection,
    bulkUpdateTasks,
    bulkDeleteTasks,
    teamMembers,
  } = useData();

  const { isEmployee } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const assignableMembers = teamMembers.filter((m) => m.role !== 'Admin');

  if (selectedTaskIds.length === 0) return null;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    bulkUpdateTasks(selectedTaskIds, { status: val as TaskStatus });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    bulkUpdateTasks(selectedTaskIds, { priority: val as Priority });
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    bulkUpdateTasks(selectedTaskIds, { assigneeId: val });
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    bulkUpdateTasks(selectedTaskIds, { dueDate: val });
  };

  const handleConfirmDelete = () => {
    bulkDeleteTasks(selectedTaskIds);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-none shadow-2xl px-5 py-3 border border-slate-700/80 select-none flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
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
            onChange={handleAssigneeChange}
            defaultValue=""
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-none border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer transition appearance-none pr-7"
          >
            <option value="" disabled>Reassign To...</option>
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
          onChange={handleStatusChange}
          defaultValue=""
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-none border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer transition appearance-none pr-7"
        >
          <option value="" disabled>Status...</option>
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
            onChange={handlePriorityChange}
            defaultValue=""
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-none border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer transition appearance-none pr-7"
          >
            <option value="" disabled>Priority...</option>
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
        <div className="relative flex items-center">
          <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-none border border-slate-700 cursor-pointer flex items-center gap-1.5 transition">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Set Due Date</span>
            <input
              type="date"
              onChange={handleDueDateChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      )}

      {/* Action 5: Delete (Admin & PM only) */}
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
        onClick={clearTaskSelection}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-none transition ml-2 border-l border-slate-700/80 pl-3"
        title="Clear Selection"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
