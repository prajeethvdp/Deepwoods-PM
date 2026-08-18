import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Project, TeamMember, TaskComment, FilterOptions, SheetsConfig, TaskStatus, EmailNotification, TaskAttachment, TaskActivity } from '../types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadProjectsFromStorage,
  saveProjectsToStorage,
  loadTeamFromStorage,
  saveTeamToStorage,
  loadCommentsFromStorage,
  saveCommentsToStorage,
  loadActivitiesFromStorage,
  saveActivitiesToStorage,
  getSheetsConfig,
  syncAllWithAppsScript,
  sendAppsScriptAction,
  sortTasksNewestFirst,
} from '../lib/sheets';
import {
  loadEmailNotifications,
  saveEmailNotifications,
  createAssignmentNotification,
  createReminderNotification,
  createCompletionNotification,
  generateDynamicCompanyEmail,
} from '../lib/emailService';
import { useAuth } from './AuthContext';

interface DataContextType {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  comments: TaskComment[];
  activities: TaskActivity[];
  emailNotifications: EmailNotification[];
  filterOptions: FilterOptions;
  selectedProjectId: string;
  selectedTask: Task | null;
  selectedTaskIds: string[];
  isDetailPanelOpen: boolean;
  sheetsConfig: SheetsConfig;
  isSyncing: boolean;
  
  // Actions
  setSelectedProjectId: (id: string) => void;
  setSelectedTask: (task: Task | null) => void;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleSelectTask: (taskId: string) => void;
  selectAllTasks: (taskIds: string[]) => void;
  clearTaskSelection: () => void;
  openTaskDetail: (task: Task) => void;
  closeTaskDetail: () => void;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  
  // Notifications & Emails
  sendDeadlineReminder: (taskId: string, senderUser?: TeamMember) => Promise<boolean>;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Attachments
  addAttachmentToTask: (taskId: string, attachment: TaskAttachment) => Promise<void>;
  removeAttachmentFromTask: (taskId: string, attachmentId: string) => Promise<void>;
  
  // Task CRUD & Bulk
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<boolean>;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => Promise<void>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<void>;
  logActivity: (taskId: string, actionType: TaskActivity['actionType'], details: string, userOverride?: TeamMember) => void;
  
