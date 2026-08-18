import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Folder,
  LogOut,
  Filter,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Priority, TaskStatus } from '../../types';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../../lib/constants';
import { isTaskAssignedToUser } from '../../lib/permissions';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toYYYYMMDD, getDatePresetOptions } from '../../lib/dateUtils';

interface HeaderProps {
  currentTab: string;
  openNewTaskModal: () => void;
  openNotificationDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  openNewTaskModal,
  openNotificationDrawer,
}) => {
  const {
    tasks,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    teamMembers,
    emailNotifications,
    filterOptions,
    setFilterOptions,
    isSyncing,
    syncWithGoogleSheets,
  } = useData();
  const { user, logout, userRole, isEmployee } = useAuth();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = emailNotifications.filter((n) => {
    if (n.read) return false;
    if (!user) return true;
    const userRoleNorm = (userRole || user.role || '').toLowerCase();
    const isAdminOrPM = userRoleNorm.includes('admin') || userRoleNorm.includes('manager') || userRoleNorm.includes('lead');
    const userEmail = user.email.trim().toLowerCase();

    // Admins, PMs, and Workspace Leads see all unread notifications
    if (isAdminOrPM) return true;

    // For non-Admin Employees:
    if (n.type === 'COMPLETION') {
      const task = (tasks || []).find((t) => t.id === n.taskId);
      if (task && (task.assignorId === user.id || (task.assignorEmail && task.assignorEmail.toLowerCase() === userEmail))) {
        return true;
      }
      return false;
    } else {
      const recipientEmail = (n.recipientEmail || '').trim().toLowerCase();
      if (recipientEmail && userEmail && recipientEmail === userEmail) return true;
      const task = (tasks || []).find((t) => t.id === n.taskId);
      if (task && (task.assigneeId === user.id || (task.assigneeEmail && task.assigneeEmail.toLowerCase() === userEmail))) {
        return true;
      }
      return false;
    }
  }).length;

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMyTasksView = currentTab === 'my-tasks';
  const dateOptions = getDatePresetOptions();

  // Active Filter Count Calculation
  let activeFilterCount = 0;
  if (filterOptions.assigneeId !== 'ALL' && !isMyTasksView) activeFilterCount++;
  if (filterOptions.priority !== 'All') activeFilterCount++;
  if (filterOptions.status !== 'All') activeFilterCount++;
  if (filterOptions.myTasksOnly && !isMyTasksView) activeFilterCount++;
  if (filterOptions.datePreset !== 'ALL' || filterOptions.startDate || filterOptions.endDate) activeFilterCount++;

  const resetFilters = () => {
    setFilterOptions({
      searchQuery: '',
      projectId: 'ALL',
      assigneeId: 'ALL',
      priority: 'All',
      status: 'All',
      myTasksOnly: false,
      datePreset: 'ALL',
      startDate: '',
      endDate: '',
    });
  };

  const handleDatePresetChange = (preset: string) => {
    const today = new Date();
    let start = '';
    let end = '';

    if (preset === 'TODAY') {
      start = toYYYYMMDD(today);
      end = toYYYYMMDD(today);
    } else if (preset === 'YESTERDAY') {
      const yest = subDays(today, 1);
      start = toYYYYMMDD(yest);
      end = toYYYYMMDD(yest);
    } else if (preset === 'LAST_7_DAYS') {
      start = toYYYYMMDD(subDays(today, 6));
      end = toYYYYMMDD(today);
    } else if (preset === 'LAST_30_DAYS') {
      start = toYYYYMMDD(subDays(today, 29));
      end = toYYYYMMDD(today);
    } else if (preset === 'THIS_MONTH') {
      start = toYYYYMMDD(startOfMonth(today));
      end = toYYYYMMDD(endOfMonth(today));
    }

    setFilterOptions((prev) => ({
      ...prev,
      datePreset: preset,
      startDate: start,
      endDate: end,
    }));
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'kanban':
        return 'Kanban Board';
      case 'gantt':
        return 'Gantt Timeline';
      case 'list':
        return 'Task List';
      case 'calendar':
        return 'Calendar Schedule';
      case 'my-tasks':
        return 'My Assigned Tasks';
      case 'team':
        return 'Team Settings';
      default:
        return 'Project Management';
    }
  };

  const visibleProjects = projects.filter((p) => {
    if (isEmployee && user) {
      return tasks.some((t) => t.projectId === p.id && isTaskAssignedToUser(t, user));
    }
    return true;
  });

  return (
    <header className="bg-white rounded-none px-4 sm:px-6 py-3 border-b border-slate-200/80 shadow-2xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 select-none">
      {/* Left: Page Title & Project Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2">
          {currentTab === 'dashboard' && user ? (
            <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap font-serif flex items-center gap-2">
              <span>Welcome back, {user.name}</span>
              <img src="/favicon.png" alt="Leaf logo" className="w-5 h-5 object-contain inline-block" />
            </h1>
          ) : (
            <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap font-serif">
              {getTabTitle()}
            </h1>
          )}
        </div>

        {/* Project Switcher Dropdown (Only show on task/project views, not Team Settings or Docs) */}
        {currentTab !== 'team' && currentTab !== 'docs' && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs font-semibold text-slate-700">
            <Folder className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer pr-1 max-w-[120px] sm:max-w-[180px] truncate"
            >
              <option value="ALL">All Projects ({visibleProjects.length})</option>
              {visibleProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Global Actions (Search, Notifications, Filters, Sync, + New Task, Profile) */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Search Bar - Hidden on Dashboard, Team Settings, and Docs */}
        {currentTab !== 'dashboard' && currentTab !== 'team' && currentTab !== 'docs' && (
          <div className="relative w-28 sm:w-40 md:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={filterOptions.searchQuery}
              onChange={(e) =>
                setFilterOptions((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="w-full pl-7 sm:pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
            />
          </div>
        )}

        {/* Notification Bell Button */}
        <button
          onClick={openNotificationDrawer}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
          title="Email Notifications & Dispatch Log"
        >
          <Bell className="w-4 h-4 text-cyan-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse border border-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Filters Button with Popover */}
        <div className="relative" ref={filterPopoverRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition ${activeFilterCount > 0 || isFilterOpen
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
              }`}
          >
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Filters Dropdown Popover Card */}
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <span>Filter Tasks</span>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition"
                  >
                    Reset All
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* 1. Date Range Filter */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Date Range
                  </label>
                  <select
                    value={filterOptions.datePreset || 'ALL'}
                    onChange={(e) => handleDatePresetChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3 py-2 rounded-2xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {dateOptions.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {(filterOptions.datePreset === 'CUSTOM' || (filterOptions.datePreset !== 'ALL' && filterOptions.startDate)) && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="date"
                        value={filterOptions.startDate || ''}
                        onChange={(e) =>
                          setFilterOptions((prev) => ({
                            ...prev,
                            datePreset: 'CUSTOM',
                            startDate: e.target.value,
                          }))
                        }
                        className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none"
                      />
                      <span className="text-slate-400 font-bold">—</span>
                      <input
                        type="date"
                        value={filterOptions.endDate || ''}
                        onChange={(e) =>
                          setFilterOptions((prev) => ({
                            ...prev,
                            datePreset: 'CUSTOM',
                            endDate: e.target.value,
                          }))
                        }
                        className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Assignee / Filter by Employee (Admin & PM only) */}
                {!isMyTasksView && !isEmployee && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Filter by Employee
                    </label>
                    <select
                      value={filterOptions.assigneeId}
                      onChange={(e) =>
                        setFilterOptions((prev) => ({
                          ...prev,
                          assigneeId: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3 py-2 rounded-2xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="ALL">All Employees / Team Members ({teamMembers.filter(m => m.role !== 'Admin').length})</option>
                      {teamMembers.filter(m => m.role !== 'Admin').map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role || 'Employee'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. Priority Filter */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={filterOptions.priority}
                    onChange={(e) =>
                      setFilterOptions((prev) => ({
                        ...prev,
                        priority: e.target.value as Priority | 'All',
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3 py-2 rounded-2xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="All">Priority: All</option>
                    {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                      <option key={p} value={p}>
                        Priority: {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Status Filter */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Workflow Status
                  </label>
                  <select
                    value={filterOptions.status}
                    onChange={(e) =>
                      setFilterOptions((prev) => ({
                        ...prev,
                        status: e.target.value as TaskStatus | 'All',
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3 py-2 rounded-2xl focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="All">Status: All</option>
                    {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>
                        Status: {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sync Button */}
        {/* Sync with Google Sheets */}
        <button
          onClick={syncWithGoogleSheets}
          disabled={isSyncing}
          className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition"
          title="Sync with Sheets"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>

        {/* User Profile Avatar & Name */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs ring-2 ring-white"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
              <div className="hidden xl:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-slate-800">{user.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
