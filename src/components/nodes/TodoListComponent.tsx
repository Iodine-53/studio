
"use client";

import React, { useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Plus, X, Check, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Task = {
  id: number;
  text: string;
  completed: boolean;
};

const TodoListComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { tasks, title, layout } = node.attrs;
  const { align, width } = layout || { align: 'center', width: 75 };
  const [inputValue, setInputValue] = useState('');

  const isEditing = selected;

  const addTask = () => {
    if (inputValue.trim() !== '') {
      const newTasks: Task[] = [...(tasks || []), { 
        id: Date.now(), 
        text: inputValue.trim(), 
        completed: false 
      }]
      updateAttributes({ tasks: newTasks });
      setInputValue('');
    }
  }

  const deleteTask = (id: number) => {
    updateAttributes({ tasks: tasks.filter((task: Task) => task.id !== id) });
  }

  const toggleTask = (id: number) => {
    updateAttributes({
      tasks: tasks.map((task: Task) => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    });
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask()
    }
  };

  const completedCount = tasks.filter((task: Task) => task.completed).length;
  const totalCount = tasks.length;

  return (
    <NodeViewWrapper 
        className="layout-wrapper"
        data-align={align}
    >
      <Card 
        className={cn(
          "my-4 relative group transition-shadow w-full",
          isEditing && "ring-2 ring-primary shadow-lg"
        )}
        style={{ maxWidth: typeof width === 'number' ? `${width}%` : '100%' }}
      >
        <CardHeader>
           {isEditing ? (
            <Input
              value={title}
              onChange={(e) => updateAttributes({ title: e.target.value })}
              className="text-2xl font-semibold leading-none tracking-tight font-headline border-0 shadow-none focus-visible:ring-0 p-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <CardTitle className="font-headline">{title}</CardTitle>
          )}
        </CardHeader>
        <CardContent>
          {isEditing && (
            <div className="flex gap-2 mb-4">
              <Input 
                type="text" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                onKeyPress={handleKeyPress} 
                placeholder="Add a new task..."
                onClick={(e) => e.stopPropagation()} // Prevent wrapper click from propagating
              />
              <Button onClick={(e) => { e.stopPropagation(); addTask(); }}><Plus size={16} /> Add</Button>
            </div>
          )}
          
          {totalCount > 0 && (
            <div className="text-xs text-muted-foreground mb-3">
              {completedCount} of {totalCount} tasks completed
            </div>
          )}

          <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  {isEditing ? "No tasks yet. Add one above!" : "Select to add tasks"}
                </p>
              ) : (
                tasks.map((task: Task) => (
                  <div 
                    key={task.id} 
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-md border transition-colors',
                      task.completed ? 'bg-muted/50' : 'bg-card'
                    )}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                      className={cn(
                        'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        task.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-muted-foreground hover:border-primary',
                        !isEditing && 'pointer-events-none'
                      )}
                      aria-label={task.completed ? 'Mark as not completed' : 'Mark as completed'}
                    >
                      {task.completed && <Check size={12} />}
                    </button>
                    <span className={cn(
                      "flex-1 text-sm",
                      task.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}>
                      {task.text}
                    </span>
                    {isEditing && (
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                          className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete task"
                        >
                          <X size={14} />
                        </Button>
                    )}
                  </div>
                ))
              )
            }
          </div>
          {!isEditing && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                <div className="flex items-center gap-2 bg-background/80 px-4 py-2 rounded-full border">
                     <Edit className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground">Click to edit tasks</span>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </NodeViewWrapper>
  )
}

export default TodoListComponent;
