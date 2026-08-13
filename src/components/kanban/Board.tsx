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
import { Task, TaskStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

interface BoardProps {
  openTaskModalWithStatus: (status: TaskStatus) => void;
  isMyTasksView?: boolean;
}

export const Board: React.FC<BoardProps> = ({ openTaskModalWithStatus, isMyTasksView = false }) => {
  const { tasks, updateTaskStatus, selectedProjectId, filterOptions } = useData();
  const { user } = useAuth();

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag activates
      },
    })
  );

  // Apply project and filter criteria
  const filteredTasks = tasks.filter((t) => {
    // Strictly filter to user's tasks if in My Tasks View
    if (isMyTasksView && user && t.assigneeId !== user.id) {
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
    if (!isMyTasksView && filterOptions.assigneeId !== 'ALL' && t.assigneeId !== filterOptions.assigneeId) {
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
  });

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
    const targetColumn = over.id as TaskStatus;

    // Check if dropped onto a column header or area with status ID
    if (KANBAN_COLUMNS.includes(targetColumn)) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== targetColumn) {
        updateTaskStatus(taskId, targetColumn);
      }
    } else {
      // Dropped onto another task card, find that task's column
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask && overTask.status) {
        const task = tasks.find((t) => t.id === taskId);
        if (task && task.status !== overTask.status) {
          updateTaskStatus(taskId, overTask.status);
        }
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4 px-5 py-4 h-full min-h-0">
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

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