  // Project CRUD
  createProject: (projData: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>;
  updateProject: (projId: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (projId: string) => Promise<boolean>;
  
  // Team CRUD
  addTeamMember: (memberData: Omit<TeamMember, 'id'>) => Promise<TeamMember>;
  updateTeamMember: (memberId: string, updates: Partial<TeamMember>) => Promise<TeamMember | null>;
  deleteTeamMember: (memberId: string) => Promise<boolean>;
  
  // Comment CRUD
  addComment: (taskId: string, authorId: string, text: string) => Promise<TaskComment>;
  
  // Sheets Config & Sync
  syncWithGoogleSheets: () => Promise<void>;
}

const defaultFilterOptions: FilterOptions = {
  searchQuery: '',
  projectId: 'ALL',
  assigneeId: 'ALL',
  priority: 'All',
  status: 'All',
  myTasksOnly: false,
  datePreset: 'ALL',
  startDate: '',
  endDate: '',
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const CLEARED_NOTIFS_STORAGE_KEY = 'deepwoods_cleared_notification_ids';

const getClearedNotificationIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(CLEARED_NOTIFS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveClearedNotificationIds = (set: Set<string>) => {
  localStorage.setItem(CLEARED_NOTIFS_STORAGE_KEY, JSON.stringify(Array.from(set)));
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [projects, setProjects] = useState<Project[]>(() => loadProjectsFromStorage());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadTeamFromStorage());
  const [comments, setComments] = useState<TaskComment[]>(() => loadCommentsFromStorage());
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>(() => loadEmailNotifications());
  const [activities, setActivities] = useState<TaskActivity[]>(() => loadActivitiesFromStorage());
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState<boolean>(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);
  const [sheetsConfig] = useState<SheetsConfig>(() => getSheetsConfig());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const { user: currentUser, refreshUser } = useAuth();

  // Sync state changes to local storage
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  useEffect(() => {
    saveProjectsToStorage(projects);
  }, [projects]);

  useEffect(() => {
    saveTeamToStorage(teamMembers);
    refreshUser(teamMembers);
  }, [teamMembers]);

  useEffect(() => {
    saveCommentsToStorage(comments);
  }, [comments]);

  useEffect(() => {
    saveActivitiesToStorage(activities);
  }, [activities]);

  useEffect(() => {
    saveEmailNotifications(emailNotifications);
  }, [emailNotifications]);

  // Listen for real-time notification updates (e.g. new registration alerts)
  useEffect(() => {
    const syncNotifs = () => {
      const stored = loadEmailNotifications();
      setEmailNotifications(stored);
    };

    window.addEventListener('deepwoods_notification_updated', syncNotifs);
    window.addEventListener('storage', syncNotifs);
    return () => {
      window.removeEventListener('deepwoods_notification_updated', syncNotifs);
      window.removeEventListener('storage', syncNotifs);
    };
  }, []);

  // Initial Sync from Google Apps Script on mount
  useEffect(() => {
    syncWithGoogleSheets();
  }, []);

  // Auto-sync in-app notifications from tasks list so every assignee receives their notification
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    setEmailNotifications((prevNotifs) => {
      const existingTaskIds = new Set(prevNotifs.map((n) => n.taskId));
      const clearedSet = getClearedNotificationIds();
      const newNotifications: EmailNotification[] = [];

      tasks.forEach((task) => {
        const isCleared = clearedSet.has(`task-${task.id}`);
        if (!existingTaskIds.has(task.id) && !isCleared) {
          const assigneeMember = teamMembers.find(
            (m) =>
              m.id === task.assigneeId ||
              (task.assigneeEmail && m.email.toLowerCase() === task.assigneeEmail.toLowerCase()) ||
              m.name.toLowerCase() === (task.assigneeId || '').toLowerCase()
          );

          const assigneeEmail =
            task.assigneeEmail ||
            assigneeMember?.email ||
            (task.assigneeId.includes('@') ? task.assigneeId : 'prajeethv100@gmail.com');
          const assigneeName =
            assigneeMember?.name ||
            (assigneeEmail.includes('@') ? assigneeEmail.split('@')[0] : 'Team Member');

          const assignee: TeamMember = assigneeMember || {
            id: task.assigneeId || 'tm-1',
            name: assigneeName,
            email: assigneeEmail,
            role: 'Team Member',
            color: '#2563EB',
            active: true,
          };

          const assignorMember = teamMembers.find(
            (m) =>
              (task.assignorId && m.id === task.assignorId) ||
              (task.assignorEmail && m.email.trim().toLowerCase() === task.assignorEmail.trim().toLowerCase()) ||
              (task.assignorName && m.name.trim().toLowerCase() === task.assignorName.trim().toLowerCase())
          );

          const defaultAdminOrLead: TeamMember | undefined = teamMembers.find((m) => m.role === 'Admin' || m.role === 'Product Manager') || teamMembers[0];

          const assignorName = task.assignorName || assignorMember?.name || defaultAdminOrLead?.name || 'Assignor';
          const assignorEmail = task.assignorEmail || assignorMember?.email || defaultAdminOrLead?.email || '';
          const assignorRole = task.assignorRole || assignorMember?.role || defaultAdminOrLead?.role || 'Admin';
          const assignorColor = assignorMember?.color || (defaultAdminOrLead ? defaultAdminOrLead.color : '#06B6D4');

          const assignor: TeamMember = assignorMember || {
            id: task.assignorId || defaultAdminOrLead?.id || 'assignor-id',
            name: assignorName,
            email: assignorEmail,
            role: assignorRole,
            color: assignorColor,
            active: true,
          };

          const project = projects.find((p) => p.id === task.projectId);
          const attachmentsList = task.attachments || [];
          const attachmentNames = attachmentsList.map((a) => a.fileName);
          const projectName = project?.name || 'Decarb Project';

          const attachmentHtml =
            attachmentsList.length > 0
              ? `<p style="font-family: 'Trebuchet MS', sans-serif; margin-top: 16px; margin-bottom: 6px;"><strong>Attached Documents (${attachmentsList.length}):</strong></p>
                 <ul style="font-family: 'Trebuchet MS', sans-serif; padding-left: 20px; margin-top: 4px;">
                   ${attachmentsList
                     .map(
                       (att) => `
                     <li style="margin-bottom: 6px;">
                       <strong>${att.fileName}</strong> <span style="color: #64748B; font-size: 12px;">(${att.fileSize})</span>
                       ${
                         att.dataUrl
                           ? ` &nbsp;—&nbsp; <a href="${att.dataUrl}" download="${att.fileName}" style="color: #059669; font-weight: bold; text-decoration: underline;">Download Attachment</a>`
                           : ''
                       }
                     </li>
                   `
                     )
                     .join('')}
                 </ul>`
              : '';

          const dynamicDescriptionText =
            task.description && task.description.trim()
              ? `<p style="font-family: 'Trebuchet MS', sans-serif; color: #1E293B; margin: 12px 0;">${task.description}</p>`
              : `<p style="font-family: 'Trebuchet MS', sans-serif; color: #1E293B; margin: 12px 0;">You have been assigned the task <strong>${task.title}</strong> under the <strong>${projectName}</strong> project.</p>`;

          const mainDynamicContent = `
            ${dynamicDescriptionText}

            <div style="font-family: 'Trebuchet MS', sans-serif; margin: 16px 0; padding: 14px 18px; background-color: #F8FAFC; border-left: 4px solid #059669; border-radius: 6px;">
              <div style="margin-bottom: 8px; font-weight: bold; color: #0F172A; font-size: 15px;">Task Summary: ${task.title}</div>
              <div>1. <strong>Project Name:</strong> ${projectName}</div>
              <div>2. <strong>Priority Level:</strong> ${task.priority}</div>
              <div>3. <strong>Start Date:</strong> ${task.startDate}</div>
              <div>4. <strong>Target Deadline:</strong> <span style="color: #059669; font-weight: bold;">${task.dueDate}</span></div>
            </div>

            ${attachmentHtml}
          `;

          const subject = `Action Required: ${task.title} - ${projectName}`;
          const firstName = assignee.name.split(' ')[0] || 'Team Member';
          const fullHtml = generateDynamicCompanyEmail(firstName, assignor, mainDynamicContent);

          const notif: EmailNotification = {
            id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'ASSIGNMENT',
            taskId: task.id,
            taskTitle: task.title,
            recipientEmail: assignee.email,
            recipientName: assignee.name,
            senderName: assignor.name,
            subject,
            body: fullHtml,
            attachmentsCount: attachmentNames.length,
            attachmentNames,
            sentAt: task.createdAt || new Date().toISOString(),
            read: false,
            status: 'SENT',
          };

          newNotifications.push(notif);
        }
      });

      if (newNotifications.length > 0) {
        return [...newNotifications, ...prevNotifs];
      }
      return prevNotifs;
    });
  }, [tasks, teamMembers, projects]);

  const logActivity = (
    taskId: string,
    actionType: TaskActivity['actionType'],
    details: string,
    userOverride?: TeamMember
  ) => {
    const activeUser = userOverride || currentUser;
    const newActivity: TaskActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      userId: activeUser?.id || 'sys-1',
      userName: activeUser?.name || 'System / Admin',
      userColor: activeUser?.color || '#059669',
      actionType,
      details,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const selectAllTasks = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };

  const clearTaskSelection = () => {
    setSelectedTaskIds([]);
  };

  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Task>): Promise<void> => {
    if (taskIds.length === 0) return;
    for (const id of taskIds) {
      await updateTask(id, updates);
    }
    setSelectedTaskIds([]);
  };

