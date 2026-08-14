import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Folder,
  Plus,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { isTaskAssignedToUser, matchesAssigneeFilter } from '../../lib/permissions';
import { Task, TaskStatus } from '../../types';
import { STATUS_CONFIG } from '../../lib/constants';

interface CalendarViewProps {
  onAddDateTask?: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onAddDateTask }) => {
  const { tasks, projects, teamMembers, openTaskDetail, filterOptions } = useData();
  const { user, isEmployee } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  const canAddTask = !isEmployee && !!onAddDateTask;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month & total days
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust so Monday is index 0
  const adjustedFirstDay = (firstDayIndex + 6) % 7;
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Scheduled tasks filtering — uses global header search
  const filteredTasks = tasks.filter((t) => {
    if (isEmployee && user && !isTaskAssignedToUser(t, user)) return false;
    const matchesSearch = !filterOptions.searchQuery ||
      t.title.toLowerCase().includes(filterOptions.searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(filterOptions.searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesAssignee = matchesAssigneeFilter(t, assigneeFilter !== 'ALL' ? assigneeFilter : filterOptions.assigneeId, teamMembers);
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const getTasksForDay = (dayNumber: number): Task[] => {
    const formattedDay = dayNumber < 10 ? `0${dayNumber}` : `${dayNumber}`;
    const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return filteredTasks.filter((t: Task) => t.dueDate === dateStr);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 text-slate-800 select-none overflow-hidden font-sans">
      {/* Top Filter & Control Header Bar - Clean Light Aesthetic */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 shadow-xs">
        {/* Left: Date Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={today}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl border border-slate-200 transition"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-extrabold text-slate-900 min-w-[110px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Filters */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-cyan-500 cursor-pointer font-semibold"
          >
            <option value="ALL">All Assignees</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-cyan-500 cursor-pointer font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>

      {/* Main Calendar Area - Clean White Grid */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 p-4">
        <div className="flex-1 flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
            {dayNames.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200/80 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid Days Container */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
            {/* Blank leading days */}
            {Array.from({ length: adjustedFirstDay }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="bg-slate-50/50 border-r border-b border-slate-200/70 p-2 opacity-50"
              />
            ))}

            {/* Month Days */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayTasks = getTasksForDay(dayNum);
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
              const cellDateStr = `${year}-${formattedMonth}-${formattedDay}`;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={(e) => {
                    // Only trigger if cell background clicked directly
                    if (e.target === e.currentTarget && canAddTask && onAddDateTask) {
                      onAddDateTask(cellDateStr);
                    }
                  }}
                  className={`group/cell border-r border-b border-slate-200/70 p-2 flex flex-col min-h-[90px] overflow-hidden transition-all ${
                    isToday ? 'bg-cyan-50/40' : 'bg-white hover:bg-slate-50/60'
                  }`}
                >
                  {/* Date Badge & Add Task Button */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-extrabold w-6 h-6 rounded-lg flex items-center justify-center ${
                          isToday
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {canAddTask && onAddDateTask && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddDateTask(cellDateStr);
                          }}
                          className="opacity-0 group-hover/cell:opacity-100 p-1 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-md transition text-[10px] font-bold flex items-center gap-0.5"
                          title={`Add task for ${cellDateStr}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Items in Cell - Clean 1-Line Title Pills */}
                  <div className="flex-1 space-y-1 overflow-y-auto pr-0.5 max-h-[110px]">
                    {dayTasks.map((task) => {
                      const proj = projects.find((p) => p.id === task.projectId);
                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDetail(task);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100/90 border border-slate-200/80 hover:bg-cyan-50 hover:border-cyan-300 text-xs font-semibold text-slate-800 hover:text-cyan-700 cursor-pointer transition-all shadow-2xs truncate flex items-center gap-1.5"
                          title={`${task.title} (${task.status} • ${task.priority} Priority)`}
                        >
                          {proj && (
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: proj.color }}
                            />
                          )}
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
