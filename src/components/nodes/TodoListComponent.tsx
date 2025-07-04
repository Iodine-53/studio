
"use client";

import React, { useState, useEffect } from 'react'
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

const TodoListComponent = ({ node, updateAttributes, editor }: NodeViewProps) => {
  const [tasks, setTasks] = useState<Task[]>(node.attrs.tasks || [])
  const [inputValue, setInputValue] = useState('')
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    updateAttributes({ tasks })
  }, [tasks, updateAttributes])

  const addTask = () => {
    if (inputValue.trim() !== '') {
      const newTasks: Task[] = [...tasks, { 
        id: Date.now(), 
        text: inputValue.trim(), 
        completed: false 
      }]
      setTasks(newTasks)
      setInputValue('')
    }
  }

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask()
    }
  };

  const handleWrapperClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      editor.setEditable(false);
    }
  };

  const handleDoneClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent re-triggering the wrapper click
    setIsEditing(false);
    editor.setEditable(true);
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <NodeViewWrapper 
        className="p-4 cursor-pointer"
        onClick={handleWrapperClick}
    >
      <Card className={cn(
          "max-w-lg mx-auto relative group transition-shadow",
          isEditing && "ring-2 ring-primary shadow-lg"
        )}>
        <CardHeader>
           {isEditing ? (
            <Input
              value={node.attrs.title}
              onChange={(e) => updateAttributes({ title: e.target.value })}
              className="text-2xl font-semibold leading-none tracking-tight font-headline border-0 shadow-none focus-visible:ring-0 p-0"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <CardTitle className="font-headline">{node.attrs.title}</CardTitle>
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
              <Button variant="secondary" onClick={handleDoneClick}><Check size={16}/> Done</Button>
            </div>
          )}
          
          {totalCount > 0 && (
            <div className="text-xs text-muted-foreground mb-3">
              {completedCount} of {totalCount} tasks completed
            </div>
          )}

          <div className={cn("space-y-2", !isEditing && "pointer-events-none")}>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  {isEditing ? "No tasks yet. Add one above!" : "Click to add tasks"}
                </p>
              ) : (
                tasks.map(task => (
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
                          : 'border-muted-foreground hover:border-primary'
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
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                      className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      aria-label="Delete task"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))
              )
            }
          </div>
          {!isEditing && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
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
