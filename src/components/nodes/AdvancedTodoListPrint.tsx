
"use client";

import { useEffect, useState, useMemo, FC } from 'react';
import { getTasksByBlockId, type Task } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskItemViewProps = {
  task: Task;
  allTasks: Task[];
  level: number;
};

const TaskItemView: FC<TaskItemViewProps> = ({ task, allTasks, level }) => {
  const children = useMemo(() => allTasks.filter(t => t.parentId === String(task.id)), [allTasks, task.id]);

  return (
    <div style={{ marginLeft: `${level * 1.5}rem` }}>
      <div className="flex items-start gap-2 py-1">
        {task.completed ? (
            <CheckSquare className="h-5 w-5 mt-0.5 flex-shrink-0" />
        ) : (
            <Square className="h-5 w-5 mt-0.5 flex-shrink-0" />
        )}
        <span className={cn("flex-1", task.completed && 'line-through text-gray-500')}>
          {task.text}
        </span>
      </div>
      {children.length > 0 && (
        <div className="mt-1">
          {children.map(child => (
            <TaskItemView key={child.id} task={child} allTasks={allTasks} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};


type AdvancedTodoListPrintProps = {
  blockId: string;
};

export const AdvancedTodoListPrint: FC<AdvancedTodoListPrintProps> = ({ blockId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (blockId) {
        setLoading(true);
        const fetchedTasks = await getTasksByBlockId(blockId);
        setTasks(fetchedTasks);
        setLoading(false);
      }
    };
    fetchTasks();
  }, [blockId]);

  const topLevelTasks = useMemo(() => tasks.filter(task => task.parentId === null), [tasks]);

  if (loading) {
    return (
      <div className="my-4 p-4">
        <h4 className="font-bold text-lg mb-4">To-Do List</h4>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      <h4 className="font-bold text-lg mb-4">To-Do List</h4>
      <div className="space-y-3">
        {topLevelTasks.map(task => (
          <TaskItemView key={task.id} task={task} allTasks={tasks} level={0} />
        ))}
        {topLevelTasks.length === 0 && (
          <p className="text-sm text-gray-500 italic">This list is empty.</p>
        )}
      </div>
    </div>
  );
};
