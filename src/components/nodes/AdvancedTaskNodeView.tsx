"use client";

import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { format } from 'date-fns';
import { AlertCircle, Briefcase, Calendar as CalendarIcon, CheckCircle, FolderKanban, HelpCircle, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Helper data and icon mappings
const priorities = ['low', 'medium', 'high'];
const categories = ['personal', 'work', 'project'];

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


export const AdvancedTaskNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const { dueDate, category, priority, isCompleted } = node.attrs;

  // --- THIS IS THE KEY FIX ---
  // State to control the visibility of the calendar popover
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const cycleAttribute = (values: string[], current: string, attributeName: string) => {
    const currentIndex = values.indexOf(current);
    const nextIndex = (currentIndex + 1) % values.length;
    updateAttributes({ [attributeName]: values[nextIndex] });
  };

  return (
    <NodeViewWrapper
      className={cn(
        'grid my-2 rounded-lg border p-2 gap-x-2 gap-y-1',
        // The robust grid layout is maintained
        'grid-cols-[auto,1fr] grid-rows-auto',
        'md:grid-cols-[auto,1fr,auto] md:grid-rows-1 md:items-center',
        isCompleted ? 'bg-muted/50' : 'bg-card'
      )}
    >
      {/* --- Checkbox Area (Row 1, Col 1) --- */}
      <div className="flex items-center">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => updateAttributes({ isCompleted: !!checked })}
        />
      </div>

      {/* --- Title Area (Row 1, Col 2) --- */}
      <NodeViewContent
        className={cn(
          'min-w-0', // Prevents content from overflowing its grid cell
          isCompleted ? 'text-muted-foreground line-through' : ''
        )}
      />

      {/* --- Metadata Area (Row 2, Col 2 on mobile; Row 1, Col 3 on desktop) --- */}
      <div className="flex items-center gap-1 justify-self-end col-start-2 md:col-start-3">
        <Button variant="ghost" size="sm" onClick={() => cycleAttribute(priorities, priority, 'priority')} className={cn("flex items-center gap-1 rounded-full px-2 py-1 h-auto text-xs", priorityConfig[priority].color)}>
            {priorityConfig[priority].icon}
            <span className="hidden sm:inline">{priorityConfig[priority].label}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => cycleAttribute(categories, category, 'category')} className="flex items-center gap-1 rounded-full px-2 py-1 h-auto text-xs">
            {categoryConfig[category].icon}
            <span className="hidden sm:inline">{categoryConfig[category].label}</span>
        </Button>
        
        {/* --- MODIFIED POPOVER --- */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 rounded-full px-2 py-1 h-auto text-xs">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{dueDate ? format(new Date(dueDate), 'MMM d') : 'No date'}</span>
            </Button>
          </PopoverTrigger>

          {/* --- RENDER CONTENT CONDITIONALLY --- */}
          {isCalendarOpen && (
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dueDate ? new Date(dueDate) : undefined}
                onSelect={(date) => {
                  updateAttributes({ dueDate: date?.toISOString() });
                  setIsCalendarOpen(false); // Close calendar on select
                }}
                initialFocus
              />
            </PopoverContent>
          )}
        </Popover>
      </div>
    </NodeViewWrapper>
  );
};
