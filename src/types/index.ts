export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

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
  assignorName?: string;
  assignorRole?: string;
  priority: Priority;
  status: TaskStatus;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  storyPoints?: number;
  attachments?: TaskAttachment[];
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userColor?: string;
  actionType: 'STATUS_CHANGE' | 'PRIORITY_CHANGE' | 'REASSIGNED' | 'DUE_DATE_CHANGE' | 'UPDATED' | 'COMMENT_ADDED' | 'ATTACHMENT_ADDED' | 'CREATED';
  details: string;
  timestamp: string; // ISO string
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

export type UserRole = 'Admin' | 'Product Manager' | 'Employee';

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole | string;
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
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  projectId: string;
  assigneeId: string;
  priority: string;
  status: string;
  myTasksOnly: boolean;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
}

export interface EmailNotification {
  id: string;
  type: 'ASSIGNMENT' | 'REMINDER' | 'STATUS_CHANGE' | 'COMPLETION';
  taskId: string;
  taskTitle: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  subject: string;
  body: string;
  attachmentsCount: number;
  attachmentNames: string[];
  sentAt: string;
  read: boolean;
  status: 'SENT' | 'FAILED' | 'PENDING';
}

export interface SheetsConfig {
  webAppUrl?: string;
  spreadSheetId?: string;
  spreadsheetId?: string;
  clientId?: string;
  apiKey?: string;
  useGoogleSheets?: boolean;
  autoSync?: boolean;
  isConfigured?: boolean;
}
