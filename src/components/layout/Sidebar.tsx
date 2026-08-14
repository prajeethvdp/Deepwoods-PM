import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Kanban,
  GanttChartSquare,
  ListTodo,
  Users,
  Calendar,
  LogOut,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Folder,
  Trash2,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
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
  openNewTaskModal,
  openNewProjectModal,
  navigateToProject,
}) => {
  const { tasks, projects, deleteProject } = useData();
  const { user, logout, canAccessTeamPage, canManageProjects, isEmployee } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kanban', label: 'Kanban Board', icon: Kanban },
    { id: 'gantt', label: 'Gantt Chart', icon: GanttChartSquare },
    { id: 'list', label: 'List View', icon: ListTodo },
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
  ];

  const adminNavItems = useMemo(() => {
    if (!canAccessTeamPage) return [];
    return [{ id: 'team', label: 'Team Settings', icon: Users }];
  }, [canAccessTeamPage]);

  return (
    <>
      {/* DESKTOP SIDEBAR (Asana & Linear Inspired Clean SaaS Design) */}
      <aside
        className={`hidden md:flex flex-col justify-between h-full bg-[#18191B] text-slate-300 border-r border-slate-800 select-none flex-shrink-0 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-16 p-2.5' : 'w-60 p-4'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col gap-5 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar">
          {/* Brand Header with Collapse Toggle */}
          <div className="flex items-center justify-between gap-2">
            {!isCollapsed ? (
              <div
                onClick={() => setCurrentTab('dashboard')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold shadow-sm shrink-0">
                  <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-sm text-white tracking-tight leading-none group-hover:text-emerald-400 transition">
                    DEEPWOODS
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                    Workspace
                  </span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setCurrentTab('dashboard')}
                className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold cursor-pointer mx-auto"
                title="Dashboard"
              >
                <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
              </div>
            )}

            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition shrink-0 hidden lg:block"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Primary Action Button (+ New Task) */}
          {!isEmployee && (
            <div>
              {!isCollapsed ? (
                <button
                  onClick={openNewTaskModal}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-2 active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Task</span>
                </button>
              ) : (
                <button
                  onClick={openNewTaskModal}
                  className="w-9 h-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition flex items-center justify-center mx-auto"
                  title="Create Task"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          )}

          {/* SECTION 1: WORKSPACE VIEWS */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                Workspace
              </div>
            )}
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full text-xs font-semibold px-2.5 py-2 rounded-xl transition flex items-center gap-3 ${
                    isActive
                      ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* SECTION 2: PROJECTS */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            {!isCollapsed ? (
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Projects ({projects.length})
                </span>
                <div className="flex items-center gap-1">
                  {canManageProjects && (
                    <button
                      onClick={openNewProjectModal}
                      className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                      title="New Project"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setProjectsOpen((prev) => !prev)}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 transition"
                  >
                    {projectsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest py-1">
                Proj
              </div>
            )}

            {(projectsOpen || isCollapsed) && (
              <div className="space-y-0.5">
                {projects.length === 0 ? (
                  !isCollapsed && (
                    <span className="text-[11px] text-slate-500 italic px-2.5 py-1 block">
                      No active projects
                    </span>
                  )
                ) : (
                  projects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => navigateToProject(proj.id)}
                      title={isCollapsed ? proj.name : undefined}
                      className={`group/item px-2.5 py-1.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 ${
                        isCollapsed ? 'justify-center px-0' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color || '#06B6D4' }}
                        />
                        {!isCollapsed && <span className="truncate">{proj.name}</span>}
                      </div>

                      {!isCollapsed && canManageProjects && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete project "${proj.name}"?`)) {
                              deleteProject(proj.id);
                            }
                          }}
                          className="opacity-0 group-hover/item:opacity-100 p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete project"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: ADMINISTRATION */}
          {adminNavItems.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Administration
                </div>
              )}
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full text-xs font-semibold px-2.5 py-2 rounded-xl transition flex items-center gap-3 ${
                      isActive
                        ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* BOTTOM USER PROFILE WIDGET */}
        <div className="pt-3 border-t border-slate-800/80">
          {user && (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
              {!isCollapsed ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-xs"
                    style={{ backgroundColor: user.color || '#2563EB' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-100 truncate">{user.name}</span>
                    <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-extrabold mx-auto shadow-xs"
                  style={{ backgroundColor: user.color || '#2563EB' }}
                  title={`${user.name} (${user.role})`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              {!isCollapsed && (
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (Clean & Precise for small screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#18191B] border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-xl">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
                isActive ? 'text-emerald-400 font-extrabold' : 'text-slate-400 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

