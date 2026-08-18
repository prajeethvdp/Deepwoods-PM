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
 * Task Deletion Permission: Admin and Product Manager only.
 * Employees cannot delete any tasks.
 */
export function canDeleteTask(role?: string, task?: Task, currentUserId?: string): boolean {
  const norm = normalizeRole(role);
  return norm === 'Admin' || norm === 'Product Manager';
}

/**
 * Project Deletion Permission: Admin and Product Manager only.
 */
export function canDeleteProject(role?: string): boolean {
  const norm = normalizeRole(role);
  return norm === 'Admin' || norm === 'Product Manager';
}

/**
 * Checks if a task is assigned to the given user by matching assigneeId, assignee name, or assigneeEmail.
 */
export function isTaskAssignedToUser(
  task: { assigneeId: string; assigneeEmail?: string },
  user: { id: string; name?: string; email?: string } | null
): boolean {
  if (!user) return false;
  const tAssignee = (task.assigneeId || '').trim().toLowerCase();
  const tEmail = (task.assigneeEmail || '').trim().toLowerCase();
  const uId = (user.id || '').trim().toLowerCase();
  const uName = (user.name || '').trim().toLowerCase();
  const uEmail = (user.email || '').trim().toLowerCase();

  if (tAssignee) {
    if (uId && tAssignee === uId) return true;
    if (uName && tAssignee === uName) return true;
    if (uEmail && tAssignee === uEmail) return true;
  }
  if (tEmail && uEmail && tEmail === uEmail) return true;
  return false;
}

/**
 * Checks if a task matches the assignee filter selected by Admin / PM.
 */
export function matchesAssigneeFilter(
  task: { assigneeId: string; assigneeEmail?: string },
  assigneeIdFilter: string,
  teamMembers: { id: string; name?: string; email?: string }[]
): boolean {
  if (!assigneeIdFilter || assigneeIdFilter === 'ALL') return true;

  const targetMember = teamMembers.find(
    (m) =>
      m.id === assigneeIdFilter ||
      (m.email && m.email.trim().toLowerCase() === assigneeIdFilter.trim().toLowerCase())
  );

  if (!targetMember) {
    const tAssignee = (task.assigneeId || '').trim().toLowerCase();
    const filterVal = assigneeIdFilter.trim().toLowerCase();
    return tAssignee === filterVal;
  }

  return isTaskAssignedToUser(task, targetMember);
}
