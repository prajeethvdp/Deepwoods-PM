import React from 'react';
import { Filter, X, User, Calendar } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Priority, TaskStatus } from '../../types';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toYYYYMMDD } from '../../lib/dateUtils';

interface FilterBarProps {
  currentTab?: string;
}

export function getDatePresetOptions() {
  return [
    { key: 'ALL', label: 'Date: All Time' },
    { key: 'TODAY', label: 'Date: Today' },
    { key: 'YESTERDAY', label: 'Date: Yesterday' },
    { key: 'LAST_7_DAYS', label: 'Date: Last 7 Days' },
    { key: 'LAST_30_DAYS', label: 'Date: Last 30 Days' },
    { key: 'THIS_MONTH', label: 'Date: This Month' },
    { key: 'CUSTOM', label: 'Date: Custom Range...' },
  ];
}

export const FilterBar: React.FC<FilterBarProps> = ({ currentTab }) => {
  const { teamMembers, filterOptions, setFilterOptions } = useData();
  const { user, isEmployee } = useAuth();

  const isMyTasksView = currentTab === 'my-tasks';
  const isDashboardView = currentTab === 'dashboard' || !currentTab;
  const dateOptions = getDatePresetOptions();

  const isFiltered =
    filterOptions.searchQuery !== '' ||
    (!isMyTasksView && filterOptions.assigneeId !== 'ALL') ||
    filterOptions.priority !== 'All' ||
    filterOptions.status !== 'All' ||
    (!isMyTasksView && filterOptions.myTasksOnly) ||
    filterOptions.datePreset !== 'ALL' ||
    Boolean(filterOptions.startDate) ||
    Boolean(filterOptions.endDate);

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

  return (
    <div className="bg-white rounded-3xl px-5 py-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs select-none">
      {/* Left: Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filters:</span>
        </div>

        {/* Date Filter Dropdown & Custom Pickers */}
        <select
          value={filterOptions.datePreset || 'ALL'}
          onChange={(e) => handleDatePresetChange(e.target.value)}
          className="bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-bold px-3 py-1.5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs cursor-pointer"
        >
          {dateOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>

        {(filterOptions.datePreset === 'CUSTOM' || (filterOptions.datePreset !== 'ALL' && filterOptions.startDate)) && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
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
              className="bg-white border border-slate-200 rounded-xl px-2 py-0.5 text-xs text-slate-800 font-semibold focus:outline-none"
              title="Start Date"
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
              className="bg-white border border-slate-200 rounded-xl px-2 py-0.5 text-xs text-slate-800 font-semibold focus:outline-none"
              title="End Date"
            />
          </div>
        )}

        {/* Assignee / Filter by Employee Dropdown (Admin & PM only) */}
        {!isMyTasksView && !isEmployee && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <User className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <select
              value={filterOptions.assigneeId}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  assigneeId: e.target.value,
                }))
              }
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">Filter by Employee: All ({teamMembers.filter(m => m.role !== 'Admin').length})</option>
              {teamMembers.filter(m => m.role !== 'Admin').map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role || 'Employee'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority Filter Dropdown */}
        <select
          value={filterOptions.priority}
          onChange={(e) =>
            setFilterOptions((prev) => ({
              ...prev,
              priority: e.target.value as Priority | 'All',
            }))
          }
          className="bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-2xl focus:outline-none cursor-pointer"
        >
          <option value="All">Priority: All</option>
          {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
            <option key={p} value={p}>
              Priority: {p}
            </option>
          ))}
        </select>

        {/* Status Filter Dropdown */}
        <select
          value={filterOptions.status}
          onChange={(e) =>
            setFilterOptions((prev) => ({
              ...prev,
              status: e.target.value as TaskStatus | 'All',
            }))
          }
          className="bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-2xl focus:outline-none cursor-pointer"
        >
          <option value="All">Status: All</option>
          {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
            <option key={s} value={s}>
              Status: {s}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Reset Filters */}
      {isFiltered && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-slate-500 hover:text-rose-600 font-bold text-xs transition"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
