export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  dataUrl: string; // Base64 or Blob URL for preview & email link
  uploadedAt: string;
  uploadedBy: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  assigneeEmail?: string;
  assignorId?: string;
  assignorEmail?: string;
  priority: Priority;
  status: TaskStatus;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  subtasks?: SubTask[];
  storyPoints?: number;
  attachments?: TaskAttachment[];
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  description: string;
  color: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'On Hold' | 'Completed';
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  color: string;
  active: boolean;
  password?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface DocNote {
  id: string;
  title: string;
  content: string;
  projectId?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailNotification {
  id: string;
  type: 'ASSIGNMENT' | 'REMINDER' | 'COMPLETION';
  taskId: string;
  taskTitle: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  subject: string;
  body: string;
  attachmentsCount: number;
  attachmentNames?: string[];
  sentAt: string;
  read: boolean;
  status: 'SENT' | 'PENDING';
}

export interface FilterOptions {
  searchQuery: string;
  projectId: string;
  assigneeId: string;
  priority: Priority | 'All';
  status: TaskStatus | 'All';
  myTasksOnly: boolean;
  datePreset: string; // 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'CUSTOM'
  startDate?: string;
  endDate?: string;
}

export interface SheetsConfig {
  spreadsheetId: string;
  clientId: string;
  apiKey: string;
  useGoogleSheets: boolean;
  autoSync: boolean;
  lastSyncedAt?: string;
}
