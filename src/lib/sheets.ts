import { Task, Project, TeamMember, TaskComment, SheetsConfig } from '../types';

const TASKS_STORAGE_KEY = 'deepwoods_tasks';
const PROJECTS_STORAGE_KEY = 'deepwoods_projects';
const TEAM_STORAGE_KEY = 'deepwoods_team';
const COMMENTS_STORAGE_KEY = 'deepwoods_comments';

// Read configuration strictly from environment variables
export const getSheetsConfig = (): SheetsConfig => {
  const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';
  const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID || '';
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return {
    spreadsheetId,
    clientId,
    apiKey: '',
    useGoogleSheets: Boolean(scriptUrl || spreadsheetId),
    autoSync: true,
  };
};

// Initialize LocalStorage with empty arrays if not present
export const initializeLocalStorage = (): void => {
  if (localStorage.getItem(TASKS_STORAGE_KEY) === null) {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify([]));
  }
  if (localStorage.getItem(PROJECTS_STORAGE_KEY) === null) {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([]));
  }
  if (localStorage.getItem(TEAM_STORAGE_KEY) === null) {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify([]));
  }
  if (localStorage.getItem(COMMENTS_STORAGE_KEY) === null) {
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify([]));
  }
};

initializeLocalStorage();

import { toYYYYMMDD } from './dateUtils';

const normalizeTaskDates = (task: Task): Task => ({
  ...task,
  startDate: toYYYYMMDD(task.startDate),
  dueDate: toYYYYMMDD(task.dueDate),
});

// Local Storage Getters and Setters
export const loadTasksFromStorage = (): Task[] => {
  const saved = localStorage.getItem(TASKS_STORAGE_KEY);
  if (!saved) return [];
  try {
    const raw: Task[] = JSON.parse(saved);
    return raw.map(normalizeTaskDates);
  } catch {
    return [];
  }
};

export const saveTasksToStorage = (tasks: Task[]): void => {
  const normalized = tasks.map(normalizeTaskDates);
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(normalized));
};

export const loadProjectsFromStorage = (): Project[] => {
  const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const saveProjectsToStorage = (projects: Project[]): void => {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
};

export const loadTeamFromStorage = (): TeamMember[] => {
  const saved = localStorage.getItem(TEAM_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const saveTeamToStorage = (team: TeamMember[]): void => {
  localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team));
};

export const loadCommentsFromStorage = (): TaskComment[] => {
  const saved = localStorage.getItem(COMMENTS_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const saveCommentsToStorage = (comments: TaskComment[]): void => {
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
};

/**
 * Google Apps Script API Communication Layer
 */
export async function syncAllWithAppsScript(): Promise<{
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  comments: TaskComment[];
} | null> {
  const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) return null;

  try {
    const res = await fetch(`${scriptUrl}?action=getAll&_t=${Date.now()}`);
    if (!res.ok) throw new Error(`Apps Script HTTP ${res.status}`);
    const result = await res.json();
    if (result.success && result.data) {
      const normalizedTasks = (result.data.tasks || []).map(normalizeTaskDates);
      saveTasksToStorage(normalizedTasks);
      saveProjectsToStorage(result.data.projects || []);
      saveTeamToStorage(result.data.teamMembers || []);
      saveCommentsToStorage(result.data.comments || []);
      return {
        ...result.data,
        tasks: normalizedTasks,
      };
    }
  } catch (err) {
    console.warn('Google Apps Script sync warning (using local storage cache):', err);
  }
  return null;
}

export async function sendAppsScriptAction(action: string, payload: any): Promise<boolean> {
  const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    console.warn(`[sendAppsScriptAction] VITE_GOOGLE_APPS_SCRIPT_URL is missing. Cannot send ${action}`);
    return false;
  }

  const postBody = JSON.stringify({ action, ...payload });

  try {
    // Mode 'no-cors' is required for Google Apps Script Web App POST redirects
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: postBody,
    });
    console.log(`[AppsScript Dispatched] Action '${action}' sent to Google Apps Script.`);
    return true;
  } catch (err) {
    console.warn(`Fetch mode error, trying sendBeacon for action ${action}:`, err);
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([postBody], { type: 'text/plain;charset=utf-8' });
        navigator.sendBeacon(scriptUrl, blob);
        return true;
      }
    } catch (beaconErr) {
      console.error('sendBeacon failed:', beaconErr);
    }
    return false;
  }
}

export async function resetPasswordInBackend(email: string, password: string): Promise<boolean> {
  return sendAppsScriptAction('resetPassword', { email, password });
}
