import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Project, TeamMember, TaskComment, FilterOptions, SheetsConfig, TaskStatus, TaskAttachment, TaskActivity } from '../types';
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
import { isTaskAssignedToUser, matchesAssigneeFilter, normalizeRole, findTeamMemberByAssigneeId } from '../lib/permissions';
import { useAuth } from './AuthContext';
import { sendTaskAssignmentEmail, sendTaskDeadlineReminderEmail } from '../lib/emailService';
import { isBefore, isSameDay, startOfDay } from 'date-fns';
import { toYYYYMMDD } from '../lib/dateUtils';

interface DataContextType {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  comments: TaskComment[];
  activities: TaskActivity[];
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

  // Cross-tab real-time sync & periodic Google Sheets polling
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'deepwoods_tasks' && e.newValue) {
        try { setTasks(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'deepwoods_comments' && e.newValue) {
        try { setComments(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'deepwoods_projects' && e.newValue) {
        try { setProjects(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'deepwoods_team' && e.newValue) {
        try { setTeamMembers(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'deepwoods_activities' && e.newValue) {
        try { setActivities(JSON.parse(e.newValue)); } catch {}
      }
    };

    const handleFocus = () => {
      syncWithGoogleSheets();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    syncWithGoogleSheets();
    const interval = setInterval(() => {
      syncWithGoogleSheets();
    }, 10000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

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

  const syncWithGoogleSheets = async () => {
    setIsSyncing(true);
    try {
      const syncedData = await syncAllWithAppsScript();
      if (syncedData) {
        const localTasks = loadTasksFromStorage();
        const mergedTasksMap = new Map<string, Task>();
        (syncedData.tasks || []).forEach((st) => {
          if (st.id) mergedTasksMap.set(st.id, st);
        });
        localTasks.forEach((lt) => {
          if (!lt.id) return;
          if (!mergedTasksMap.has(lt.id)) {
            mergedTasksMap.set(lt.id, lt);
          } else {
            const st = mergedTasksMap.get(lt.id)!;
            if ((!st.attachments || st.attachments.length === 0) && lt.attachments && lt.attachments.length > 0) {
              mergedTasksMap.set(lt.id, { ...st, attachments: lt.attachments });
            }
          }
        });
        const mergedTasks = Array.from(mergedTasksMap.values());

        const sortedTasks = sortTasksNewestFirst(mergedTasks);
        setTasks(sortedTasks);
        saveTasksToStorage(sortedTasks);
        setProjects(syncedData.projects || []);
        setTeamMembers(syncedData.teamMembers || []);

        // Merge local comments with synced comments to ensure freshly added comments are never lost before GS sync completes
        const cleanId = (str: any): string => String(str || '').replace(/[\r\n\t]/g, '').trim();
        const localComments = loadCommentsFromStorage().map((c) => ({
          ...c,
          id: cleanId(c.id),
          taskId: cleanId(c.taskId),
          authorId: cleanId(c.authorId),
        }));
        const syncedComments = (syncedData.comments || []).map((c) => ({
          ...c,
          id: cleanId(c.id),
          taskId: cleanId(c.taskId),
          authorId: cleanId(c.authorId),
        }));
        const mergedCommentsMap = new Map();
        [...syncedComments, ...localComments].forEach((comm) => {
          if (comm.id) mergedCommentsMap.set(comm.id, comm);
        });
        const mergedComments = Array.from(mergedCommentsMap.values());

        setComments(mergedComments);
        saveCommentsToStorage(mergedComments);
        if (syncedData.teamMembers && syncedData.teamMembers.length > 0) {
          refreshUser(syncedData.teamMembers);
        }
        if (selectedTask) {
          const currentSelected = sortedTasks.find((t) => t.id === selectedTask.id);
          if (currentSelected) {
            setSelectedTask(currentSelected);
          }
        }

        // Automated Daily Deadline Reminder Check
        const todayStr = new Date().toISOString().split('T')[0];
        const lastAutoCheck = localStorage.getItem('deepwoods_auto_reminder_date');
        if (lastAutoCheck !== todayStr) {
          localStorage.setItem('deepwoods_auto_reminder_date', todayStr);
          const todayObj = startOfDay(new Date());

          sortedTasks.forEach((t) => {
            if (t.status === 'Done') return;
            const dueYmd = toYYYYMMDD(t.dueDate);
            if (!dueYmd) return;
            const dueObj = startOfDay(new Date(dueYmd));
            const isDueTodayOrOverdue = isSameDay(dueObj, todayObj) || isBefore(dueObj, todayObj);

            if (isDueTodayOrOverdue) {
              const proj = (syncedData.projects || projects).find((p) => p.id === t.projectId);
              const assigneeM = findTeamMemberByAssigneeId(t.assigneeId, (syncedData.teamMembers || teamMembers), t.assigneeEmail);
              const assignorName = t.assignorName || 'Assignor';
              const assignorEmail = t.assignorEmail || '';

              sendTaskDeadlineReminderEmail({
                task: t,
                project: proj,
                assignee: assigneeM,
                assignorName,
                assignorEmail,
                assignorRole: t.assignorRole || 'Admin',
              }).catch((err) => console.warn('[AutoReminder] Skipped:', err));
            }
          });
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Add Attachment to Task
  const addAttachmentToTask = async (taskId: string, attachment: TaskAttachment) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updatedAttachments = [...(task.attachments || []), attachment];
    await updateTask(taskId, { attachments: updatedAttachments });
    logActivity(taskId, 'ATTACHMENT_ADDED', `Uploaded attachment "${attachment.fileName}"`);
  };

  // Remove Attachment from Task
  const removeAttachmentFromTask = async (taskId: string, attachmentId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const removedAtt = (task.attachments || []).find((a) => a.id === attachmentId);
    const updatedAttachments = (task.attachments || []).filter((a) => a.id !== attachmentId);
    await updateTask(taskId, { attachments: updatedAttachments });
    if (removedAtt) {
      logActivity(taskId, 'UPDATED', `Removed attachment "${removedAtt.fileName}"`);
    }
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

    // Ensure resolved emails and details are on newTask
    newTask.assigneeEmail = assigneeEmail;
    newTask.assignorId = assignor.id;
    newTask.assignorEmail = assignorEmail;
    newTask.assignorName = assignorName;
    newTask.assignorRole = assignorRole;

    const project = projects.find((p) => p.id === newTask.projectId);

    // Sync to Google Apps Script / Sheets
    sendAppsScriptAction('createTask', { data: newTask });

    logActivity(newTask.id, 'CREATED', `Created task "${newTask.title}"`);

    // Dispatch Task Assignment Notification Email
    sendTaskAssignmentEmail({
      task: newTask,
      project,
      assignee,
      assignorName: assignor.name,
      assignorEmail: assignor.email,
      assignorRole: assignor.role,
      isReassignment: false,
    }).catch((err) => console.warn('Background task assignment email send error:', err));

    return newTask;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    let updatedTask: Task | null = null;

    const existingTask = tasks.find((t) => t.id === taskId);
    if (existingTask) {
      if (updates.status && updates.status !== existingTask.status) {
        logActivity(taskId, 'STATUS_CHANGE', `Changed status from "${existingTask.status}" to "${updates.status}"`);
      }
      if (updates.priority && updates.priority !== existingTask.priority) {
        logActivity(taskId, 'PRIORITY_CHANGE', `Changed priority from "${existingTask.priority}" to "${updates.priority}"`);
      }
      if (updates.assigneeId && updates.assigneeId !== existingTask.assigneeId) {
        const newM = findTeamMemberByAssigneeId(updates.assigneeId, teamMembers);
        if (newM && newM.email) {
          updates.assigneeEmail = newM.email;
        }
        logActivity(taskId, 'REASSIGNED', `Reassigned task to ${newM?.name || updates.assigneeId}`);
      }
      if (updates.dueDate && updates.dueDate !== existingTask.dueDate) {
        logActivity(taskId, 'DUE_DATE_CHANGE', `Updated target deadline to ${updates.dueDate}`);
      }
    }

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        if (updates.status === 'Done' && t.status !== 'Done') {
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

    if (updatedTask) {
      sendAppsScriptAction('updateTask', { data: updatedTask });

      // If task was reassigned to a new user, dispatch reassignment email
      if (updates.assigneeId && existingTask && updates.assigneeId !== existingTask.assigneeId) {
        const activeTask: Task = updatedTask || { ...existingTask, ...updates };
        const newM = findTeamMemberByAssigneeId(updates.assigneeId, teamMembers);
        const proj = projects.find((p) => p.id === activeTask.projectId);
        const assignorName = activeTask.assignorName || currentUser?.name || 'Assignor';
        const assignorEmail = activeTask.assignorEmail || currentUser?.email || '';
        const assignorRole = activeTask.assignorRole || currentUser?.role || 'Admin';

        sendTaskAssignmentEmail({
          task: activeTask,
          project: proj,
          assignee: newM,
          assignorName,
          assignorEmail,
          assignorRole,
          isReassignment: true,
        }).catch((err) => console.warn('Background task reassignment email send error:', err));
      }
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
      taskId: taskId.trim(),
      authorId,
      text,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => {
      const updated = [...prev, newComment];
      saveCommentsToStorage(updated);
      return updated;
    });
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
