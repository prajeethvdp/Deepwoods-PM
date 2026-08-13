import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Kanban,
  GanttChartSquare,
  ListTodo,
  UserCheck,
  Users,
  Calendar,
  LogOut,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openNewTaskModal: () => void;
  openNewProjectModal: () => void;
  openNotificationDrawer?: () => void;
  navigateToProject: (projectId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  openNewProjectModal,
  navigateToProject,
}) => {
  const { tasks, projects } = useData();
  const { user, logout } = useAuth();
  const [projectsOpen, setProjectsOpen] = useState(false);

  const myTasksCount = useMemo(() => {
    if (!user) return 0;
    return tasks.filter((t) => t.assigneeId === user.id && t.status !== 'Done').length;
  }, [tasks, user]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kanban', label: 'Kanban Board', icon: Kanban },
    { id: 'gantt', label: 'Gantt Chart', icon: GanttChartSquare },
    { id: 'list', label: 'List View', icon: ListTodo },
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
    { id: 'my-tasks', label: 'My Tasks', icon: UserCheck, badge: myTasksCount },
    { id: 'team', label: 'Team Settings', icon: Users },
  ];

  return (
    <aside className="group w-16 hover:w-56 bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs flex flex-col justify-between h-full select-none flex-shrink-0 z-40 transition-all duration-300 ease-in-out overflow-hidden">
      {/* Top Section */}
      <div className="flex flex-col gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center justify-center p-2 cursor-pointer transition rounded-2xl hover:bg-slate-50 overflow-hidden min-h-[44px] relative"
          title="Dashboard"
        >
          <img
            src="/favicon.png"
            alt="Deepwoods Leaf Logo"
            className="w-8 h-8 object-contain transition-opacity duration-200 group-hover:opacity-0"
          />
          <img
            src="/logo.png"
            alt="Deepwoods Logo"
            className="h-8 w-auto object-contain transition-opacity duration-200 opacity-0 group-hover:opacity-100 absolute left-3"
          />
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-200/80 w-full" />

        {/* Nav Items */}
        <div className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`relative p-2.5 rounded-2xl transition-all duration-200 flex items-center gap-3 overflow-hidden ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-xs truncate whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-emerald-600 text-white rounded-full text-[9px] font-extrabold px-1.5 py-0.5 shadow-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Projects Dropdown + Sign Out */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/80">

        {/* Projects Dropdown */}
        <div>
          <button
            onClick={() => setProjectsOpen((prev) => !prev)}
            className="w-full p-2.5 rounded-2xl text-slate-600 hover:bg-slate-100 transition font-semibold flex items-center gap-3 overflow-hidden"
            title="Projects"
          >
            <Folder className="w-5 h-5 shrink-0 text-emerald-600" />
            <span className="text-xs truncate whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left">
              Projects
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
              {projectsOpen
                ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              }
            </span>
          </button>

          {/* Project list — only visible when sidebar is expanded (group-hover) */}
          {projectsOpen && (
            <div className="mt-1 ml-2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {projects.length === 0 ? (
                <span className="text-[11px] text-slate-400 italic px-3 py-1">No projects yet</span>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => navigateToProject(proj.id)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: proj.color || '#06B6D4' }}
                    />
                    <span className="text-[11px] font-semibold text-slate-700 truncate">
                      {proj.name}
                    </span>
                  </div>
                ))
              )}
              <button
                onClick={openNewProjectModal}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition font-bold text-[11px] mt-0.5"
              >
                <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                <span>New Project</span>
              </button>
            </div>
          )}
        </div>

        {/* Sign Out */}
        {user && (
          <button
            onClick={logout}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition flex items-center gap-3 overflow-hidden"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-xs truncate whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
              Sign Out
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};
