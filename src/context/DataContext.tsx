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
import { isBefore, isSameDay, startOfDay } from 'date-fns';
import { isDeadlineBeforeStartDate } from '../lib/dateUtils';
import { sendTaskAssignmentEmail } from '../lib/emailService';
import { GENERAL_PROJECT } from '../lib/constants';

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
  addAttachmentsToTask: (taskId: string, attachments: TaskAttachment[]) => Promise<void>;
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

const SENT_REMINDERS_STORAGE_KEY = 'deepwoods_sent_task_reminders';

export const getSentTaskReminders = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(SENT_REMINDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveSentTaskReminder = (taskId: string, dateStr: string) => {
  try {
    const current = getSentTaskReminders();
    current[taskId] = dateStr;
    localStorage.setItem(SENT_REMINDERS_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('[Storage] Failed to save sent task reminder:', err);
  }
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const CLEARED_NOTIFS_STORAGE_KEY = 'deepwoods_cleared_notification_ids';
const DELETED_ATT_STORAGE_KEY = 'deepwoods_deleted_attachment_ids';
const DELETED_TASKS_STORAGE_KEY = 'deepwoods_deleted_task_ids';

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

const getDeletedTaskIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_TASKS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const recordDeletedTaskId = (id: string) => {
  if (!id) return;
  try {
    const set = getDeletedTaskIds();
    set.add(id.trim());
    localStorage.setItem(DELETED_TASKS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
};

const getDeletedAttachmentIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_ATT_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const recordDeletedAttachmentId = (id: string) => {
  try {
    const set = getDeletedAttachmentIds();
    set.add(id);
    localStorage.setItem(DELETED_ATT_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
};

const ATT_DATA_PREFIX = 'deepwoods_att_data_';

export const saveAttachmentDataUrl = (id: string, dataUrl: string) => {
  if (!id || !dataUrl) return;
  try {
    localStorage.setItem(`${ATT_DATA_PREFIX}${id}`, dataUrl);
  } catch (e) {
    console.warn('[AttachmentStorage] LocalStorage quota exceeded, preserving in memory:', e);
  }
};

export const getAttachmentDataUrl = (id: string): string => {
  if (!id) return '';
  try {
    return localStorage.getItem(`${ATT_DATA_PREFIX}${id}`) || '';
  } catch {
    return '';
  }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [projects, setProjects] = useState<Project[]>(() => {
    const loaded = loadProjectsFromStorage();
    if (!loaded.some((p) => p.id === 'proj-general')) {
      return [GENERAL_PROJECT, ...loaded];
    }
    return loaded;
  });
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

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsDetailPanelOpen(true);
  };

  const closeTaskDetail = () => {
    setIsDetailPanelOpen(false);
  };

const mergeTaskAttachments = (syncedAtts: TaskAttachment[] = [], localAtts: TaskAttachment[] = []): TaskAttachment[] => {
  const deletedIds = getDeletedAttachmentIds();
  const attMap = new Map<string, TaskAttachment>();

  (localAtts || []).forEach((att) => {
    if (!att || !att.id || deletedIds.has(att.id)) return;
    const cachedUrl = getAttachmentDataUrl(att.id);
    const bestUrl = att.dataUrl || cachedUrl || '';
    if (bestUrl) saveAttachmentDataUrl(att.id, bestUrl);
    attMap.set(att.id, {
      ...att,
      dataUrl: bestUrl,
    });
  });

  (syncedAtts || []).forEach((att) => {
    if (!att || !att.id || deletedIds.has(att.id)) return;
    const cachedUrl = getAttachmentDataUrl(att.id);
    const bestUrl = att.dataUrl || cachedUrl || '';
    if (bestUrl) saveAttachmentDataUrl(att.id, bestUrl);

    if (!attMap.has(att.id)) {
      attMap.set(att.id, {
        ...att,
        dataUrl: bestUrl,
      });
    } else {
      const localAtt = attMap.get(att.id)!;
      const combinedUrl = localAtt.dataUrl || bestUrl || '';
      if (combinedUrl) saveAttachmentDataUrl(att.id, combinedUrl);
      attMap.set(att.id, {
        ...att,
        ...localAtt,
        dataUrl: combinedUrl,
      });
    }
  });

  return Array.from(attMap.values());
};

  const syncWithGoogleSheets = async () => {
    setIsSyncing(true);
    try {
      const syncedData = await syncAllWithAppsScript();
      if (syncedData) {
        const deletedTaskIds = getDeletedTaskIds();
        const localTasks = loadTasksFromStorage().filter((lt) => lt.id && !deletedTaskIds.has(lt.id.trim()));
        const mergedTasksMap = new Map<string, Task>();

        (syncedData.tasks || []).forEach((st) => {
          if (st.id && !deletedTaskIds.has(st.id.trim())) {
            mergedTasksMap.set(st.id.trim(), st);
          }
        });

        localTasks.forEach((lt) => {
          if (!lt.id || deletedTaskIds.has(lt.id.trim())) return;
          const cleanId = lt.id.trim();
          if (!mergedTasksMap.has(cleanId)) {
            mergedTasksMap.set(cleanId, lt);
          } else {
            const st = mergedTasksMap.get(cleanId)!;
            const mergedAttachments = mergeTaskAttachments(st.attachments, lt.attachments);
            mergedTasksMap.set(cleanId, {
              ...st,
              attachments: mergedAttachments,
            });
          }
        });
        const mergedTasks = Array.from(mergedTasksMap.values());

        const sortedTasks = sortTasksNewestFirst(mergedTasks);
        setTasks(sortedTasks);
        saveTasksToStorage(sortedTasks);
        if (syncedData.projects) {
          const hasGen = syncedData.projects.some((p: any) => p.id === 'proj-general');
          const mergedProjects = hasGen ? syncedData.projects : [GENERAL_PROJECT, ...syncedData.projects];
          setProjects(mergedProjects);
          saveProjectsToStorage(mergedProjects);
        }
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
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Add Multiple Attachments to Task safely
  const addAttachmentsToTask = async (taskId: string, newAttachments: TaskAttachment[]) => {
    if (!newAttachments || newAttachments.length === 0) return;

    // Cache Data URLs immediately in local storage to prevent any data URL loss
    newAttachments.forEach((a) => {
      if (a.id && a.dataUrl) {
        saveAttachmentDataUrl(a.id, a.dataUrl);
      }
    });

    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const currentAtts = targetTask.attachments || [];
    const attMap = new Map<string, TaskAttachment>();
    currentAtts.forEach((a) => attMap.set(a.id || a.fileName, a));
    newAttachments.forEach((a) => attMap.set(a.id || a.fileName, a));
    const merged = Array.from(attMap.values());

    const updatedTaskObj: Task = {
      ...targetTask,
      attachments: merged,
      updatedAt: new Date().toISOString(),
    };

    setTasks((prevTasks) => {
      const updated = prevTasks.map((t) => (t.id === taskId ? updatedTaskObj : t));
      saveTasksToStorage(updated);
      return updated;
    });

    if (selectedTask?.id === taskId) {
      setSelectedTask(updatedTaskObj);
    }

    sendAppsScriptAction('updateTask', { data: updatedTaskObj });
    const names = newAttachments.map((a) => a.fileName).join(', ');
    logActivity(taskId, 'ATTACHMENT_ADDED', `Uploaded attachment(s): ${names}`);
  };

  const addAttachmentToTask = async (taskId: string, attachment: TaskAttachment) => {
    await addAttachmentsToTask(taskId, [attachment]);
  };

  // Remove Attachment from Task
  const removeAttachmentFromTask = async (taskId: string, attachmentIdOrName: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const currentAtts = targetTask.attachments || [];
    const removedAtt = currentAtts.find(
      (a) => a.id === attachmentIdOrName || a.fileName === attachmentIdOrName
    );

    if (removedAtt && removedAtt.id) {
      recordDeletedAttachmentId(removedAtt.id);
    }
    if (attachmentIdOrName) {
      recordDeletedAttachmentId(attachmentIdOrName);
    }

    const updatedAttachments = currentAtts.filter(
      (a) => a.id !== attachmentIdOrName && a.fileName !== attachmentIdOrName
    );

    const updatedTaskObj: Task = {
      ...targetTask,
      attachments: updatedAttachments,
      updatedAt: new Date().toISOString(),
    };

    setTasks((prevTasks) => {
      const updated = prevTasks.map((t) => (t.id === taskId ? updatedTaskObj : t));
      saveTasksToStorage(updated);
      return updated;
    });

    if (selectedTask?.id === taskId) {
      setSelectedTask(updatedTaskObj);
    }

    sendAppsScriptAction('updateTask', { data: updatedTaskObj });

    if (removedAtt) {
      logActivity(taskId, 'UPDATED', `Removed attachment "${removedAtt.fileName}"`);
    }
  };

  // Task CRUD Operations
  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    if (isDeadlineBeforeStartDate(taskData.startDate, taskData.dueDate)) {
      throw new Error('Target deadline cannot be earlier than the start date.');
    }

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

    // Dispatch immediate Task Assignment Email upon creation
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
      const finalStart = updates.startDate !== undefined ? updates.startDate : existingTask.startDate;
      const finalDue = updates.dueDate !== undefined ? updates.dueDate : existingTask.dueDate;
      if (isDeadlineBeforeStartDate(finalStart, finalDue)) {
        console.warn('[DataContext] Task update rejected: Target deadline cannot be earlier than start date.');
        return null;
      }
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
    if (!taskId) return false;
    const cleanId = taskId.trim();
    recordDeletedTaskId(cleanId);

    setTasks((prev) => {
      const updated = prev.filter((t) => t.id && t.id.trim() !== cleanId);
      saveTasksToStorage(updated);
      return updated;
    });

    if (selectedTask?.id && selectedTask.id.trim() === cleanId) {
      setIsDetailPanelOpen(false);
      setSelectedTask(null);
    }

    sendAppsScriptAction('deleteTask', { id: cleanId });
    return true;
  };

  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Task>) => {
    if (!taskIds || taskIds.length === 0) return;
    const cleanIds = taskIds.map((id) => id.trim());

    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id && cleanIds.includes(t.id.trim())) {
          return { ...t, ...updates, updatedAt: new Date().toISOString() };
        }
        return t;
      });
      saveTasksToStorage(updated);
      return updated;
    });

    cleanIds.forEach((id) => {
      const existing = tasks.find((t) => t.id && t.id.trim() === id);
      if (existing) {
        sendAppsScriptAction('updateTask', { data: { ...existing, ...updates } });
      }
    });
  };

  const bulkDeleteTasks = async (taskIds: string[]) => {
    if (!taskIds || taskIds.length === 0) return;
    const cleanIds = taskIds.map((id) => id.trim());
    cleanIds.forEach((id) => recordDeletedTaskId(id));

    setTasks((prev) => {
      const updated = prev.filter((t) => !t.id || !cleanIds.includes(t.id.trim()));
      saveTasksToStorage(updated);
      return updated;
    });

    if (selectedTask && cleanIds.includes(selectedTask.id.trim())) {
      setIsDetailPanelOpen(false);
      setSelectedTask(null);
    }
    clearTaskSelection();

    cleanIds.forEach((id) => {
      sendAppsScriptAction('deleteTask', { id });
    });
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
        addAttachmentsToTask,
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
