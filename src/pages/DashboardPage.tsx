import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  TrendingUp,
  TrendingDown,
  Calendar,
  Folder,
  Plus,
  ArrowUpRight,
  ClipboardList,
  Check,
  Hourglass,
  User,
  Shield,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { STATUS_CONFIG } from '../lib/constants';
import { isTaskAssignedToUser, matchesAssigneeFilter } from '../lib/permissions';
import { parseISO, isBefore, isAfter, isSameDay, startOfDay, subDays, startOfMonth, endOfMonth, format } from 'date-fns';
import { TaskStatus } from '../types';

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

export const DashboardPage: React.FC = () => {
  const { tasks, projects, teamMembers, openTaskDetail, selectedProjectId, filterOptions } = useData();
  const { user, isEmployee } = useAuth();
  const [dueTab, setDueTab] = useState<'today' | 'week' | 'overdue'>('today');

  // 1. Multi-attribute Filter Application
  const activeTasks = tasks.filter((t) => {
    if (selectedProjectId !== 'ALL' && t.projectId !== selectedProjectId) return false;
    if (
      filterOptions.searchQuery &&
      !t.title.toLowerCase().includes(filterOptions.searchQuery.toLowerCase()) &&
      !t.description.toLowerCase().includes(filterOptions.searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (!matchesAssigneeFilter(t, filterOptions.assigneeId, teamMembers)) return false;
    if (filterOptions.priority !== 'All' && t.priority !== filterOptions.priority) return false;
    if (filterOptions.status !== 'All' && t.status !== filterOptions.status) return false;
    if (filterOptions.myTasksOnly && user && !isTaskAssignedToUser(t, user)) return false;
    return true;
  });

  // 2. Filter Projects for Project Overview Cards
  const displayProjects = projects.filter((p) => {
    if (selectedProjectId !== 'ALL' && p.id !== selectedProjectId) return false;
    return true;
  });

  const today = startOfDay(new Date());

  // 3. Date Preset / Range Calculation for Completed Tasks
  const datePreset = filterOptions.datePreset || 'ALL';
  const customStart = safeParseDate(filterOptions.startDate);
  const customEnd = safeParseDate(filterOptions.endDate);

  let dateSubtext = 'All Time Completed';
  let dateTitle = 'Done (All Time)';

  if (datePreset === 'TODAY') {
    dateTitle = 'Done Today';
    dateSubtext = format(today, 'MMM d, yyyy');
  } else if (datePreset === 'YESTERDAY') {
    dateTitle = 'Done Yesterday';
    dateSubtext = format(subDays(today, 1), 'MMM d, yyyy');
  } else if (datePreset === 'LAST_7_DAYS') {
    dateTitle = 'Done Last 7 Days';
    dateSubtext = `${format(subDays(today, 6), 'MMM d')} — ${format(today, 'MMM d, yyyy')}`;
  } else if (datePreset === 'LAST_30_DAYS') {
    dateTitle = 'Done Last 30 Days';
    dateSubtext = `${format(subDays(today, 29), 'MMM d')} — ${format(today, 'MMM d, yyyy')}`;
  } else if (datePreset === 'THIS_MONTH') {
    dateTitle = 'Done This Month';
    dateSubtext = `${format(startOfMonth(today), 'MMM d')} — ${format(endOfMonth(today), 'MMM d, yyyy')}`;
  } else if (customStart || customEnd) {
    dateTitle = 'Done in Selected Dates';
    const sStr = customStart ? format(customStart, 'MMM d, yyyy') : 'Beginning';
    const eStr = customEnd ? format(customEnd, 'MMM d, yyyy') : 'Present';
    dateSubtext = `${sStr} — ${eStr}`;
  }

  const completedInDateRange = activeTasks.filter((t) => {
    if (t.status !== 'Done') return false;
    if (datePreset === 'ALL' && !customStart && !customEnd) return true;

    const doneDate = safeParseDate(t.updatedAt) || safeParseDate(t.dueDate) || safeParseDate(t.startDate);
    if (!doneDate) return false;

    const dStart = startOfDay(doneDate);

    if (customStart && isBefore(dStart, startOfDay(customStart))) return false;
    if (customEnd && isAfter(dStart, startOfDay(customEnd))) return false;

    return true;
  });

  // 4. Role-Differentiated KPI Stat Calculations
  // Employees view metrics for tasks assigned to them; Admins/PMs view workspace-wide metrics.
  const relevantTasks = isEmployee && user ? activeTasks.filter((t) => isTaskAssignedToUser(t, user)) : activeTasks;

  const totalTasksCount = relevantTasks.length;
  const inProgressTasks = relevantTasks.filter((t) => t.status === 'In Progress');

  const overdueTasks = relevantTasks.filter((t) => {
    if (t.status === 'Done') return false;
    const dueDate = safeParseDate(t.dueDate);
    return dueDate && isBefore(startOfDay(dueDate), today);
  });

  const dueTodayTasks = relevantTasks.filter((t) => {
    if (t.status === 'Done') return false;
    const dueDate = safeParseDate(t.dueDate);
    return dueDate && isSameDay(startOfDay(dueDate), today);
  });

  const dueThisWeekTasks = relevantTasks.filter((t) => {
    if (t.status === 'Done') return false;
    const dueDate = safeParseDate(t.dueDate);
    if (!dueDate) return false;
    const dueStart = startOfDay(dueDate);
    const diffDays = (dueStart.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 7;
  });

  const completedInDateRangeRelevant = completedInDateRange.filter((t) =>
    isEmployee && user ? t.assigneeId === user.id : true
  );

  // Active Due Tasks list based on selected tab
  const activeDueList = dueTab === 'today' ? dueTodayTasks : dueTab === 'week' ? dueThisWeekTasks : overdueTasks;

  // 5. Donut Chart Data
  const statusCounts: Record<TaskStatus, number> = {
    'To Do': 0,
    'In Progress': 0,
    'In Review': 0,
    Done: 0,
  };

  relevantTasks.forEach((t) => {
    if (statusCounts[t.status] !== undefined) {
      statusCounts[t.status]++;
    }
  });

  const chartColors: Record<TaskStatus, string> = {
    'To Do': '#38BDF8',      // Sky Blue
    'In Progress': '#8B5CF6', // Purple
    'In Review': '#F59E0B',   // Yellow
    Done: '#84CC16',         // Lime Green
  };

  const donutData = (Object.keys(statusCounts) as TaskStatus[]).map((status) => ({
    name: status === 'To Do' ? 'Not started' : status === 'In Progress' ? 'On progress' : status === 'In Review' ? 'On review' : 'Completed',
    value: statusCounts[status],
    color: chartColors[status] || STATUS_CONFIG[status].color,
  }));

  // Card Labels based on Role
  const card1Title = isEmployee ? 'MY ASSIGNED TASKS' : 'TOTAL TASKS';
  const card1Sub = isEmployee
    ? `Personal Workload Across ${displayProjects.length} ${displayProjects.length === 1 ? 'Project' : 'Projects'}`
    : `Across ${displayProjects.length} ${displayProjects.length === 1 ? 'Project' : 'Projects'}`;

  const card2Title = isEmployee ? 'MY OVERDUE TASKS' : 'OVERDUE TASKS';
  const card2Sub = isEmployee
    ? overdueTasks.length > 0 ? 'Personal Action Required' : 'No Overdue Tasks'
    : overdueTasks.length > 0 ? 'Requires Immediate Attention' : 'All Tasks On Schedule';

  const card3Title = isEmployee ? 'MY IN PROGRESS' : 'IN PROGRESS';
  const card3Sub = isEmployee ? 'Your Active Assigned Tasks' : 'Currently Under Active Work';

  const card4Title = isEmployee ? `MY ${dateTitle.toUpperCase()}` : dateTitle.toUpperCase();
  const card4Sub = isEmployee ? `Your Accomplishments (${dateSubtext})` : dateSubtext;

  return (
    <div className="w-full min-h-full bg-[#EEF2F6] p-4 md:p-5 space-y-5 text-slate-800 font-sans select-none">
      {/* Employee Personal Command Center Hero Header */}
      {isEmployee && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 p-6 md:p-7 rounded-3xl text-white shadow-xl border border-emerald-500/20 backdrop-blur-md transition-all duration-300">
          {/* Background Decorative Ambient Glows */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute right-32 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            {/* Left: User Avatar & Hero Greeting */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-lg ring-4 ring-white/10 transition-transform duration-300 hover:scale-105"
                  style={{ backgroundColor: user?.color || '#059669' }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    EMPLOYEE WORKSTATION
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                    {format(today, 'EEEE, d MMMM yyyy')}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white font-serif tracking-tight">
                  Welcome back, {user?.name || 'Team Member'} 👋
                </h1>
                <p className="text-xs text-slate-300 font-medium">
                  Your personal command center for tracking assigned tasks, workflow progress, and deadlines.
                </p>
              </div>
            </div>

            {/* Right: Interactive Quick Metric Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3 transition-transform duration-300 hover:scale-102">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-300 font-medium">Active In Progress</div>
                  <div className="text-base font-extrabold text-white leading-tight">{inProgressTasks.length} Tasks</div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3 transition-transform duration-300 hover:scale-102">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-300 font-medium">Action Required</div>
                  <div className="text-base font-extrabold text-rose-300 leading-tight">{overdueTasks.length} Overdue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Animated KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. TOTAL / MY ASSIGNED TASKS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-32 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{card1Title}</span>
            <div className="w-8 h-8 rounded-xl border border-emerald-200 text-emerald-600 flex items-center justify-center bg-emerald-50 shadow-2xs group-hover:scale-110 transition-transform">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-extrabold text-slate-900 leading-none">{totalTasksCount}</div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold block truncate max-w-[130px]" title={card1Sub}>{card1Sub}</span>
            </div>
          </div>
        </div>

        {/* 2. OVERDUE TASKS / MY OVERDUE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-32 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{card2Title}</span>
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform ${
              overdueTasks.length > 0 ? 'border-rose-200 text-rose-600 bg-rose-50' : 'border-slate-200 text-slate-600 bg-slate-50'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className={`text-3xl font-extrabold leading-none ${overdueTasks.length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
              {overdueTasks.length}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold block truncate max-w-[130px]" title={card2Sub}>
                {card2Sub}
              </span>
            </div>
          </div>
        </div>

        {/* 3. IN PROGRESS / MY IN PROGRESS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-32 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{card3Title}</span>
            <div className="w-8 h-8 rounded-xl border border-amber-200 text-amber-600 flex items-center justify-center bg-amber-50 shadow-2xs group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-extrabold text-slate-900 leading-none">{inProgressTasks.length}</div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold block truncate max-w-[130px]" title={card3Sub}>{card3Sub}</span>
            </div>
          </div>
        </div>

        {/* 4. DONE / MY COMPLETED */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-32 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider truncate" title={card4Title}>
              {card4Title}
            </span>
            <div className="w-8 h-8 rounded-xl border border-sky-200 text-sky-600 flex items-center justify-center bg-sky-50 shadow-2xs group-hover:scale-110 transition-transform shrink-0">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-extrabold text-slate-900 leading-none">{completedInDateRangeRelevant.length}</div>
            <div className="text-right min-w-0 pl-2">
              <span className="text-[10px] text-slate-400 font-semibold block truncate" title={card4Sub}>
                {card4Sub}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Dashboard Layout (71% Left / 29% Right Ratio) */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-5 items-start">
        {/* Left Column (5/7 width = 71%) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Project Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 font-serif">Project overview</h2>
              <span className="text-xs font-semibold text-slate-400">
                {selectedProjectId === 'ALL' ? `Showing ${displayProjects.length} Projects` : `1 Project Selected`}
              </span>
            </div>

            {displayProjects.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400 italic">
                No active projects match current filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {displayProjects.map((project, idx) => {
                  const projectTasks = activeTasks.filter((t) => t.projectId === project.id);
                  const completedCount = projectTasks.filter((t) => t.status === 'Done').length;
                  const progressPct = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

                  const assignedMemberIds = new Set(projectTasks.map((t) => t.assigneeId));
                  const projectTeam = teamMembers.filter((m) => assignedMemberIds.has(m.id));
                  const displayTeam = projectTeam.length > 0 ? projectTeam : teamMembers;

                  const folderTabColors = ['#84CC16', '#8B5CF6', '#38BDF8', '#EC4899'];
                  const folderTabColor = folderTabColors[idx % folderTabColors.length];

                  return (
                    <div key={project.id} className="filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.03)] group">
                      <div
                        className="bg-white p-5 flex flex-col justify-between space-y-4 transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                          clipPath: 'polygon(0 0, 56% 0, 66% 12px, 100% 12px, 100% 100%, 0 100%)',
                          borderBottomLeftRadius: '16px',
                          borderBottomRightRadius: '16px',
                          borderTopLeftRadius: '16px',
                        }}
                      >
                        <div className="space-y-3 pt-1">
                          <div className="w-5 h-5 flex items-center justify-center">
                            <Folder className="w-5 h-5 fill-current stroke-none" style={{ color: folderTabColor }} />
                          </div>

                          <div>
                            <h3 className="font-bold text-base text-slate-900 truncate leading-tight font-serif" title={project.name}>
                              {project.name}
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                              {project.clientName || 'Deepwoods Client'}
                            </p>
                          </div>

                          {/* Real Assigned Member Avatars Stack */}
                          <div className="flex items-center -space-x-1.5">
                            {displayTeam.slice(0, 4).map((m, i) => (
                              <span
                                key={m.id}
                                className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white shrink-0"
                                style={{ backgroundColor: m.color, zIndex: 10 - i }}
                                title={m.name}
                              >
                                {m.name.charAt(0)}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Real Dynamic Progress Bar */}
                        <div className="space-y-2 pt-2 border-t border-slate-100/80">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                            <span>{completedCount} of {projectTasks.length} tasks</span>
                            <span className="font-extrabold text-slate-800">{progressPct}%</span>
                          </div>

                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%`, backgroundColor: folderTabColor }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Personal Workflow Status Pipeline for Employees */}
          {isEmployee && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>My Workflow Pipeline</span>
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  {totalTasksCount} Total Assigned {totalTasksCount === 1 ? 'Task' : 'Tasks'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(statusCounts) as TaskStatus[]).map((status) => {
                  const count = statusCounts[status];
                  const pct = totalTasksCount > 0 ? Math.round((count / totalTasksCount) * 100) : 0;
                  const statusGradients: Record<TaskStatus, string> = {
                    'To Do': 'from-sky-50 to-blue-50/50 border-sky-200 text-sky-800',
                    'In Progress': 'from-purple-50 to-indigo-50/50 border-purple-200 text-purple-800',
                    'In Review': 'from-amber-50 to-orange-50/50 border-amber-200 text-amber-800',
                    'Done': 'from-emerald-50 to-teal-50/50 border-emerald-200 text-emerald-800',
                  };
                  const barColors: Record<TaskStatus, string> = {
                    'To Do': '#38BDF8',
                    'In Progress': '#8B5CF6',
                    'In Review': '#F59E0B',
                    'Done': '#84CC16',
                  };

                  return (
                    <div
                      key={status}
                      className={`p-3.5 rounded-xl border bg-gradient-to-br ${statusGradients[status]} space-y-2 transition-transform duration-200 hover:scale-102 shadow-2xs`}
                    >
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span>{status}</span>
                        <span className="text-sm font-black">{count}</span>
                      </div>

                      <div className="w-full h-1.5 bg-white/70 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: barColors[status] }}
                        />
                      </div>

                      <div className="text-[10px] font-bold text-slate-500 text-right">
                        {pct}% of workload
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Tasks Overview Data Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 font-serif">
                {isEmployee ? 'My Assigned Tasks' : 'Tasks overview'}
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                Showing {Math.min(6, relevantTasks.length)} of {relevantTasks.length} tasks
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                    <th className="py-2.5 px-2">#</th>
                    <th className="py-2.5 px-2">Name</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2">Priority</th>
                    <th className="py-2.5 px-2">Project</th>
                    <th className="py-2.5 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {relevantTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                        {isEmployee ? 'You have no assigned tasks matching selected filters.' : 'No tasks match selected project/filters.'}
                      </td>
                    </tr>
                  ) : (
                    relevantTasks.slice(0, 6).map((task, index) => {
                      const proj = projects.find((p) => p.id === task.projectId);
                      const priorityText = task.priority;
                      const statusColors: Record<TaskStatus, string> = {
                        'To Do': 'text-slate-400',
                        'In Progress': 'text-amber-500',
                        'In Review': 'text-amber-500',
                        Done: 'text-emerald-500',
                      };

                      return (
                        <tr
                          key={task.id}
                          onClick={() => openTaskDetail(task)}
                          className="hover:bg-slate-50/80 cursor-pointer transition group"
                        >
                          <td className="py-3 px-2 text-slate-400 font-mono">
                            {String(index + 1).padStart(2, '0')}
                          </td>
                          <td className="py-3 px-2 font-semibold text-slate-900 group-hover:text-emerald-600 transition">
                            {task.title}
                          </td>
                          <td className="py-3 px-2 text-slate-400 whitespace-nowrap">
                            {task.startDate && task.dueDate ? `${task.startDate} — ${task.dueDate}` : task.dueDate || 'No Deadline'}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-bold inline-flex items-center gap-1 ${
                              priorityText === 'High' || priorityText === 'Urgent'
                                ? 'border-rose-300 text-rose-600'
                                : priorityText === 'Medium'
                                ? 'border-amber-300 text-amber-600'
                                : 'border-blue-300 text-blue-600'
                            }`}>
                              • {priorityText}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold">
                              {proj?.name || 'GHG Project'}
                            </span>
                          </td>
                          <td className={`py-3 px-2 text-right font-semibold ${statusColors[task.status]}`}>
                            {task.status === 'To Do' ? 'Not Started' : task.status === 'In Progress' ? 'On progress' : task.status === 'In Review' ? 'On review' : 'Completed'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (2/7 width = 29% - Tasks Progress Donut & Interactive Due Tasks Widget) */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Tasks Progress Donut */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 font-serif">
              {isEmployee ? 'My Task Progress' : 'Tasks progress'}
            </h2>

            <div className="relative h-40 w-full my-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} ${Number(val) === 1 ? 'task' : 'tasks'} (${totalTasksCount > 0 ? Math.round((Number(val) / totalTasksCount) * 100) : 0}%)`,
                      `${name}`,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-semibold text-slate-400">{isEmployee ? 'My Tasks' : 'Total task'}</span>
                <span className="text-2xl font-extrabold text-slate-900">{totalTasksCount}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-medium">
              {(Object.keys(statusCounts) as TaskStatus[]).map((status) => {
                const count = statusCounts[status];
                const pct = totalTasksCount > 0 ? Math.round((count / totalTasksCount) * 100) : 0;
                const label = status === 'To Do' ? 'Not started' : status === 'In Progress' ? 'On progress' : status === 'In Review' ? 'On review' : 'Completed';
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: chartColors[status] }} />
                      <span className="text-slate-500">{label}</span>
                    </div>
                    <span className="text-slate-700 font-bold">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Dedicated Interactive Due Tasks Widget (Today, This Week, Overdue) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-serif">
                <Hourglass className="w-4 h-4 text-amber-500" />
                <span>Due Tasks</span>
              </h2>
            </div>

            {/* Sub-Tabs for Due Tasks */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setDueTab('today')}
                className={`flex-1 py-1 px-2 rounded-lg transition text-center ${
                  dueTab === 'today' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Today ({dueTodayTasks.length})
              </button>
              <button
                onClick={() => setDueTab('week')}
                className={`flex-1 py-1 px-2 rounded-lg transition text-center ${
                  dueTab === 'week' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                This Week ({dueThisWeekTasks.length})
              </button>
              <button
                onClick={() => setDueTab('overdue')}
                className={`flex-1 py-1 px-2 rounded-lg transition text-center ${
                  dueTab === 'overdue' ? 'bg-white text-rose-600 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Overdue ({overdueTasks.length})
              </button>
            </div>

            {/* Task List container */}
            <div className="space-y-2 overflow-y-auto max-h-[280px] pr-1">
              {activeDueList.length === 0 ? (
                <div className="p-4 bg-slate-50/60 rounded-xl text-center text-xs text-slate-400 italic border border-dashed border-slate-200">
                  No {dueTab === 'today' ? 'tasks due today' : dueTab === 'week' ? 'tasks due this week' : 'overdue tasks'}.
                </div>
              ) : (
                activeDueList.map((task) => {
                  const assignee = teamMembers.find((m) => m.id === task.assigneeId);
                  const proj = projects.find((p) => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      onClick={() => openTaskDetail(task)}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl cursor-pointer transition flex items-center justify-between shadow-2xs group"
                    >
                      <div className="min-w-0 pr-2 space-y-1">
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-cyan-600 transition truncate">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                          <span>{proj?.name || 'Project'}</span>
                          <span>•</span>
                          <span className={dueTab === 'overdue' ? 'text-rose-500 font-bold' : 'text-amber-600'}>
                            Due: {task.dueDate}
                          </span>
                        </div>
                      </div>
                      {assignee && (
                        <span
                          className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-2xs flex-shrink-0"
                          style={{ backgroundColor: assignee.color }}
                          title={assignee.name}
                        >
                          {assignee.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
