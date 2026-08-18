import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { KANBAN_COLUMNS } from '../../lib/constants';
import { Task, TaskStatus, Priority } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { isTaskAssignedToUser, matchesAssigneeFilter } from '../../lib/permissions';
import { sortTasksNewestFirst } from '../../lib/sheets';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { Layers, CheckSquare, Users, Folder, AlertCircle } from 'lucide-react';

interface BoardProps {
  openTaskModalWithStatus: (status: TaskStatus) => void;
  isMyTasksView?: boolean;
}

export type KanbanGroupBy = 'status' | 'assignee' | 'project' | 'priority';

export const Board: React.FC<BoardProps> = ({ openTaskModalWithStatus, isMyTasksView = false }) => {
  const {
    tasks,
    updateTaskStatus,
    selectedProjectId,
    filterOptions,
    teamMembers,
    projects,
    selectedTaskIds,
    selectAllTasks,
    clearTaskSelection,
  } = useData();
  const { user, isEmployee } = useAuth();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [groupBy, setGroupBy] = useState<KanbanGroupBy>('status');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const assignableMembers = teamMembers.filter((m) => m.role !== 'Admin');

  // Apply project and filter criteria, sorted newest first
  const filteredTasks = sortTasksNewestFirst(
    tasks.filter((t) => {
      // Strictly filter to user's tasks if Employee or in My Tasks View
      if ((isEmployee || isMyTasksView) && user && !isTaskAssignedToUser(t, user)) {
        return false;
      }
      // Project filter
      if (selectedProjectId !== 'ALL' && t.projectId !== selectedProjectId) {
        return false;
      }
      // Search query
      if (
        filterOptions.searchQuery &&
        !t.title.toLowerCase().includes(filterOptions.searchQuery.toLowerCase()) &&
        !t.description.toLowerCase().includes(filterOptions.searchQuery.toLowerCase())
      ) {
        return false;
      }
      // Assignee filter (only when not in My Tasks View)
      if (!isMyTasksView && !matchesAssigneeFilter(t, filterOptions.assigneeId, teamMembers)) {
        return false;
      }
      // Priority filter
      if (filterOptions.priority !== 'All' && t.priority !== filterOptions.priority) {
        return false;
      }
      // Status filter
      if (filterOptions.status !== 'All' && t.status !== filterOptions.status) {
        return false;
      }
      // My Tasks toggle (in standard board view)
      if (!isMyTasksView && filterOptions.myTasksOnly && user && t.assigneeId !== user.id) {
        return false;
      }
      return true;
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    let targetColumn: TaskStatus | null = null;

    if (KANBAN_COLUMNS.includes(overId as TaskStatus)) {
      targetColumn = overId as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask && overTask.status) {
        targetColumn = overTask.status;
      }
    }

    if (targetColumn) {
      updateTaskStatus(taskId, targetColumn);
    }
  };

  const isAllSelected =
    filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.includes(t.id));

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      clearTaskSelection();
    } else {
      selectAllTasks(filteredTasks.map((t) => t.id));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 select-none">
      {/* Kanban Header Toolbar: Group By & Select All */}
      <div className="px-5 py-2.5 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Select All Checkbox */}
          <button
            onClick={handleSelectAllToggle}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition cursor-pointer"
            title="Select all tasks visible on board"
          >
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => {}}
              className="w-3.5 h-3.5 rounded-none text-emerald-600 border-slate-300 focus:ring-0 cursor-pointer"
            />
            <span>Select All ({filteredTasks.length})</span>
          </button>

          <span className="text-slate-300">|</span>

          {/* Task count badge */}
          <span className="text-[11px] font-bold text-slate-500 font-serif">
            Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
          </span>
        </div>

        {/* Group By Swimlanes Controls (Admin & PM only) */}
        {!isEmployee && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" /> Group By:
            </span>
            <div className="inline-flex rounded-none p-0.5 bg-slate-100 border border-slate-200">
              <button
                onClick={() => setGroupBy('status')}
                className={`px-3 py-1 text-xs font-bold transition rounded-none ${
                  groupBy === 'status'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Status
              </button>
              <button
                onClick={() => setGroupBy('assignee')}
                className={`px-3 py-1 text-xs font-bold transition rounded-none flex items-center gap-1 ${
                  groupBy === 'assignee'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-3 h-3" /> Assignee
              </button>
              <button
                onClick={() => setGroupBy('project')}
                className={`px-3 py-1 text-xs font-bold transition rounded-none flex items-center gap-1 ${
                  groupBy === 'project'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Folder className="w-3 h-3" /> Project
              </button>
              <button
                onClick={() => setGroupBy('priority')}
                className={`px-3 py-1 text-xs font-bold transition rounded-none flex items-center gap-1 ${
                  groupBy === 'priority'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <AlertCircle className="w-3 h-3" /> Priority
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Board Columns Container */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-5 min-h-0">
          {/* Case 1: Standard Status Grouping (Default & Employee Mode) */}
          {(isEmployee || groupBy === 'status') && (
            <div className="grid grid-cols-4 gap-4 h-full">
              {KANBAN_COLUMNS.map((columnStatus) => {
                const columnTasks = filteredTasks.filter((t) => t.status === columnStatus);
                return (
                  <Column
                    key={columnStatus}
                    status={columnStatus}
                    tasks={columnTasks}
                    onAddTask={openTaskModalWithStatus}
                  />
                );
              })}
            </div>
          )}

          {/* Case 2: Group By Assignee */}
          {!isEmployee && groupBy === 'assignee' && (
            <div className="flex gap-4 h-full overflow-x-auto pb-2">
              {assignableMembers.map((member) => {
                const memberTasks = filteredTasks.filter(
                  (t) =>
                    t.assigneeId === member.id ||
                    (t.assigneeEmail && t.assigneeEmail.toLowerCase() === member.email.toLowerCase())
                );
                return (
                  <div
                    key={member.id}
                    className="w-80 min-w-[320px] bg-slate-50/80 border border-slate-200 rounded-none flex flex-col h-full"
                  >
                    <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                        </div>
                        <span className="font-bold text-xs text-slate-900 font-serif truncate max-w-[170px]">
                          {member.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">
                        {memberTasks.length} tasks
                      </span>
                    </div>

                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                      {memberTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {memberTasks.length === 0 && (
                        <div className="text-center py-8 text-xs text-slate-400 font-medium italic">
                          No tasks assigned
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Case 3: Group By Project */}
          {!isEmployee && groupBy === 'project' && (
            <div className="flex gap-4 h-full overflow-x-auto pb-2">
              {projects.map((project) => {
                const projTasks = filteredTasks.filter((t) => t.projectId === project.id);
                return (
                  <div
                    key={project.id}
                    className="w-80 min-w-[320px] bg-slate-50/80 border border-slate-200 rounded-none flex flex-col h-full"
                  >
                    <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-none shrink-0" style={{ backgroundColor: project.color }} />
                        <span className="font-bold text-xs text-slate-900 font-serif truncate max-w-[170px]">
                          {project.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">
                        {projTasks.length} tasks
                      </span>
                    </div>

                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                      {projTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {projTasks.length === 0 && (
                        <div className="text-center py-8 text-xs text-slate-400 font-medium italic">
                          No tasks in this project
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Case 4: Group By Priority */}
          {!isEmployee && groupBy === 'priority' && (
            <div className="grid grid-cols-4 gap-4 h-full">
              {(['Urgent', 'High', 'Medium', 'Low'] as Priority[]).map((prio) => {
                const prioTasks = filteredTasks.filter((t) => t.priority === prio);
                const colorMap = {
                  Urgent: 'border-t-rose-500',
                  High: 'border-t-rose-400',
                  Medium: 'border-t-amber-500',
                  Low: 'border-t-emerald-500',
                };
                return (
                  <div
                    key={prio}
                    className={`bg-slate-50/80 border border-slate-200 border-t-4 ${colorMap[prio]} rounded-none flex flex-col h-full`}
                  >
                    <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 font-serif">
                        {prio} Priority
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">
                        {prioTasks.length} tasks
                      </span>
                    </div>

                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                      {prioTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {prioTasks.length === 0 && (
                        <div className="text-center py-8 text-xs text-slate-400 font-medium italic">
                          No tasks with {prio} priority
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
