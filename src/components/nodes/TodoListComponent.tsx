
"use client";

import React, { useState, useEffect } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Plus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Task = {
  id: number;
  text: string;
  completed: boolean;
};

const TodoListComponent = ({ node, updateAttributes }: NodeViewProps) => {
  const [tasks, setTasks] = useState<Task[]>(node.attrs.tasks || [])
  const [inputValue, setInputValue] = useState('')

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

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <NodeViewWrapper className="p-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="font-headline">My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyPress={handleKeyPress} 
              placeholder="Add a new task..." 
            />
            <Button onClick={addTask}><Plus size={16} /> Add</Button>
          </div>
          
          {totalCount > 0 && (
            <div className="text-xs text-muted-foreground mb-3">
              {completedCount} of {totalCount} tasks completed
            </div>
          )}

          <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  No tasks yet. Add one above!
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
                      onClick={() => toggleTask(task.id)} 
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
                      onClick={() => deleteTask(task.id)} 
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
        </CardContent>
      </Card>
    </NodeViewWrapper>
  )
}

export default TodoListComponent;
