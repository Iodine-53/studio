
"use client";

import React, { useState, useCallback } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Plus, Trash2, Palette, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GenerateProgressBarDataDialog } from '../GenerateProgressBarDataDialog';
import { useToast } from '@/hooks/use-toast';

// Predefined colors for the color picker
const PREDEFINED_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
];

export const ProgressBarNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const { blockTitle, progressBars, textAlign, layout } = node.attrs;
  const isEditing = selected;
  const width = layout?.width || 100;
  
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const { toast } = useToast();

  // Handler to update the entire block's attributes
  const updateAllAttributes = (newAttrs: { blockTitle?: string; progressBars?: any[] }) => {
    updateAttributes(newAttrs);
  };
  
  // Handlers for individual progress bar actions
  const addProgressBar = useCallback(() => {
    const newId = (progressBars.length > 0 ? Math.max(...progressBars.map((p: any) => p.id)) : 0) + 1;
    updateAllAttributes({ 
      progressBars: [...progressBars, {
        id: newId,
        title: `Progress ${newId}`,
        progress: 0,
        color: PREDEFINED_COLORS[newId % PREDEFINED_COLORS.length]
      }]
    });
  }, [progressBars, updateAllAttributes]);

  const removeProgressBar = useCallback((id: number) => {
    if (progressBars.length > 1) {
      updateAllAttributes({ progressBars: progressBars.filter((p: any) => p.id !== id) });
    } else {
        toast({ title: "Cannot Remove", description: "The block must have at least one progress bar." });
    }
  }, [progressBars, updateAllAttributes, toast]);

  const updateBarAttribute = useCallback((id: number, attr: string, value: any) => {
    const newProgressBars = progressBars.map((p: any) => p.id === id ? { ...p, [attr]: value } : p);
    updateAllAttributes({ progressBars: newProgressBars });
  }, [progressBars, updateAllAttributes]);

  const handleAiGenerate = (generatedData: { blockTitle: string; progressBars: any[] }) => {
    if (!generatedData || !generatedData.progressBars || generatedData.progressBars.length === 0) {
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: 'The AI did not return any data. Please try a different prompt.',
      });
      return;
    }
    updateAllAttributes({
      blockTitle: generatedData.blockTitle,
      progressBars: generatedData.progressBars,
    });
    toast({
      title: 'AI Data Generated',
      description: 'The progress bars have been populated.',
    });
  };

  return (
    <>
      <NodeViewWrapper
        className="my-4 custom-node-wrapper"
        data-align={textAlign}
        style={{ width: `${width}%` }}
      >
        <Card className={cn('overflow-hidden w-full', isEditing && 'ring-2 ring-primary ring-offset-2')}>
          <CardHeader>
            {isEditing ? (
              <Input
                value={blockTitle}
                onChange={(e) => updateAllAttributes({ blockTitle: e.target.value })}
                className="text-2xl font-bold font-headline border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                placeholder="Progress Title"
              />
            ) : (
              <CardTitle className="font-headline">{blockTitle}</CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {progressBars.map((bar: any) => (
              <div key={bar.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {isEditing ? (
                    <Input 
                      value={bar.title}
                      onChange={e => updateBarAttribute(bar.id, 'title', e.target.value)}
                      className="h-8 flex-grow"
                      placeholder="Progress Label"
                    />
                  ) : (
                    <p className="font-semibold text-foreground">{bar.title}</p>
                  )}
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-mono text-muted-foreground w-12 text-right">{bar.progress}%</span>
                    {isEditing && (
                      <>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Palette size={16} style={{ color: bar.color }} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                            <div className="grid grid-cols-5 gap-1">
                              {PREDEFINED_COLORS.map(color => (
                                <Button
                                  key={color}
                                  variant="outline"
                                  size="icon"
                                  className={cn("h-8 w-8", bar.color === color && 'ring-2 ring-primary')}
                                  style={{ backgroundColor: color }}
                                  onClick={() => updateBarAttribute(bar.id, 'color', color)}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive/70 hover:text-destructive"
                          onClick={() => removeProgressBar(bar.id)}
                          disabled={progressBars.length <= 1}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {/* RENDER LOGIC: Use a slider for editing, a simple div for viewing */}
                {isEditing ? (
                   <Slider
                    value={[bar.progress]}
                    onValueChange={(value) => updateBarAttribute(bar.id, 'progress', value[0])}
                    max={100}
                    step={1}
                  />
                ) : (
                   <div className="w-full bg-secondary rounded-full h-6">
                      <div
                        className="h-6 rounded-full"
                        style={{ width: `${bar.progress}%`, backgroundColor: bar.color }}
                      ></div>
                   </div>
                )}
              </div>
            ))}
            {isEditing && (
                <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" className="flex-1" onClick={addProgressBar}>
                        <Plus size={16} className="mr-2"/>
                        Add Bar
                    </Button>
                     <Button variant="outline" className="flex-1" onClick={() => setIsAiDialogOpen(true)}>
                        <Wand2 size={16} className="mr-2"/>
                        AI Generate
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </NodeViewWrapper>
      <GenerateProgressBarDataDialog
        open={isAiDialogOpen}
        onOpenChange={setIsAiDialogOpen}
        onGenerate={handleAiGenerate}
      />
    </>
  );
};
