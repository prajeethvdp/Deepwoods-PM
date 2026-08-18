import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Paperclip, MessageSquare, CheckSquare } from 'lucide-react';
import { Task } from '../../types';
import { useData } from '../../context/DataContext';
import { differenceInDays, startOfDay, parseISO } from 'date-fns';

interface TaskCardProps {
  task: Task;
}

const getPriorityStyle = (priority: string): { bg: string; text: string; border: string; label: string } => {
  switch (priority) {
    case 'Urgent':
      return { bg: 'bg-red-50', text: 'text-red-600', border: 'border border-red-200', label: 'Urgent' };
    case 'High':
      return { bg: 'bg-red-50', text: 'text-red-500', border: 'border border-red-200', label: 'High' };
    case 'Medium':
      return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border border-amber-200', label: 'Medium' };
    case 'Low':
      return { bg: 'bg-green-50', text: 'text-green-600', border: 'border border-green-200', label: 'Low' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border border-slate-200', label: priority };
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { openTaskDetail, projects, teamMembers, comments, selectedTaskIds, toggleSelectTask } = useData();
  const isSelected = selectedTaskIds.includes(task.id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const project = projects.find((p) => p.id === task.projectId);
  const assignee = teamMembers.find((m) => m.id === task.assigneeId);
  const priorityStyle = getPriorityStyle(task.priority);

  const today = startOfDay(new Date());

  // Days remaining calculation
  let daysLabel = '';
  let isOverdue = false;
  if (task.dueDate) {
    const due = parseISO(task.dueDate);
    const diff = differenceInDays(due, today);
    if (diff < 0) {
      daysLabel = `${Math.abs(diff)}d overdue`;
      isOverdue = true;
    } else if (diff === 0) {
      daysLabel = 'Due today';
    } else if (diff === 1) {
      daysLabel = '1d left';
    } else {
      daysLabel = `${diff}d left`;
    }
  } else if (task.startDate) {
    const start = parseISO(task.startDate);
    const diff = differenceInDays(start, today);
    if (diff === 0) {
      daysLabel = 'Starts today';
    } else if (diff > 0) {
      daysLabel = `Starts in ${diff}d`;
    } else {
      daysLabel = '';
    }
  }

  const cleanId = (str: any): string => String(str || '').replace(/[\r\n\t]/g, '').trim();
  const attachCount = task.attachments?.length || 0;
  const commentCount = comments.filter((c) => cleanId(c.taskId) === cleanId(task.id)).length;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelectTask(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => openTaskDetail(task)}
      className={`rounded-none p-3.5 border transition-all duration-150 cursor-pointer select-none group relative ${
        isSelected
          ? 'bg-emerald-50/40 ring-2 ring-emerald-500 border-emerald-500 shadow-sm'
          : 'bg-white border-slate-200/60 shadow-xs hover:shadow-sm'
      }`}
    >
      {/* Row 1: Checkbox + Avatar (top-left) + Days (top-right) */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onClick={handleCheckboxClick}
            onChange={() => {}}
            className="w-3.5 h-3.5 rounded-none text-emerald-600 border-slate-300 focus:ring-0 cursor-pointer opacity-70 group-hover:opacity-100 transition"
            title="Select Task for Bulk Action"
          />
          {assignee ? (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-xs flex-shrink-0"
              style={{ backgroundColor: assignee.color }}
              title={assignee.name}
            >
              {assignee.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              ?
            </div>
          )}
        </div>

        {daysLabel && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${
            isOverdue ? 'text-red-500' : task.status === 'Done' ? 'text-emerald-600' : 'text-slate-400'
          }`}>
            <Clock className="w-3 h-3 flex-shrink-0" />
            {daysLabel}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-[13px] text-slate-900 leading-snug mb-1.5 group-hover:text-cyan-700 transition line-clamp-2 font-serif">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Project indicator */}
      {project && (
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color || '#06B6D4' }} />
          <span className="text-[10px] font-semibold text-slate-400 truncate">{project.name}</span>
        </div>
      )}

      {/* Footer: Attach count + Subtask count + Priority badge */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
          <span className="flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            {attachCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {commentCount}
          </span>
        </div>

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded leading-none ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}>
          {priorityStyle.label}
        </span>
      </div>
    </div>
  );
};
