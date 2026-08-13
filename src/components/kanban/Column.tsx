import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { STATUS_CONFIG } from '../../lib/constants';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
}

export const Column: React.FC<ColumnProps> = ({ status, tasks, onAddTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const config = STATUS_CONFIG[status];
  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 bg-white rounded-3xl p-4 border transition-all duration-150 flex-shrink-0 h-[calc(100vh-14rem)] shadow-xs ${
        isOver ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <h3 className="font-bold text-xs text-slate-800 tracking-tight uppercase">
            {config.label}
          </h3>
          <span className="text-[11px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTask(status)}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded-md transition"
          title={`Add task to ${status}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Scrollable Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="h-28 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">
              No tasks in {status}
            </div>
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </SortableContext>
      </div>

      {/* Column Footer: Quick Add Button */}
      <div className="pt-3 border-t border-slate-200/60 mt-2">
        <button
          onClick={() => onAddTask(status)}
          className="w-full py-1.5 px-3 rounded-lg border border-dashed border-slate-300 hover:border-cyan-500 text-slate-500 hover:text-cyan-600 hover:bg-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
};
