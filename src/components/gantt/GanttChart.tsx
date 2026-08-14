import React, { useMemo, useState } from 'react';
import {
  parseISO,
  differenceInDays,
  addDays,
  format,
  isSameDay,
  startOfDay,
  isBefore,
  min as minDate,
  max as maxDate,
} from 'date-fns';
import { useData } from '../../context/DataContext';
import { Task, TaskStatus } from '../../types';
import { AlertCircle, Calendar, ZoomIn, ZoomOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isTaskAssignedToUser, matchesAssigneeFilter } from '../../lib/permissions';

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

interface GanttChartProps {
  isMyTasksView?: boolean;
}

export const GanttChart: React.FC<GanttChartProps> = ({ isMyTasksView = false }) => {
  const { tasks, projects, teamMembers, openTaskDetail, selectedProjectId, filterOptions } = useData();
  const { user, isEmployee } = useAuth();
  
  const [dayWidth, setDayWidth] = useState<number>(55); // 55px per day default for spacious layout

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
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
      if (!isMyTasksView && filterOptions.myTasksOnly && user && t.assigneeId !== user.id) return false;
      return true;
    });
  }, [tasks, selectedProjectId, filterOptions, user, isMyTasksView, teamMembers]);

  // Group tasks by project
  const groupedTasks = useMemo(() => {
    const map = new Map<string, Task[]>();
    filteredTasks.forEach((task) => {
      const pId = task.projectId || 'unassigned';
      if (!map.has(pId)) map.set(pId, []);
      map.get(pId)!.push(task);
    });
    return map;
  }, [filteredTasks]);

  // Calculate timeline date bounds
  const today = startOfDay(new Date());

  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (filteredTasks.length === 0) {
      const start = addDays(today, -5);
      const end = addDays(today, 25);
      return { timelineStart: start, timelineEnd: end, totalDays: 30 };
    }

    const allDates: Date[] = [today];

    filteredTasks.forEach((t) => {
      const start = safeParseDate(t.startDate);
      const due = safeParseDate(t.dueDate);
      if (start) allDates.push(startOfDay(start));
      if (due) allDates.push(startOfDay(due));
    });

    const earliest = addDays(minDate(allDates), -3);
    const latest = addDays(maxDate(allDates), 5);
    const days = Math.max(14, differenceInDays(latest, earliest) + 1);

    return {
      timelineStart: earliest,
      timelineEnd: latest,
      totalDays: days,
    };
  }, [filteredTasks, today]);

  // Array of days for axis ticks
  const daysArray = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      days.push(addDays(timelineStart, i));
    }
    return days;
  }, [timelineStart, totalDays]);

  const leftSidebarWidth = 240;
  const timelineSvgWidth = totalDays * dayWidth;
  const headerHeight = 48;
  const rowHeight = 52;
  const projectHeaderHeight = 36;

  // Calculate today line x position
  const todayOffsetDays = Math.max(0, differenceInDays(today, timelineStart));
  const todayX = leftSidebarWidth + todayOffsetDays * dayWidth + dayWidth / 2;

  // Helper to calculate progress percentage
  const getTaskProgress = (task: Task): number => {
    if (task.status === 'Done') return 100;
    if (task.subtasks && task.subtasks.length > 0) {
      const completedCount = task.subtasks.filter((s) => s.completed).length;
      return Math.round((completedCount / task.subtasks.length) * 100);
    }
    if (task.status === 'In Review') return 80;
    if (task.status === 'In Progress') return 55;
    return 20; // To Do
  };

  // Color Palette per project/index (Blue, Purple, Rose, Amber)
  const pillColors = [
    { solid: '#2563EB', light: '#93C5FD', text: '#1E40AF' }, // Blue
    { solid: '#9333EA', light: '#C084FC', text: '#6B21A8' }, // Purple
    { solid: '#E11D48', light: '#F472B6', text: '#9F1239' }, // Rose Pink
    { solid: '#D97706', light: '#FCD34D', text: '#92400E' }, // Amber
  ];

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8 text-center bg-white rounded-2xl border border-slate-200 m-6">
        <Calendar className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Tasks on Timeline</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          No tasks match active filters. Create a task or adjust filters to view Gantt bars.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      {/* Zoom Toolbar */}
      <div className="mb-4 flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-600" />
          <span className="text-xs font-bold text-slate-900">Gantt Timeline Scale</span>
          <span className="text-[11px] text-slate-500">
            ({format(timelineStart, 'MMM d, yyyy')} — {format(timelineEnd, 'MMM d, yyyy')})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDayWidth((w) => Math.max(35, w - 5))}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-slate-700 min-w-16 text-center">
            {dayWidth}px / day
          </span>
          <button
            onClick={() => setDayWidth((w) => Math.min(90, w + 5))}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Gantt Canvas Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-auto relative">
        <div
          style={{ width: `${leftSidebarWidth + timelineSvgWidth}px` }}
          className="relative select-none"
        >
          {/* Header Row: Left sidebar title + Timeline Date Axis */}
          <div
            className="sticky top-0 z-20 flex bg-slate-50 border-b border-slate-200 font-medium text-xs text-slate-700"
            style={{ height: `${headerHeight}px` }}
          >
            {/* Sidebar Column Header */}
            <div
              className="sticky left-0 z-30 bg-slate-50 border-r border-slate-200 px-4 flex items-center font-bold text-slate-900 shadow-xs"
              style={{ width: `${leftSidebarWidth}px` }}
            >
              Task Title / Project
            </div>

            {/* SVG Date Ticks Axis */}
            <svg
              width={timelineSvgWidth}
              height={headerHeight}
              className="block overflow-visible"
            >
              {daysArray.map((day, index) => {
                const x = index * dayWidth;
                const isCurrentDay = isSameDay(day, today);
                const isWeekend = [0, 6].includes(day.getDay());

                return (
                  <g key={day.toISOString()} transform={`translate(${x}, 0)`}>
                    {/* Weekend shading in header */}
                    {isWeekend && (
                      <rect
                        x={0}
                        y={0}
                        width={dayWidth}
                        height={headerHeight}
                        fill="#F8FAFC"
                      />
                    )}
                    {/* Vertical grid line */}
                    <line
                      x1={0}
                      y1={0}
                      x2={0}
                      y2={headerHeight}
                      stroke="#E2E8F0"
                      strokeWidth={1}
                    />
                    {/* Date label */}
                    <text
                      x={dayWidth / 2}
                      y={20}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={isCurrentDay ? 'bold' : '600'}
                      fill={isCurrentDay ? '#0284C7' : '#64748B'}
                    >
                      {format(day, 'EEE')}
                    </text>
                    <text
                      x={dayWidth / 2}
                      y={36}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={isCurrentDay ? 'bold' : 'extrabold'}
                      fill={isCurrentDay ? '#0284C7' : '#0F172A'}
                    >
                      {format(day, 'dd')}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Gantt Rows Grouped by Project */}
          <div className="relative">
            {/* Background Grid & Today Vertical Line SVG Overlay */}
            <svg
              className="absolute left-0 top-0 pointer-events-none z-10"
              width={leftSidebarWidth + timelineSvgWidth}
              height="100%"
            >
              {/* Draw Vertical Grid Lines */}
              {daysArray.map((day, index) => {
                const x = leftSidebarWidth + index * dayWidth;
                const isWeekend = [0, 6].includes(day.getDay());
                return (
                  <g key={`grid-${index}`}>
                    {isWeekend && (
                      <rect
                        x={x}
                        y={0}
                        width={dayWidth}
                        height="100%"
                        fill="#F8FAFC"
                        opacity={0.7}
                      />
                    )}
                    <line
                      x1={x}
                      y1={0}
                      x2={x}
                      y2="100%"
                      stroke="#E2E8F0"
                      strokeWidth={1}
                    />
                  </g>
                );
              })}

              {/* TODAY Vertical Blue Line */}
              {todayX >= leftSidebarWidth && todayX <= leftSidebarWidth + timelineSvgWidth && (
                <g className="z-30">
                  <line
                    x1={todayX}
                    y1={0}
                    x2={todayX}
                    y2="100%"
                    stroke="#0284C7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </g>
              )}
            </svg>

            {/* Project Sections */}
            {Array.from(groupedTasks.entries()).map(([pId, projectTasks], pIdx) => {
              const project = projects.find((p) => p.id === pId);

              return (
                <div key={pId} className="relative z-0">
                  {/* Project Section Header Row */}
                  <div
                    className="flex bg-slate-100/80 border-y border-slate-200 font-bold text-xs text-slate-800"
                    style={{ height: `${projectHeaderHeight}px` }}
                  >
                    <div
                      className="sticky left-0 z-20 bg-slate-100 border-r border-slate-200 px-4 flex items-center gap-2 shadow-xs"
                      style={{ width: `${leftSidebarWidth}px` }}
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project?.color || '#64748B' }}
                      />
                      <span className="truncate">{project?.name || 'General Tasks'}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({projectTasks.length})
                      </span>
                    </div>
                    <div className="flex-1 bg-slate-100/30" />
                  </div>

                  {/* Task Pill Rows */}
                  {projectTasks.map((task, tIdx) => {
                    const assignee = teamMembers.find((m) => m.id === task.assigneeId);
                    const colorScheme = pillColors[(pIdx + tIdx) % pillColors.length];

                    const rawStart = safeParseDate(task.startDate) || safeParseDate(task.createdAt) || today;
                    let rawDue = safeParseDate(task.dueDate) || addDays(rawStart, 7);
                    if (isBefore(rawDue, rawStart)) {
                      rawDue = rawStart;
                    }

                    const taskStart = startOfDay(rawStart);
                    const taskDue = startOfDay(rawDue);

                    const startOffsetDays = Math.max(0, differenceInDays(taskStart, timelineStart));
                    const durationDays = Math.max(1, differenceInDays(taskDue, taskStart) + 1);

                    const barX = startOffsetDays * dayWidth;
                    const barWidth = Math.max(140, durationDays * dayWidth);
                    const progressPct = getTaskProgress(task);
                    const solidWidth = Math.max(50, Math.round((barWidth * progressPct) / 100));

                    const isTaskOverdue = isBefore(taskDue, today) && task.status !== 'Done';

                    return (
                      <div
                        key={task.id}
                        className="flex border-b border-slate-100 hover:bg-slate-50/60 transition group relative"
                        style={{ height: `${rowHeight}px` }}
                      >
                        {/* Task Title Left Sidebar Cell */}
                        <div
                          onClick={() => openTaskDetail(task)}
                          className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-r border-slate-200 px-4 flex items-center justify-between cursor-pointer shadow-xs truncate"
                          style={{ width: `${leftSidebarWidth}px` }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: colorScheme.solid }}
                            />
                            <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-cyan-600 transition">
                              {task.title}
                            </span>
                          </div>
                          {isTaskOverdue && (
                            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          )}
                        </div>

                        {/* SVG Pill Bar Canvas Container (Matching User Reference Image!) */}
                        <div className="relative flex-1">
                          <svg
                            width={timelineSvgWidth}
                            height={rowHeight}
                            className="overflow-visible"
                          >
                            <g
                              onClick={() => openTaskDetail(task)}
                              className="cursor-pointer group/pill"
                            >
                              {/* 1. Full Pill Background Light Track */}
                              <rect
                                x={barX}
                                y={10}
                                width={barWidth}
                                height={32}
                                rx={16}
                                fill={colorScheme.light}
                                opacity={0.65}
                                className="transition group-hover/pill:opacity-80"
                              />

                              {/* 2. Solid Progress Pill Fill */}
                              <rect
                                x={barX}
                                y={10}
                                width={solidWidth}
                                height={32}
                                rx={16}
                                fill={colorScheme.solid}
                                className="transition group-hover/pill:brightness-105"
                              />

                              {/* 3. Assignee Avatar Circle inside solid pill */}
                              {assignee && (
                                <g transform={`translate(${barX + 6}, 15)`}>
                                  <circle cx={11} cy={11} r={11} fill="#FFFFFF" opacity={0.35} />
                                  <text
                                    x={11}
                                    y={15}
                                    textAnchor="middle"
                                    fill="#FFFFFF"
                                    fontSize={11}
                                    fontWeight="bold"
                                  >
                                    {assignee.name.charAt(0)}
                                  </text>
                                </g>
                              )}

                              {/* 4. Task Title Text & 5. Percentage Label safely calculated without overlap */}
                              {(() => {
                                const availWidth = solidWidth - (assignee ? 76 : 50);
                                const maxChars = Math.floor(availWidth / 7.5);
                                const showTitle = maxChars >= 3;
                                const truncatedTitle = showTitle
                                  ? task.title.length > maxChars
                                    ? `${task.title.slice(0, Math.max(1, maxChars - 2))}..`
                                    : task.title
                                  : '';

                                return (
                                  <>
                                    {showTitle && (
                                      <text
                                        x={barX + (assignee ? 36 : 14)}
                                        y={30}
                                        fill="#FFFFFF"
                                        fontSize={11}
                                        fontWeight="bold"
                                        className="pointer-events-none select-none"
                                      >
                                        {truncatedTitle}
                                      </text>
                                    )}

                                    <text
                                      x={barX + solidWidth - 10}
                                      y={30}
                                      textAnchor="end"
                                      fill="#FFFFFF"
                                      fontSize={11}
                                      fontWeight="extrabold"
                                      className="pointer-events-none select-none"
                                    >
                                      {progressPct}%
                                    </text>
                                  </>
                                );
                              })()}
                            </g>
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
