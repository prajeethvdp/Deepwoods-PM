import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckCircle2, CheckSquare, Sparkles } from 'lucide-react';
import { Task } from '../../types';
import { useData } from '../../context/DataContext';
import { PRIORITY_CONFIG } from '../../lib/constants';
import { isBefore, startOfDay } from 'date-fns';
import { toYYYYMMDD, formatDateRangeDisplay, formatDisplayDate } from '../../lib/dateUtils';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { openTaskDetail, projects, teamMembers } = useData();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const project = projects.find((p) => p.id === task.projectId);
  const assignee = teamMembers.find((m) => m.id === task.assigneeId);
  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;

  const today = startOfDay(new Date());
  const dueYmd = toYYYYMMDD(task.dueDate);
  const taskDueDate = dueYmd ? startOfDay(new Date(dueYmd)) : null;
  const isOverdue = taskDueDate && isBefore(taskDueDate, today) && task.status !== 'Done';

  const isDone = task.status === 'Done';
  const completedDateText = isDone ? formatDisplayDate(task.dueDate || task.updatedAt || task.startDate) : '';
  const dateRangeText = formatDateRangeDisplay(task.startDate, task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => openTaskDetail(task)}
      className={`group bg-white rounded-xl p-3.5 border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md select-none ${
        isOverdue
          ? 'border-l-4 border-l-red-500 border-r-slate-200 border-t-slate-200 border-b-slate-200 bg-red-50/10'
          : isDone
          ? 'border-emerald-200/80 hover:border-emerald-300 bg-emerald-50/5'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top: Project Indicator & Priority Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: project?.color || '#06B6D4' }}
          />
          <span className="text-[10px] font-semibold text-slate-500 truncate">
            {project?.name || 'Project'}
          </span>
        </div>

        <span
          className={`inline-flex items-center justify-center text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap leading-none ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-xs text-slate-900 leading-snug mb-2 group-hover:text-cyan-600 transition">
        {task.title}
      </h3>

      {/* Subtasks Progress Bar & Story Points */}
      {(task.storyPoints || (task.subtasks && task.subtasks.length > 0)) && (
        <div className="space-y-1 mb-2.5">
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3 h-3 text-cyan-600" />
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                </span>
                <span>
                  {Math.round((task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{
                    width: `${(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
          {task.storyPoints && (
            <div className="flex items-center justify-end">
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200/60 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-500" />
                {task.storyPoints} {task.storyPoints === 1 ? 'pt' : 'pts'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer: Date & Assignee Avatar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-1 min-w-0 truncate">
          {isDone ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate text-[10px] text-emerald-700 font-semibold">
                Completed: {completedDateText}
              </span>
            </>
          ) : (
            <>
              <Calendar className={`w-3 h-3 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
              <span className={`truncate text-[10px] ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600 font-medium'}`}>
                {dateRangeText}
              </span>
              {isOverdue && (
                <span className="bg-red-100 text-red-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ml-1 flex-shrink-0">
                  Overdue
                </span>
              )}
            </>
          )}
        </div>

        {assignee && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-xs border border-white flex-shrink-0"
            style={{ backgroundColor: assignee.color }}
            title={`Assigned to ${assignee.name}`}
          >
            {assignee.name.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );
};

