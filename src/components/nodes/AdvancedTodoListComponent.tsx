
"use client";

import React, { useState, useMemo, useCallback, useEffect, CSSProperties } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { getTasksByBlockId, addTask, updateTask, deleteTask, type Task } from '@/lib/db';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Custom hook to get live updates for tasks
const useLiveTasks = (blockId: string) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshTasks = useCallback(async () => {
        if (blockId) {
            setLoading(true);
            const fetchedTasks = await getTasksByBlockId(blockId);
            setTasks(fetchedTasks);
            setLoading(false);
        }
    }, [blockId]);

    useEffect(() => {
        refreshTasks();
        const handleTaskUpdate = () => refreshTasks();
        window.addEventListener(`tasks-updated-${blockId}`, handleTaskUpdate);
        return () => window.removeEventListener(`tasks-updated-${blockId}`, handleTaskUpdate);
    }, [blockId, refreshTasks]);

    return { tasks, loading, refreshTasks };
};

// Helper to dispatch an event to trigger updates
const dispatchTaskUpdateEvent = (blockId: string) => {
    window.dispatchEvent(new CustomEvent(`tasks-updated-${blockId}`));
};

const TaskItemView: React.FC<{ task: Task; allTasks: Task[]; level: number; }> = ({ task, allTasks, level }) => {
    const children = useMemo(() => allTasks.filter(t => t.parentId === String(task.id)), [allTasks, task.id]);
    
    return (
        <div style={{ marginLeft: `${level * 1.5}rem` }}>
            <div className="flex items-center gap-2 py-1">
                <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    className="flex-shrink-0"
                />
                <label htmlFor={`task-${task.id}`} className={cn("flex-1", task.completed ? 'line-through text-muted-foreground' : '')}>{task.text}</label>
            </div>
            {children.length > 0 && (
                <div className="mt-1">
                    {children.map(child => <TaskItemView key={child.id} task={child} allTasks={allTasks} level={level + 1} />)}
                </div>
            )}
        </div>
    );
};


const TaskItemEdit: React.FC<{
    task: Task;
    tasks: Task[];
    onUpdate: (id: number, updates: Partial<Task>) => void;
    onDelete: (id: number) => void;
    onAddSubtask: (parentId: string, text: string) => void;
    level?: number;
}> = ({ task, tasks, onUpdate, onDelete, onAddSubtask, level = 0 }) => {
    const [newSubtask, setNewSubtask] = useState('');
    const children = useMemo(() => tasks.filter(t => t.parentId === String(task.id)), [tasks, task.id]);

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (newSubtask.trim()) {
            onAddSubtask(String(task.id), newSubtask.trim());
            setNewSubtask('');
        }
    };

    return (
        <div style={{ marginLeft: `${level * 1.5}rem` }}>
            <div className="flex items-center gap-2 group py-1">
                <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={(checked) => onUpdate(task.id!, { completed: !!checked })}
                    className="flex-shrink-0"
                />
                <label htmlFor={`task-${task.id}`} className={cn("flex-1", task.completed ? 'line-through text-muted-foreground' : '')}>{task.text}</label>
                <Button variant="ghost" size="icon" onClick={() => onDelete(task.id!)} className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive">
                    <Trash2 size={14} />
                </Button>
            </div>
            <div className="mt-1 space-y-2">
                {children.map(child => <TaskItemEdit key={child.id} task={child} tasks={tasks} onUpdate={onUpdate} onDelete={onDelete} onAddSubtask={onAddSubtask} level={level + 1} />)}
            </div>
            <form onSubmit={handleAddSubtask} className="mt-1 flex gap-1 items-center" style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}>
                <Input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add sub-task..."
                    className="text-xs h-7 flex-1 bg-transparent px-1 border-b focus-visible:ring-0 focus:border-primary"
                    onClick={e => e.stopPropagation()}
                />
                 <Button type="submit" size="icon" variant="ghost" className="h-7 w-7"><Plus size={14} /></Button>
            </form>
        </div>
    );
};


const AdvancedTodoListComponent: React.FC<NodeViewProps> = ({ node, selected }) => {
    const { blockId, textAlign, layout, fontSize, color, backgroundColor } = node.attrs;
    const { tasks, loading } = useLiveTasks(blockId);
    const [newTask, setNewTask] = useState('');
    const isEditing = selected;
    const width = layout?.width || 100;
    
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.trim()) {
            await addTask({ blockId, parentId: null, text: newTask.trim(), completed: false });
            dispatchTaskUpdateEvent(blockId);
            setNewTask('');
        }
    };
    
    const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
        await updateTask(taskId, updates);
        dispatchTaskUpdateEvent(blockId);
    };

    const handleDeleteTask = async (taskId: number) => {
        await deleteTask(taskId);
        dispatchTaskUpdateEvent(blockId);
    };

    const handleAddSubtask = async (parentId: string, text: string) => {
        await addTask({ blockId, parentId, text, completed: false });
        dispatchTaskUpdateEvent(blockId);
    };
    
    const topLevelTasks = useMemo(() => tasks.filter(task => task.parentId === null), [tasks]);
    
    const componentStyle: CSSProperties = {
        fontSize: fontSize || undefined,
        color: color || undefined,
        backgroundColor: backgroundColor || 'hsl(var(--card))',
    };

    return (
        <NodeViewWrapper
          className="my-4 custom-node-wrapper"
          data-align={textAlign}
          style={{ width: `${width}%` }}
        >
            <Card 
                className={cn(
                    "w-full transition-shadow",
                    isEditing ? 'ring-2 ring-primary ring-offset-2' : 'border-none shadow-none'
                )}
                style={componentStyle}
            >
                <CardHeader>
                    <CardTitle>To-Do List</CardTitle>
                </CardHeader>
                <CardContent>
                    {isEditing && (
                        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                            <Input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="Add a new top-level task..."
                            />
                            <Button type="submit"><Plus size={16} /> Add Task</Button>
                        </form>
                    )}
                    {loading ? (
                       <div className="space-y-2">
                           <Skeleton className="h-8 w-full" />
                           <Skeleton className="h-8 w-3/4" />
                       </div>
                    ) : (
                        <div className="space-y-3">
                            {topLevelTasks.map(task => 
                                isEditing ? (
                                    <TaskItemEdit
                                        key={task.id}
                                        task={task}
                                        tasks={tasks}
                                        onUpdate={handleUpdateTask}
                                        onDelete={handleDeleteTask}
                                        onAddSubtask={handleAddSubtask}
                                    />
                                ) : (
                                    <TaskItemView
                                        key={task.id}
                                        task={task}
                                        allTasks={tasks}
                                        level={0}
                                    />
                                )
                            )}
                            {topLevelTasks.length === 0 && !isEditing && (
                                <p className="text-sm text-muted-foreground text-center py-4">This list is empty. Select the block to add tasks.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </NodeViewWrapper>
    );
};

export default AdvancedTodoListComponent;
