import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { isTaskAssignedToUser, matchesAssigneeFilter } from '../lib/permissions';
import { sortTasksNewestFirst } from '../lib/sheets';
import { Priority, Task, TaskStatus } from '../types';
import {
  Calendar,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Plus,
  Target,
  Flag,
  Clock,
  AlertCircle,
  CircleDot,
  SlidersHorizontal,
} from 'lucide-react';
import { isBefore, parseISO, startOfDay, format } from 'date-fns';

interface ListViewPageProps {
  isMyTasksView?: boolean;
  openTaskModalWithStatus?: (status: TaskStatus) => void;
}

const safeParseDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const parsed = parseISO(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
    const fallback = new Date(trimmed);
    return !isNaN(fallback.getTime()) ? fallback : null;
  } catch {
    return null;
  }
};

const formatDateNice = (dateStr: string | undefined | null): string => {
  const d = safeParseDate(dateStr);
  if (!d) return '—';
  return format(d, 'dd MMM yyyy');
};

export const ListViewPage: React.FC<ListViewPageProps> = ({
  isMyTasksView = false,
  openTaskModalWithStatus,
}) => {
  const { tasks, projects, teamMembers, openTaskDetail, selectedProjectId, filterOptions } = useData();
  const { user, isEmployee } = useAuth();

  // Collapsible state for each status section
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'To Do': false,
    'In Progress': false,
    'In Review': false,
    Done: false,
  });

  const toggleSection = (statusKey: string) => {
    setCollapsedSections((prev) => ({ ...prev, [statusKey]: !prev[statusKey] }));
  };

  const today = startOfDay(new Date());

  // Filter tasks based on global filter settings, sorted newest first
  const filteredTasks = sortTasksNewestFirst(
    tasks.filter((t) => {
      if ((isEmployee || isMyTasksView) && user && !isTaskAssignedToUser(t, user)) return false;
      if (selectedProjectId !== 'ALL' && t.projectId !== selectedProjectId) return false;
      if (
        filterOptions.searchQuery &&
        !t.title.toLowerCase().includes(filterOptions.searchQuery.toLowerCase()) &&
        !t.description.toLowerCase().includes(filterOptions.searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (!isMyTasksView && !matchesAssigneeFilter(t, filterOptions.assigneeId, teamMembers)) return false;
      if (filterOptions.priority !== 'All' && t.priority !== filterOptions.priority) return false;
      if (filterOptions.status !== 'All' && t.status !== filterOptions.status) return false;
      if (!isMyTasksView && filterOptions.myTasksOnly && user && !isTaskAssignedToUser(t, user)) return false;
      return true;
    })
  );

  // Group status configurations (Matching exact DB Status Strings & clean styling)
  const statusGroups: {
    statusKey: TaskStatus;
    title: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badgeBg: string;
    icon: React.ReactNode;
  }[] = [
    {
      statusKey: 'To Do',
      title: 'To Do',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-900',
      badgeBg: 'bg-slate-100 text-slate-700',
      icon: <CircleDot className="w-4 h-4 text-sky-600" />,
    },
    {
      statusKey: 'In Progress',
      title: 'In Progress',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-900',
      badgeBg: 'bg-amber-50 text-amber-700 border border-amber-200',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
    },
    {
      statusKey: 'In Review',
      title: 'In Review',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-900',
      badgeBg: 'bg-purple-50 text-purple-700 border border-purple-200',
      icon: <AlertCircle className="w-4 h-4 text-purple-600" />,
    },
    {
      statusKey: 'Done',
      title: 'Done',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-900',
      badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    },
  ];

  return (
    <div className="w-full min-h-full bg-[#EEF2F6] p-4 md:p-5 space-y-4 text-slate-800 font-sans select-none">
      {statusGroups.map((group) => {
        const groupTasks = filteredTasks.filter((t: Task) => t.status === group.statusKey);
        const isCollapsed = collapsedSections[group.statusKey];

        return (
          <div
            key={group.statusKey}
            className="bg-white rounded-none border border-slate-200/80 shadow-2xs overflow-hidden transition-all duration-200"
          >
            {/* Section Banner Header Bar */}
            <div
              className={`px-5 py-3.5 flex items-center justify-between cursor-pointer border-b ${group.bgColor} ${group.borderColor} transition hover:bg-slate-50/80`}
              onClick={() => toggleSection(group.statusKey)}
            >
              <div className="flex items-center gap-2.5">
                <button type="button" className="text-slate-500 hover:text-slate-800 transition">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {group.icon}
                  <span className={`font-extrabold text-sm ${group.textColor}`}>
                    {group.title}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-black shadow-2xs ${group.badgeBg}`}
                >
                  {groupTasks.length}
                </span>
              </div>

              {/* Action Button: Add Task to specific status (Hidden for Employees) */}
              {!isEmployee && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (openTaskModalWithStatus) {
                      openTaskModalWithStatus(group.statusKey);
                    }
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                  title={`Add task to ${group.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Section Data Table */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] bg-slate-50/40">
                      <th className="py-3 px-5">
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-slate-400" />
                          <span>Task name</span>
                        </div>
                      </th>
                      <th className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Assignee</span>
                        </div>
                      </th>
                      <th className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Assignor</span>
                        </div>
                      </th>
                      <th className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Start</span>
                        </div>
                      </th>
                      <th className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Due Date</span>
                        </div>
                      </th>
                      <th className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                          <span>Priority</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 text-right"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 font-medium">
                    {groupTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                          No tasks in {group.title}.
                        </td>
                      </tr>
                    ) : (
                      groupTasks.map((task: Task) => {
                        const assignee = teamMembers.find((m) => m.id === task.assigneeId);
                        const assignorMember = teamMembers.find(
                          (m) =>
                            (task.assignorId && m.id === task.assignorId) ||
                            (task.assignorEmail && m.email.trim().toLowerCase() === task.assignorEmail.trim().toLowerCase()) ||
                            (task.assignorName && m.name.trim().toLowerCase() === task.assignorName.trim().toLowerCase())
                        );
                        const fallbackAdminOrLead = teamMembers.find((m) => m.role === 'Admin' || m.role === 'Product Manager') || teamMembers[0];
                        const assignorName = assignorMember?.name || task.assignorName || (task.assignorEmail?.includes('@') ? task.assignorEmail.split('@')[0] : fallbackAdminOrLead?.name || 'Assignor');
                        const assignorColor = assignorMember?.color || fallbackAdminOrLead?.color || '#059669';

                        const isOverdue =
                          task.dueDate &&
                          isBefore(parseISO(task.dueDate), today) &&
                          task.status !== 'Done';

                        // Priority Badge Styles (Clean outline transparent bg)
                        const priorityBadge =
                          task.priority === 'High' || task.priority === 'Urgent'
                            ? { bg: 'bg-transparent', text: 'text-rose-600', border: 'border-rose-300' }
                            : task.priority === 'Medium'
                            ? { bg: 'bg-transparent', text: 'text-amber-600', border: 'border-amber-300' }
                            : { bg: 'bg-transparent', text: 'text-blue-600', border: 'border-blue-300' };

                        const attachCount = task.attachments ? task.attachments.length : 0;

                        return (
                          <tr
                            key={task.id}
                            onClick={() => openTaskDetail(task)}
                            className="hover:bg-slate-50/80 cursor-pointer transition group"
                          >
                            {/* Task Name + Project */}
                            <td className="py-3.5 px-5 max-w-xs">
                              <div className="font-bold text-slate-900 group-hover:text-cyan-600 transition truncate">
                                {task.title}
                              </div>
                              {(() => {
                                const proj = projects.find((p) => p.id === task.projectId);
                                return proj ? (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: proj.color || '#06B6D4' }}
                                    />
                                    <span className="text-[10px] text-slate-400 font-medium truncate">{proj.name}</span>
                                  </div>
                                ) : null;
                              })()}
                            </td>

                            {/* Assignee */}
                            <td className="py-3.5 px-4">
                              {assignee ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-2xs flex-shrink-0"
                                    style={{ backgroundColor: assignee.color }}
                                  >
                                    {assignee.name.charAt(0)}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-700 truncate">
                                    {assignee.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                              )}
                            </td>

                            {/* Assignor */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-slate-200 flex-shrink-0"
                                  style={{ backgroundColor: assignorColor }}
                                >
                                  {assignorName.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-xs font-semibold text-slate-700 truncate">
                                  {assignorName}
                                </span>
                              </div>
                            </td>

                            {/* Start Date */}
                            <td className="py-3.5 px-4 text-slate-600 font-semibold whitespace-nowrap">
                              {formatDateNice(task.startDate || task.createdAt)}
                            </td>

                            {/* Due Date */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`font-semibold ${
                                  isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'
                                }`}
                              >
                                {formatDateNice(task.dueDate)}
                              </span>
                            </td>

                            {/* Priority Pill Badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${priorityBadge.bg} ${priorityBadge.text} ${priorityBadge.border}`}
                              >
                                <Flag className="w-3 h-3 fill-current stroke-none" />
                                <span>{task.priority}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
