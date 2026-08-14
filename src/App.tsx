import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DetailPanel } from './components/layout/DetailPanel';
import { Board } from './components/kanban/Board';
import { GanttChart } from './components/gantt/GanttChart';
import { DashboardPage } from './pages/DashboardPage';
import { ListViewPage } from './pages/ListViewPage';
import { TeamPage } from './pages/TeamPage';
import { CalendarView } from './components/calendar/CalendarView';
import { LoginPage } from './pages/LoginPage';
import { TaskModal } from './components/common/TaskModal';
import { ProjectModal } from './components/projects/ProjectModal';
import { CommandPalette } from './components/common/CommandPalette';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { TaskStatus } from './types';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { setSelectedProjectId } = useData();

  // Persist the current tab across page refreshes
  const [currentTab, setCurrentTabState] = useState<string>(
    () => localStorage.getItem('deepwoods_tab') || 'dashboard'
  );
  const setCurrentTab = (tab: string) => {
    setCurrentTabState(tab);
    localStorage.setItem('deepwoods_tab', tab);
  };

  // Click a project in the sidebar → go to List View filtered to that project
  const navigateToProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentTab('list');
  };

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalDefaultStatus, setTaskModalDefaultStatus] = useState<TaskStatus>('To Do');
  const [taskModalDefaultDate, setTaskModalDefaultDate] = useState<string | undefined>(undefined);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setCurrentTab('dashboard')} />;
  }

  const openTaskModalWithStatus = (status: TaskStatus = 'To Do', date?: string) => {
    setTaskModalDefaultStatus(status);
    setTaskModalDefaultDate(date);
    setIsTaskModalOpen(true);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'kanban':
        return (
          <div className="h-full overflow-hidden">
            <Board openTaskModalWithStatus={openTaskModalWithStatus} />
          </div>
        );
      case 'gantt':
        return <GanttChart isMyTasksView={false} />;
      case 'list':
        return <ListViewPage isMyTasksView={false} openTaskModalWithStatus={openTaskModalWithStatus} />;
      case 'calendar':
        return <CalendarView onAddDateTask={(dateStr) => openTaskModalWithStatus('To Do', dateStr)} />;
      case 'my-tasks':
        return <DashboardPage />;
      case 'team':
        return <TeamPage />;
      default:
        return (
          <div className="h-full overflow-hidden">
            <Board openTaskModalWithStatus={openTaskModalWithStatus} />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#EEF2F6] p-1.5 sm:p-2.5 gap-1.5 sm:gap-2.5 overflow-hidden font-sans antialiased pb-16 md:pb-2.5">
      {/* Floating White Icon Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openNewTaskModal={() => openTaskModalWithStatus('To Do')}
        openNewProjectModal={() => setIsProjectModalOpen(true)}
        openNotificationDrawer={() => setIsNotificationDrawerOpen(true)}
        navigateToProject={navigateToProject}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full gap-2.5 overflow-hidden">
        <Header
          currentTab={currentTab}
          openNewTaskModal={() => openTaskModalWithStatus('To Do')}
          openNotificationDrawer={() => setIsNotificationDrawerOpen(true)}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto relative rounded-2xl">
          {renderTabContent()}
        </main>
      </div>

      {/* Slide-in Detail Panel */}
      <DetailPanel />

      {/* Email Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />

      {/* Linear-Style Cmd+K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => setCurrentTab(tab)}
        openNewTaskModal={() => openTaskModalWithStatus('To Do')}
        openNewProjectModal={() => setIsProjectModalOpen(true)}
      />

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultStatus={taskModalDefaultStatus}
        defaultDate={taskModalDefaultDate}
      />
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
