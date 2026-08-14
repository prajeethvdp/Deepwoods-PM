import { Task, UserRole } from '../types';

/**
 * Normalizes user role strings into standardized UserRole enum values:
 * 'Admin' | 'Product Manager' | 'Employee'
 */
export function normalizeRole(role?: string): UserRole {
  if (!role) return 'Employee';
  const trimmed = role.trim().toLowerCase();
  if (trimmed === 'admin') return 'Admin';
  if (trimmed === 'product manager' || trimmed === 'pm' || trimmed === 'project lead') return 'Product Manager';
  if (trimmed === 'member' || trimmed === 'team member' || trimmed === 'employee') return 'Employee';
  return 'Employee';
}

/**
 * Admin only: Add, edit, delete workspace team members, manage roles and access status.
 */
export function canManageTeam(role?: string): boolean {
  return normalizeRole(role) === 'Admin';
}

/**
 * Admin and Product Manager: Create, edit, and delete projects.
 */
export function canManageProjects(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === 'Admin' || norm === 'Product Manager';
}

/**
 * Admin and Product Manager: Access Team Settings page (PM has read-only access).
 */
export function canAccessTeamPage(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === 'Admin' || norm === 'Product Manager';
}

/**
 * Task Deletion Permission: Admin/PM can delete any task.
 * Employees can only delete tasks they created or are assigned to.
 */
export function canDeleteTask(role?: string, task?: Task, currentUserId?: string): boolean {
  const norm = normalizeRole(role);
  if (norm === 'Admin' || norm === 'Product Manager') return true;
  if (!task || !currentUserId) return false;
  return task.assignorId === currentUserId || task.assigneeId === currentUserId;
}

/**
 * Project Deletion Permission: Admin and Product Manager only.
 */
export function canDeleteProject(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === 'Admin' || norm === 'Product Manager';
}

/**
 * Checks if a task is assigned to the given user by matching assigneeId or assigneeEmail.
 */
export function isTaskAssignedToUser(task: { assigneeId: string; assigneeEmail?: string }, user: { id: string; email?: string } | null): boolean {
  if (!user) return false;
  if (task.assigneeId === user.id) return true;
  if (task.assigneeEmail && user.email && task.assigneeEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
  return false;
}
