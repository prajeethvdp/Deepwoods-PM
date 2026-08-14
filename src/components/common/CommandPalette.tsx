import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Kanban,
  GanttChartSquare,
  ListTodo,
  Calendar,
  FileText,
  UserCheck,
  Users,
  Plus,
  FolderPlus,
  CheckCircle2,
  Folder,
  ArrowRight,
  Command,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  openNewTaskModal: () => void;
  openNewProjectModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  openNewTaskModal,
  openNewProjectModal,
}) => {
  const { tasks, projects, openTaskDetail } = useData();
  const { canManageProjects, canAccessTeamPage, isEmployee } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
          setSelectedIndex(0);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build command items with explicit type definitions
  const allNavItems = [
    { type: 'nav', id: 'dashboard', label: 'Go to Dashboard', subLabel: 'View project KPIs & metrics', icon: LayoutDashboard, category: 'Navigation' },
    { type: 'nav', id: 'kanban', label: 'Go to Kanban Board', subLabel: 'Manage task workflow columns', icon: Kanban, category: 'Navigation' },
    { type: 'nav', id: 'gantt', label: 'Go to Gantt Chart', subLabel: 'Timeline & schedule view', icon: GanttChartSquare, category: 'Navigation' },
    { type: 'nav', id: 'list', label: 'Go to List View', subLabel: 'Tabular task list view', icon: ListTodo, category: 'Navigation' },
    { type: 'nav', id: 'calendar', label: 'Go to Calendar View', subLabel: 'Monthly deadline calendar', icon: Calendar, category: 'Navigation' },
    { type: 'nav', id: 'team', label: 'Go to Team Settings', subLabel: 'Workspace members & roles', icon: Users, category: 'Navigation', adminOrPmOnly: true },
  ];

  const navItems = allNavItems.filter((item) => !item.adminOrPmOnly || canAccessTeamPage);

  const allActionItems = [
    { type: 'action', id: 'create-task', label: 'Create New Task', subLabel: 'Add a new task item', icon: Plus, category: 'Actions', handler: openNewTaskModal, adminOrPmOnly: true },
    { type: 'action', id: 'create-project', label: 'Create New Project', subLabel: 'Add a new project folder', icon: FolderPlus, category: 'Actions', handler: openNewProjectModal, pmOnly: true },
  ];

  const actionItems = allActionItems.filter((item) => {
    if (item.id === 'create-task' && isEmployee) return false;
    if (item.pmOnly && !canManageProjects) return false;
    return true;
  });

  const filteredTasks = query.trim()
    ? tasks
        .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map((t) => ({
          type: 'task',
          id: t.id,
          label: t.title,
          subLabel: `Task • ${t.status} • ${t.priority} Priority`,
          icon: CheckCircle2,
          category: 'Tasks',
          task: t,
        }))
    : [];

  const filteredProjects = query.trim()
    ? projects
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.clientName.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map((p) => ({
          type: 'project',
          id: p.id,
          label: p.name,
          subLabel: `Project • ${p.clientName || 'Internal'}`,
          icon: Folder,
          category: 'Projects',
          project: p,
        }))
    : [];

  const filteredNav = navItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  const filteredActions = actionItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  const allResults = [...filteredActions, ...filteredNav, ...filteredTasks, ...filteredProjects];

  const handleExecute = (item: any) => {
    onClose();
    if (item.type === 'nav') {
      onSelectTab(item.id);
    } else if (item.type === 'action' && item.handler) {
      item.handler();
    } else if (item.type === 'task' && item.task) {
      openTaskDetail(item.task);
    } else if (item.type === 'project') {
      onSelectTab('kanban');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % Math.max(1, allResults.length));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleExecute(allResults[selectedIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header Search Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search tasks, projects, actions..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {allResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching commands, tasks, or projects found.
            </div>
          ) : (
            allResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleExecute(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected ? 'bg-cyan-500/15 text-cyan-300 border-l-2 border-cyan-400' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{item.label}</div>
                      {item.subLabel && <div className="text-[11px] text-slate-500 truncate">{item.subLabel}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">↑↓</kbd> Navigate</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">↵</kbd> Select</span>
            <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-300">Esc</kbd> Close</span>
          </div>
          <span className="text-cyan-400 font-mono text-[10px]">Linear-Style Command Palette</span>
        </div>
      </div>
    </div>
  );
};
