
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { getTasksByBlockId, addTask, updateTask, deleteTask, type Task } from '@/lib/db';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
        // Set up a listener for custom events that signal a change in tasks
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

const TaskItem: React.FC<{
    task: Task;
    tasks: Task[];
    onUpdate: (id: number, updates: Partial<Task>) => void;
    onDelete: (id: number) => void;
    onAddSubtask: (parentId: string, text: string) => void;
}> = ({ task, tasks, onUpdate, onDelete, onAddSubtask }) => {
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
        <div className="ml-5 pl-4 border-l">
            <div className="flex items-center gap-2 group py-1">
                <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={(checked) => onUpdate(task.id!, { completed: !!checked })}
                />
                <label htmlFor={`task-${task.id}`} className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.text}</label>
                <Button variant="ghost" size="icon" onClick={() => onDelete(task.id!)} className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive">
                    <Trash2 size={14} />
                </Button>
            </div>
            <div className="mt-1 space-y-2">
                {children.map(child => <TaskItem key={child.id} task={child} tasks={tasks} onUpdate={onUpdate} onDelete={onDelete} onAddSubtask={onAddSubtask} />)}
            </div>
            <form onSubmit={handleAddSubtask} className="mt-1 flex gap-1">
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


const AdvancedTodoListComponent: React.FC<NodeViewProps> = ({ node }) => {
    const { blockId } = node.attrs;
    const { tasks, loading } = useLiveTasks(blockId);
    const [newTask, setNewTask] = useState('');

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

    return (
        <NodeViewWrapper>
            <Card className="my-4">
                <CardHeader>
                    <CardTitle>Advanced To-Do List</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                        <Input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Add a new top-level task..."
                        />
                        <Button type="submit"><Plus size={16} /> Add Task</Button>
                    </form>
                    {loading ? (
                       <div className="space-y-2">
                           <Skeleton className="h-8 w-full" />
                           <Skeleton className="h-8 w-3/4" />
                       </div>
                    ) : (
                        <div className="space-y-3">
                            {topLevelTasks.map(task => (
                                <div key={task.id} className="p-2 border rounded-md">
                                    <div className="flex items-center gap-2 group">
                                         <Checkbox
                                            id={`task-top-${task.id}`}
                                            checked={task.completed}
                                            onCheckedChange={(checked) => handleUpdateTask(task.id!, { completed: !!checked })}
                                        />
                                        <label htmlFor={`task-top-${task.id}`} className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.text}</label>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id!)} className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                        {tasks.filter(t => t.parentId === String(task.id)).map(child => (
                                            <TaskItem
                                                key={child.id}
                                                task={child}
                                                tasks={tasks}
                                                onUpdate={handleUpdateTask}
                                                onDelete={handleDeleteTask}
                                                onAddSubtask={handleAddSubtask}
                                            />
                                        ))}
                                    </div>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const subtaskText = (e.currentTarget.elements[0] as HTMLInputElement).value;
                                        if (subtaskText.trim()) {
                                            handleAddSubtask(String(task.id!), subtaskText.trim());
                                            (e.currentTarget.elements[0] as HTMLInputElement).value = '';
                                        }
                                    }} className="mt-2 flex gap-1 ml-5 pl-4 border-l">
                                        <Input type="text" placeholder="Add sub-task..." className="text-xs h-7 flex-1 bg-transparent px-1 border-b focus-visible:ring-0 focus:border-primary" />
                                        <Button type="submit" size="icon" variant="ghost" className="h-7 w-7"><Plus size={14} /></Button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </NodeViewWrapper>
    );
};

export default AdvancedTodoListComponent;
