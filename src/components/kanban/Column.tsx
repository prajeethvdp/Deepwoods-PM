import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { STATUS_CONFIG } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
}

export const Column: React.FC<ColumnProps> = ({ status, tasks, onAddTask }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { isEmployee } = useAuth();

  const config = STATUS_CONFIG[status];
  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-0 min-h-0 w-full bg-[#F7F8FA] rounded-lg border transition-all duration-150 h-full ${
        isOver ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-slate-800 font-sans">
            {config.label}
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center leading-none shadow-xs">
            {tasks.length}
          </span>
        </div>

        {!isEmployee && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onAddTask(status)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              title={`Add task to ${status}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Cards Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-2.5">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">
              No tasks here
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </SortableContext>
      </div>

      {/* Footer: + New */}
      {!isEmployee && (
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={() => onAddTask(status)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold transition py-1 w-full"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      )}
    </div>
  );
};
