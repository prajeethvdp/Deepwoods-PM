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
      {/* DESKTOP SIDEBAR (Clean Light SaaS Design - Restored Logo & Light Colors) */}
      <aside
        className={`hidden md:flex flex-col justify-between h-full bg-white text-slate-800 border-r border-slate-200/80 shadow-xs select-none flex-shrink-0 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-16 p-2.5' : 'w-60 p-4'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col gap-5 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar">
          {/* Brand Logo & Collapse Toggle */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2 w-full">
              <div
                onClick={() => setCurrentTab('dashboard')}
                className="flex-1 flex items-center justify-center cursor-pointer py-1 px-1 rounded-xl hover:bg-slate-50 transition min-w-0"
              >
                <img
                  src="/logo.png"
                  alt="Deepwoods Logo"
                  className="h-8 w-auto max-w-[150px] object-contain mx-auto"
                />
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0 hidden lg:block"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition shadow-2xs shrink-0"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Primary Action Button (+ Create Task) */}
          {!isEmployee && (
            <div>
              {!isCollapsed ? (
                <button
                  onClick={openNewTaskModal}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Task</span>
                </button>
              ) : (
                <button
                  onClick={openNewTaskModal}
                  className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center justify-center mx-auto"
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
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
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
                  className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl transition flex items-center gap-3 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* SECTION 2: PROJECTS */}
          <div className="space-y-1 pt-3 border-t border-slate-200/80">
            {!isCollapsed ? (
              <div className="flex items-center justify-between px-2.5 py-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Projects ({projects.length})
                </span>
                <div className="flex items-center gap-1">
                  {canManageProjects && (
                    <button
                      onClick={openNewProjectModal}
                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition"
                      title="New Project"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setProjectsOpen((prev) => !prev)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
                  >
                    {projectsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1">
                Proj
              </div>
            )}

            {(projectsOpen || isCollapsed) && (
              <div className="space-y-0.5">
                {projects.length === 0 ? (
                  !isCollapsed && (
                    <span className="text-[11px] text-slate-400 italic px-3 py-1 block">
                      No active projects
                    </span>
                  )
                ) : (
                  projects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => navigateToProject(proj.id)}
                      title={isCollapsed ? proj.name : undefined}
                      className={`group/item px-3 py-2 rounded-xl cursor-pointer transition flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 ${
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
                          className="opacity-0 group-hover/item:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
            <div className="space-y-1 pt-3 border-t border-slate-200/80">
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
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
                    className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl transition flex items-center gap-3 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* BOTTOM USER PROFILE WIDGET */}
        <div className="pt-3 border-t border-slate-200/80">
          {user && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200/80">
              {!isCollapsed ? (
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-2xs"
                    style={{ backgroundColor: user.color || '#2563EB' }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-slate-900 truncate" title={user.email}>
                      {user.email}
                    </span>
                    <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider mt-0.5">
                      {user.role}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-extrabold mx-auto shadow-2xs"
                  style={{ backgroundColor: user.color || '#2563EB' }}
                  title={`${user.email} (${user.role})`}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              {!isCollapsed && (
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200/60 rounded-xl transition shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (Light Theme) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2 flex items-center justify-around shadow-lg">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
                isActive ? 'text-emerald-600 font-extrabold' : 'text-slate-500 font-medium'
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