  const bulkDeleteTasks = async (taskIds: string[]): Promise<void> => {
    if (taskIds.length === 0) return;
    setTasks((prev) => prev.filter((t) => !taskIds.includes(t.id)));
    setSelectedTaskIds([]);
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsDetailPanelOpen(true);
  };

  const closeTaskDetail = () => {
    setIsDetailPanelOpen(false);
  };

  const markNotificationAsRead = (id: string) => {
    setEmailNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    const clearedSet = getClearedNotificationIds();
    emailNotifications.forEach((n) => {
      if (n.id) clearedSet.add(n.id);
      if (n.taskId) clearedSet.add(`task-${n.taskId}`);
    });
    tasks.forEach((t) => clearedSet.add(`task-${t.id}`));
    saveClearedNotificationIds(clearedSet);

    setEmailNotifications([]);
  };

  const syncWithGoogleSheets = async () => {
    setIsSyncing(true);
    try {
      const syncedData = await syncAllWithAppsScript();
      if (syncedData) {
        const sortedTasks = sortTasksNewestFirst(syncedData.tasks || []);
        setTasks(sortedTasks);
        saveTasksToStorage(sortedTasks);
        setProjects(syncedData.projects || []);
        setTeamMembers(syncedData.teamMembers || []);
        setComments(syncedData.comments || []);
        if (syncedData.teamMembers && syncedData.teamMembers.length > 0) {
          refreshUser(syncedData.teamMembers);
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger Deadline Reminder Email
  const sendDeadlineReminder = async (taskId: string, senderUser?: TeamMember): Promise<boolean> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    const assigneeMember = teamMembers.find(
      (m) =>
        m.id === task.assigneeId ||
        (m.email && m.email.trim().toLowerCase() === (task.assigneeEmail || task.assigneeId || '').trim().toLowerCase()) ||
        (m.name && m.name.trim().toLowerCase() === (task.assigneeId || '').trim().toLowerCase())
    );

    const assigneeEmail =
      task.assigneeEmail ||
      assigneeMember?.email ||
      (task.assigneeId.includes('@') ? task.assigneeId : '');

    if (!assigneeEmail || !assigneeEmail.includes('@')) {
      alert('Cannot send reminder email: No valid email address found for task assignee.');
      return false;
    }

    const assigneeName =
      assigneeMember?.name ||
      (assigneeEmail.includes('@') ? assigneeEmail.split('@')[0] : 'Team Member');

    const assignee: TeamMember = assigneeMember || {
      id: task.assigneeId || `tm-${Date.now()}`,
      name: assigneeName,
      email: assigneeEmail,
      role: 'Employee',
      color: '#10B981',
      active: true,
    };

    const project = projects.find((p) => p.id === task.projectId);

    const notification = createReminderNotification(task, assignee, project, senderUser);
    setEmailNotifications((prev) => [notification, ...prev]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('deepwoods_notification_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return true;
  };

  // Add Attachment to Task
  const addAttachmentToTask = async (taskId: string, attachment: TaskAttachment) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updatedAttachments = [...(task.attachments || []), attachment];
    await updateTask(taskId, { attachments: updatedAttachments });
  };

  // Remove Attachment from Task
  const removeAttachmentFromTask = async (taskId: string, attachmentId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updatedAttachments = (task.attachments || []).filter((a) => a.id !== attachmentId);
    await updateTask(taskId, { attachments: updatedAttachments });
  };

  // Task CRUD Operations
  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = sortTasksNewestFirst([newTask, ...tasks]);
    setTasks(updatedTasks);

    // Robust Assignee & Assignor Resolution
    const assigneeMember = teamMembers.find(
      (m) =>
        m.id === newTask.assigneeId ||
        (newTask.assigneeEmail && m.email.trim().toLowerCase() === newTask.assigneeEmail.trim().toLowerCase()) ||
        (m.email && m.email.trim().toLowerCase() === newTask.assigneeId.trim().toLowerCase())
    );

    const assigneeEmail =
      assigneeMember?.email ||
      (newTask.assigneeEmail && newTask.assigneeEmail.includes('@') ? newTask.assigneeEmail : '') ||
      (newTask.assigneeId.includes('@') ? newTask.assigneeId : '');

    const assigneeName =
      assigneeMember?.name ||
      (assigneeEmail.includes('@') ? assigneeEmail.split('@')[0] : 'Team Member');

    const assignee: TeamMember = assigneeMember || {
      id: newTask.assigneeId || `tm-${Date.now()}`,
      name: assigneeName,
      email: assigneeEmail,
      role: 'Employee',
      color: '#2563EB',
      active: true,
    };

    const assignorMember = teamMembers.find(
      (m) =>
        (newTask.assignorId && m.id === newTask.assignorId) ||
        (newTask.assignorEmail && m.email.trim().toLowerCase() === newTask.assignorEmail.trim().toLowerCase()) ||
        (newTask.assignorName && m.name.trim().toLowerCase() === newTask.assignorName.trim().toLowerCase())
    );

    const activeUserOrLead: TeamMember | undefined = currentUser || teamMembers.find((m) => m.role === 'Admin' || m.role === 'Product Manager') || teamMembers[0];

    const assignorEmail = newTask.assignorEmail || assignorMember?.email || activeUserOrLead?.email || '';
    const assignorName = newTask.assignorName || assignorMember?.name || activeUserOrLead?.name || 'Assignor';
    const assignorRole = newTask.assignorRole || assignorMember?.role || activeUserOrLead?.role || 'Admin';
    const assignorColor = assignorMember?.color || (activeUserOrLead ? activeUserOrLead.color : '#06B6D4');

    const assignor: TeamMember = assignorMember || {
      id: newTask.assignorId || activeUserOrLead?.id || 'tm-assignor',
      name: assignorName,
      email: assignorEmail,
      role: assignorRole,
      color: assignorColor,
      active: true,
    };

    const project = projects.find((p) => p.id === newTask.projectId);

    // Trigger Task Assignment Email Notification & Record in State
    const emailNotif = createAssignmentNotification(newTask, assignee, assignor, project, newTask.attachments);
    setEmailNotifications((prev) => [emailNotif, ...prev]);

    // Sync to Google Apps Script / Sheets
    sendAppsScriptAction('createTask', { data: newTask });

    logActivity(newTask.id, 'CREATED', `Created task "${newTask.title}"`);

    return newTask;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    let updatedTask: Task | null = null;
    let isNewlyCompleted = false;
    let completedDateStr = '';

    const existingTask = tasks.find((t) => t.id === taskId);
    if (existingTask) {
      if (updates.status && updates.status !== existingTask.status) {
        logActivity(taskId, 'STATUS_CHANGE', `Changed status from "${existingTask.status}" to "${updates.status}"`);
      }
      if (updates.priority && updates.priority !== existingTask.priority) {
        logActivity(taskId, 'PRIORITY_CHANGE', `Changed priority from "${existingTask.priority}" to "${updates.priority}"`);
      }
      if (updates.assigneeId && updates.assigneeId !== existingTask.assigneeId) {
        const newM = teamMembers.find((m) => m.id === updates.assigneeId);
        logActivity(taskId, 'REASSIGNED', `Reassigned task to ${newM?.name || updates.assigneeId}`);
      }
      if (updates.dueDate && updates.dueDate !== existingTask.dueDate) {
        logActivity(taskId, 'DUE_DATE_CHANGE', `Updated target deadline to ${updates.dueDate}`);
      }
    }

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        if (updates.status === 'Done' && t.status !== 'Done') {
          isNewlyCompleted = true;
          completedDateStr = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          updates.completedAt = new Date().toISOString();
        }

        updatedTask = {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return updatedTask;
      }
      return t;
    });

    setTasks(updatedTasks);
    if (selectedTask?.id === taskId && updatedTask) {
      setSelectedTask(updatedTask);
    }

    // Trigger Completion Email to Assignor if task marked as Done
    if (isNewlyCompleted && updatedTask) {
      const taskObj = updatedTask as Task;
      const assigneeMember = teamMembers.find((m) => m.id === taskObj.assigneeId || m.email.toLowerCase() === (taskObj.assigneeEmail || '').toLowerCase());
      const assigneeEmail = taskObj.assigneeEmail || assigneeMember?.email || 'member@deepwoodsgreen.com';
      const assigneeName = assigneeMember?.name || (assigneeEmail.includes('@') ? assigneeEmail.split('@')[0] : 'Team Member');

      const assignee: TeamMember = assigneeMember || {
        id: taskObj.assigneeId,
        name: assigneeName,
        email: assigneeEmail,
        role: 'Team Member',
        color: '#2563EB',
        active: true,
      };

      const assignorMember = teamMembers.find(
        (m) =>
          (taskObj.assignorId && m.id === taskObj.assignorId) ||
          (taskObj.assignorEmail && m.email.trim().toLowerCase() === taskObj.assignorEmail.trim().toLowerCase()) ||
          (taskObj.assignorName && m.name.trim().toLowerCase() === taskObj.assignorName.trim().toLowerCase())
      );

      const defaultAdminOrLead: TeamMember | undefined = teamMembers.find((m) => m.role === 'Admin' || m.role === 'Product Manager') || teamMembers[0];

      const assignorEmail = taskObj.assignorEmail || assignorMember?.email || defaultAdminOrLead?.email || '';
      const assignorName = taskObj.assignorName || assignorMember?.name || defaultAdminOrLead?.name || 'Assignor';
      const assignorRole = taskObj.assignorRole || assignorMember?.role || defaultAdminOrLead?.role || 'Admin';
      const assignorColor = assignorMember?.color || (defaultAdminOrLead ? defaultAdminOrLead.color : '#06B6D4');

      const assignor: TeamMember = assignorMember || {
        id: taskObj.assignorId || defaultAdminOrLead?.id || 'tm-assignor',
        name: assignorName,
        email: assignorEmail,
        role: assignorRole,
        color: assignorColor,
        active: true,
      };

      const project = projects.find((p) => p.id === taskObj.projectId);

      const completionEmail = createCompletionNotification(
        taskObj,
        assignee,
        assignor,
        completedDateStr,
        project
      );
      setEmailNotifications((prev) => {
        const next = [completionEmail, ...prev];
        saveEmailNotifications(next);
        return next;
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('deepwoods_notification_updated'));
        window.dispatchEvent(new Event('storage'));
      }
    }

    if (updatedTask) {
      sendAppsScriptAction('updateTask', { data: updatedTask });
    }

    return updatedTask;
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setIsDetailPanelOpen(false);
      setSelectedTask(null);
    }
    sendAppsScriptAction('deleteTask', { id: taskId });
    return true;
  };

