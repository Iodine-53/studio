
"use client";

import { useState } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { format } from 'date-fns';
import { AlertCircle, Briefcase, Calendar as CalendarIcon, CheckCircle, FolderKanban, HelpCircle, User, Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// Helper data and icon mappings
const priorities = ['low', 'medium', 'high'];
const categories = ['personal', 'work', 'project'];

const priorityConfig = {
  low: { label: 'Low', icon: <HelpCircle className="h-4 w-4" /> },
  medium: { label: 'Medium', icon: <AlertCircle className="h-4 w-4" /> },
  high: { label: 'High', icon: <CheckCircle className="h-4 w-4" /> },
};

const categoryConfig = {
  personal: { label: 'Personal', icon: <User className="h-4 w-4" /> },
  work: { label: 'Work', icon: <Briefcase className="h-4 w-4" /> },
  project: { label: 'Project', icon: <FolderKanban className="h-4 w-4" /> },
};

export const AdvancedTaskNodeView = ({ node, updateAttributes, editor }: NodeViewProps) => {
  const { dueDate, category, priority, isCompleted } = node.attrs;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Function to handle metadata updates and close the dialog
  const handleUpdate = (attrs: { [key: string]: any }) => {
    updateAttributes(attrs);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <NodeViewWrapper
            className={cn(
            'flex items-start gap-2 group -mx-2 px-2 py-1 rounded-md',
             editor.isEditable && 'hover:bg-muted'
            )}
        >
            <div className="flex-shrink-0 pt-1">
                <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => updateAttributes({ isCompleted: !!checked })}
                />
            </div>

            <div className="flex-grow min-w-0">
                 <NodeViewContent
                    className={cn(
                        'min-w-0', 
                        isCompleted ? 'text-muted-foreground line-through' : ''
                    )}
                />
                 <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {dueDate && (
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{format(new Date(dueDate), 'MMM d')}</span>
                        </div>
                    )}
                    {category && (
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                            {categoryConfig[category as keyof typeof categoryConfig].icon}
                            <span className="capitalize">{categoryConfig[category as keyof typeof categoryConfig].label}</span>
                        </div>
                    )}
                     {priority && (
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                            {priorityConfig[priority as keyof typeof priorityConfig].icon}
                            <span className="capitalize">{priorityConfig[priority as keyof typeof priorityConfig].label}</span>
                        </div>
                    )}
                 </div>
            </div>
            
            {editor.isEditable && (
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100">
                        <Settings2 className="h-4 w-4" />
                        <span className="sr-only">Edit Task Details</span>
                    </Button>
                </DialogTrigger>
            )}
        </NodeViewWrapper>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
            {/* Priority Selector */}
            <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex gap-2">
                    {priorities.map(p => (
                        <Button key={p} variant={priority === p ? 'default' : 'outline'} size="sm" onClick={() => updateAttributes({ priority: p })}>
                            {priorityConfig[p as keyof typeof priorityConfig].icon}
                            <span className="capitalize ml-1">{priorityConfig[p as keyof typeof priorityConfig].label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Category Selector */}
             <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex gap-2">
                     {categories.map(c => (
                         <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => updateAttributes({ category: c })}>
                            {categoryConfig[c as keyof typeof categoryConfig].icon}
                            <span className="capitalize ml-1">{categoryConfig[c as keyof typeof categoryConfig].label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Calendar */}
            <div className="space-y-2">
                 <Label>Due Date</Label>
                 <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate) : undefined}
                    onSelect={(date) => handleUpdate({ dueDate: date?.toISOString() })}
                    className="rounded-md border self-center"
                 />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
