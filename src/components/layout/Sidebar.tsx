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
  Trash2,
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
  const { tasks, projects, deleteProject } = useData();
  const { user, logout, canManageProjects, canAccessTeamPage } = useAuth();
  const [projectsOpen, setProjectsOpen] = useState(false);

  const myTasksCount = useMemo(() => {
    if (!user) return 0;
    return tasks.filter((t) => t.assigneeId === user.id && t.status !== 'Done').length;
  }, [tasks, user]);

  const allNavItems: { id: string; label: string; shortLabel: string; icon: any; adminOrPmOnly?: boolean; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
    { id: 'kanban', label: 'Kanban Board', shortLabel: 'Kanban', icon: Kanban },
    { id: 'gantt', label: 'Gantt Chart', shortLabel: 'Gantt', icon: GanttChartSquare },
    { id: 'list', label: 'List View', shortLabel: 'List', icon: ListTodo },
    { id: 'calendar', label: 'Calendar View', shortLabel: 'Calendar', icon: Calendar },
    { id: 'team', label: 'Team Settings', shortLabel: 'Team', icon: Users, adminOrPmOnly: true },
  ];

  const navItems = useMemo(() => {
    return allNavItems.filter((item) => !item.adminOrPmOnly || canAccessTeamPage);
  }, [canAccessTeamPage, myTasksCount]);

  return (
    <>
      {/* DESKTOP SIDEBAR (md and above) */}
      <aside className="hidden md:flex group w-16 hover:w-56 bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs flex-col justify-between h-full select-none flex-shrink-0 z-40 transition-all duration-300 ease-in-out overflow-hidden">
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
              className="w-8 h-8 object-contain transition-opacity duration-200 group-hover:opacity-0 flex-shrink-0"
            />
            <img
              src="/logo.png"
              alt="Deepwoods Logo"
              className="h-8 w-auto max-w-[160px] object-contain transition-opacity duration-200 opacity-0 group-hover:opacity-100 absolute inset-0 m-auto"
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
                  <span className="text-xs truncate whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 font-sans">
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
              <span className="text-xs truncate whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 flex-1 text-left font-sans">
                Projects
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                {projectsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </span>
            </button>

            {/* Project list — only visible when sidebar is expanded */}
            {projectsOpen && (
              <div className="mt-1 ml-2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {projects.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic px-3 py-1">No projects yet</span>
                ) : (
                  projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-emerald-50 cursor-pointer transition group/proj"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: proj.color || '#06B6D4' }}
                      />
                      <span
                        onClick={() => navigateToProject(proj.id)}
                        className="text-[11px] font-semibold text-slate-700 truncate flex-1"
                      >
                        {proj.name}
                      </span>
                      {canManageProjects && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete project "${proj.name}"? This cannot be undone.`)) {
                              deleteProject(proj.id);
                            }
                          }}
                          className="opacity-0 group-hover/proj:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                          title="Delete project"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
                {canManageProjects && (
                  <button
                    onClick={openNewProjectModal}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition font-bold text-[11px] mt-0.5"
                  >
                    <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                    <span>New Project</span>
                  </button>
                )}
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
              <span className="text-xs truncate whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 font-sans">
                Sign Out
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (below md breakpoint) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
                isActive ? 'text-emerald-600 font-extrabold scale-105' : 'text-slate-400 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full text-[8px] font-extrabold w-3.5 h-3.5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-sans">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