  // Project CRUD Operations
  const createProject = async (projData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    const newProj: Project = {
      ...projData,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, newProj]);
    sendAppsScriptAction('createProject', { data: newProj });
    return newProj;
  };

  const updateProject = async (projId: string, updates: Partial<Project>): Promise<Project | null> => {
    let updated: Project | null = null;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projId) {
          updated = { ...p, ...updates };
          return updated;
        }
        return p;
      })
    );
    if (updated) {
      sendAppsScriptAction('updateProject', { data: updated });
    }
    return updated;
  };

  const deleteProject = async (projId: string): Promise<boolean> => {
    setProjects((prev) => prev.filter((p) => p.id !== projId));
    if (selectedProjectId === projId) {
      setSelectedProjectId('ALL');
    }
    sendAppsScriptAction('deleteProject', { id: projId });
    return true;
  };

  // Team CRUD Operations
  const addTeamMember = async (memberData: Omit<TeamMember, 'id'>): Promise<TeamMember> => {
    const normEmail = (memberData.email || '').trim().toLowerCase();
    const existing = teamMembers.find((m) => m.email && m.email.trim().toLowerCase() === normEmail);

    if (existing) {
      const updated = { ...existing, ...memberData };
      setTeamMembers((prev) => prev.map((m) => (m.id === existing.id ? updated : m)));
      sendAppsScriptAction('updateTeamMember', { data: updated });
      return updated;
    }

    const newMember: TeamMember = {
      ...memberData,
      id: `tm-${Date.now()}`,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    sendAppsScriptAction('addTeamMember', { data: newMember });
    return newMember;
  };

  const updateTeamMember = async (memberId: string, updates: Partial<TeamMember>): Promise<TeamMember | null> => {
    let updated: TeamMember | null = null;
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          updated = { ...m, ...updates };
          return updated;
        }
        return m;
      })
    );
    if (updated) {
      sendAppsScriptAction('updateTeamMember', { data: updated });
    }
    return updated;
  };

  const deleteTeamMember = async (memberId: string): Promise<boolean> => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    sendAppsScriptAction('deleteTeamMember', { id: memberId });
    return true;
  };

  // Comment CRUD
  const addComment = async (taskId: string, authorId: string, text: string): Promise<TaskComment> => {
    const newComment: TaskComment = {
      id: `comm-${Date.now()}`,
      taskId,
      authorId,
      text,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
    logActivity(taskId, 'COMMENT_ADDED', `Posted comment: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`);
    sendAppsScriptAction('addComment', { data: newComment });
    return newComment;
  };

  return (
    <DataContext.Provider
      value={{
        tasks,
        projects,
        teamMembers,
        comments,
        activities,
        emailNotifications,
        filterOptions,
        selectedProjectId,
        selectedTask,
        selectedTaskIds,
        isDetailPanelOpen,
        sheetsConfig,
        isSyncing,
        setSelectedProjectId,
        setSelectedTask,
        setSelectedTaskIds,
        toggleSelectTask,
        selectAllTasks,
        clearTaskSelection,
        openTaskDetail,
        closeTaskDetail,
        setFilterOptions,
        sendDeadlineReminder,
        markNotificationAsRead,
        clearNotifications,
        addAttachmentToTask,
        removeAttachmentFromTask,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        bulkUpdateTasks,
        bulkDeleteTasks,
        logActivity,
        createProject,
        updateProject,
        deleteProject,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        addComment,
        syncWithGoogleSheets,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
