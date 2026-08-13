import React, { useMemo } from 'react';
import {
  LayoutDashboard,
  Kanban,
  GanttChartSquare,
  ListTodo,
  UserCheck,
  Users,
  Calendar,
  Bell,
  LogOut,
  FolderPlus,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openNewTaskModal: () => void;
  openNewProjectModal: () => void;
  openNotificationDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  openNewProjectModal,
  openNotificationDrawer,
}) => {
  const { tasks, emailNotifications } = useData();
  const { user, logout } = useAuth();

  const myTasksCount = useMemo(() => {
    if (!user) return 0;
    return tasks.filter((t) => t.assigneeId === user.id && t.status !== 'Done').length;
  }, [tasks, user]);

  const unreadEmailsCount = useMemo(() => {
    return emailNotifications.filter((n) => {
      if (n.read) return false;
      if (!user) return true;
      const userEmail = user.email.trim().toLowerCase();
      const recipientEmail = (n.recipientEmail || '').trim().toLowerCase();
      const userName = (user.name || '').trim().toLowerCase();
      const recipientName = (n.recipientName || '').trim().toLowerCase();

      if (recipientEmail && userEmail && recipientEmail === userEmail) return true;
      if (recipientName && userName && recipientName === userName) return true;

      const userPrefix = userEmail.split('@')[0];
      const recipientPrefix = recipientEmail.split('@')[0];
      if (userPrefix && recipientPrefix && userPrefix === recipientPrefix) return true;

      if (n.taskId) {
        const task = (tasks || []).find((t) => t.id === n.taskId);
        if (task) {
          if (task.assigneeId === user.id) return true;
          if (task.assigneeEmail && task.assigneeEmail.toLowerCase() === userEmail) return true;
        }
      }

      return false;
    }).length;
  }, [emailNotifications, tasks, user]);

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
        {/* Top Brand Logo Section */}
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

        {/* Separator Line */}
        <div className="h-px bg-slate-200/80 w-full" />

        {/* Nav Items List */}
        <div className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`relative p-2.5 rounded-2xl transition-all duration-200 flex items-center gap-3 overflow-hidden ${isActive
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

          {/* Email Notifications Drawer Link */}
          {openNotificationDrawer && (
            <button
              onClick={openNotificationDrawer}
              className="relative p-2.5 rounded-2xl transition-all duration-200 flex items-center gap-3 text-cyan-700 hover:bg-cyan-50 font-semibold overflow-hidden"
              title="Email Notifications Log"
            >
              <Bell className="w-5 h-5 shrink-0 text-cyan-600" />
              <span className="text-xs truncate whitespace-nowrap font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                Email Dispatches
              </span>
              {unreadEmailsCount > 0 && (
                <span className="ml-auto bg-cyan-600 text-white rounded-full text-[9px] font-extrabold px-1.5 py-0.5 shadow-xs animate-pulse shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {unreadEmailsCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Actions: New Project & Sign Out */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/80">
        <button
          onClick={openNewProjectModal}
          className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition font-bold flex items-center gap-3 overflow-hidden"
          title="New Project"
        >
          <FolderPlus className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="text-xs truncate whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
            New Project
          </span>
        </button>

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
