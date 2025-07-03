"use client";

import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { type NodeViewProps } from '@tiptap/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, User, Briefcase, FolderKanban, AlertCircle, CheckCircle, HelpCircle, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AdvancedTaskNodeView = ({ node, updateAttributes, editor }: NodeViewProps) => {
  const { dueDate, category, priority, isCompleted } = node.attrs;

  const priorities = ['low', 'medium', 'high'];
  const categories = ['personal', 'work', 'project'];

  const cycleAttribute = (values: string[], current: string, attributeName: string) => {
    const currentIndex = values.indexOf(current);
    const nextIndex = (currentIndex + 1) % values.length;
    updateAttributes({ [attributeName]: values[nextIndex] });
  };
  
  const priorityConfig = {
    low: { label: 'Low', icon: <HelpCircle className="h-4 w-4" />, color: 'text-muted-foreground' },
    medium: { label: 'Medium', icon: <AlertCircle className="h-4 w-4" />, color: 'text-yellow-500' },
    high: { label: 'High', icon: <CheckCircle className="h-4 w-4" />, color: 'text-red-500' },
  };
  
  const categoryConfig = {
    personal: { label: 'Personal', icon: <User className="h-4 w-4" /> },
    work: { label: 'Work', icon: <Briefcase className="h-4 w-4" /> },
    project: { label: 'Project', icon: <FolderKanban className="h-4 w-4" /> },
  };

  return (
    <NodeViewWrapper
      className={cn(
        'my-2 rounded-lg border p-2',
        isCompleted ? 'bg-muted/50' : 'bg-card'
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        {/* Drag Handle */}
        <div 
          className="drag-handle cursor-grab text-muted-foreground self-start pt-1 md:self-center" 
          contentEditable="false" 
          draggable="true" 
          data-drag-handle
        >
          <GripVertical size={18} />
        </div>

        {/* === MAIN CONTENT AREA (Top on Mobile, Left on Desktop) === */}
        <div className="flex flex-grow items-center gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => updateAttributes({ isCompleted: !!checked })}
            className="mt-1 self-start"
          />
          <NodeViewContent className={cn('flex-grow', isCompleted ? 'text-muted-foreground line-through' : '')} />
        </div>

        {/* === METADATA AREA (Bottom on Mobile, Right on Desktop) === */}
        <div className="flex flex-shrink-0 items-center gap-2 self-end md:self-center">
          <Button variant="ghost" size="sm" onClick={() => cycleAttribute(priorities, priority, 'priority')} className={cn("flex items-center gap-1 rounded-full px-2 py-1 h-auto text-xs", priorityConfig[priority].color)}>
            {priorityConfig[priority].icon}
            <span>{priorityConfig[priority].label}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => cycleAttribute(categories, category, 'category')} className="flex items-center gap-1 rounded-full px-2 py-1 h-auto text-xs">
            {categoryConfig[category].icon}
            <span>{categoryConfig[category].label}</span>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 rounded-full px-2 py-1 h-auto text-xs">
                <CalendarIcon className="h-4 w-4" />
                <span>{dueDate ? format(new Date(dueDate), 'MMM d') : 'No date'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate ? new Date(dueDate) : undefined}
                onSelect={(date) => updateAttributes({ dueDate: date?.toISOString() })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
