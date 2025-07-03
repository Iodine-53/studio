
'use client';

import React from 'react';
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Tag, Flag } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['personal', 'work', 'project'];

const PRIORITY_STYLES: { [key: string]: string } = {
  low: 'border-green-300 bg-green-100 text-green-800 hover:bg-green-200 dark:border-green-800 dark:bg-green-900/50 dark:text-green-200 hover:dark:bg-green-900',
  medium: 'border-yellow-300 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:border-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 hover:dark:bg-yellow-900',
  high: 'border-red-300 bg-red-100 text-red-800 hover:bg-red-200 dark:border-red-800 dark:bg-red-900/50 dark:text-red-200 hover:dark:bg-red-900',
};

export function AdvancedTaskNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const { dueDate, category, priority, isCompleted } = node.attrs;

  const togglePriority = () => {
    const currentIndex = PRIORITIES.indexOf(priority);
    const nextIndex = (currentIndex + 1) % PRIORITIES.length;
    updateAttributes({ priority: PRIORITIES[nextIndex] });
  };

  const toggleCategory = () => {
    const currentIndex = CATEGORIES.indexOf(category);
    const nextIndex = (currentIndex + 1) % CATEGORIES.length;
    updateAttributes({ category: CATEGORIES[nextIndex] });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      updateAttributes({ dueDate: date.toISOString() });
    }
  };

  return (
    <NodeViewWrapper className="flex items-start gap-2 p-2 my-2 rounded-lg bg-card border border-input group">
      <div className="flex-shrink-0 pt-1">
        <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => updateAttributes({ isCompleted: !!checked })}
            className="shrink-0"
            aria-label="Toggle task completion"
        />
      </div>

      <NodeViewContent className={cn('flex-grow py-1', isCompleted && 'line-through text-muted-foreground')} />

      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant="outline"
          className={cn('cursor-pointer capitalize select-none font-medium', PRIORITY_STYLES[priority])}
          onClick={togglePriority}
        >
          <Flag className="mr-1 h-3 w-3" />
          {priority}
        </Badge>

        <Badge
          variant="outline"
          className="cursor-pointer capitalize select-none font-medium"
          onClick={toggleCategory}
        >
          <Tag className="mr-1 h-3 w-3" />
          {category}
        </Badge>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              size="sm"
              className={cn(
                'w-[150px] justify-start text-left font-normal',
                !dueDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(new Date(dueDate), 'PPP') : <span>Set date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate ? new Date(dueDate) : undefined}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </NodeViewWrapper>
  );
}
