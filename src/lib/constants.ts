import { Priority, TaskStatus } from '../types';

export const INITIAL_TEAM_MEMBERS: any[] = [];

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; text: string; border: string }> = {
  Urgent: {
    label: 'Urgent',
    color: '#E11D48',
    bg: 'bg-transparent',
    text: 'text-rose-600 font-bold',
    border: 'border-rose-300',
  },
  High: {
    label: 'High',
    color: '#E11D48',
    bg: 'bg-transparent',
    text: 'text-rose-600 font-bold',
    border: 'border-rose-300',
  },
  Medium: {
    label: 'Medium',
    color: '#D97706',
    bg: 'bg-transparent',
    text: 'text-amber-600 font-bold',
    border: 'border-amber-300',
  },
  Low: {
    label: 'Low',
    color: '#2563EB',
    bg: 'bg-transparent',
    text: 'text-blue-600 font-bold',
    border: 'border-blue-300',
  },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; text: string; border: string }> = {
  'To Do': {
    label: 'To Do',
    color: '#64748B',
    bg: 'bg-transparent',
    text: 'text-slate-700 font-bold',
    border: 'border-slate-300',
  },
  'In Progress': {
    label: 'In Progress',
    color: '#2563EB',
    bg: 'bg-transparent',
    text: 'text-blue-700 font-bold',
    border: 'border-blue-300',
  },
  'In Review': {
    label: 'In Review',
    color: '#9333EA',
    bg: 'bg-transparent',
    text: 'text-purple-700 font-bold',
    border: 'border-purple-300',
  },
  Done: {
    label: 'Done',
    color: '#10B981',
    bg: 'bg-transparent',
    text: 'text-emerald-700 font-bold',
    border: 'border-emerald-300',
  },
};

export const KANBAN_COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
