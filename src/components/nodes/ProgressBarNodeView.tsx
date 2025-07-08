
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
  const { title, items, textAlign, layout } = node.attrs;
  const isEditing = selected;
  const width = layout?.width || 100;
  
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const { toast } = useToast();

  const updateAllAttributes = (newAttrs: { title?: string; items?: any[] }) => {
    updateAttributes(newAttrs);
  };
  
  const addBar = useCallback(() => {
    const newId = (items.length > 0 ? Math.max(...items.map((p: any) => p.id)) : 0) + 1;
    updateAllAttributes({ 
      items: [...items, {
        id: newId,
        label: `New Item`,
        value: 0,
        color: PREDEFINED_COLORS[newId % PREDEFINED_COLORS.length]
      }]
    });
  }, [items, updateAllAttributes]);

  const removeBar = useCallback((id: number) => {
    if (items.length > 1) {
      updateAllAttributes({ items: items.filter((p: any) => p.id !== id) });
    } else {
        toast({ title: "Cannot Remove", description: "The block must have at least one item." });
    }
  }, [items, updateAllAttributes, toast]);

  const updateItemAttribute = useCallback((id: number, attr: string, value: any) => {
    const newItems = items.map((p: any) => p.id === id ? { ...p, [attr]: value } : p);
    updateAllAttributes({ items: newItems });
  }, [items, updateAllAttributes]);

  const handleAiGenerate = (generatedData: { title: string; items: any[] }) => {
    if (!generatedData || !generatedData.items || generatedData.items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: 'The AI did not return any data. Please try a different prompt.',
      });
      return;
    }
    updateAllAttributes(generatedData);
    toast({
      title: 'AI Data Generated',
      description: 'The component has been populated with new data.',
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
                value={title}
                onChange={(e) => updateAllAttributes({ title: e.target.value })}
                className="text-2xl font-bold font-headline border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                placeholder="Block Title"
              />
            ) : (
              <CardTitle className="font-headline">{title}</CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item: any) => (
              <div key={item.id}>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                       <Input 
                          value={item.label}
                          onChange={e => updateItemAttribute(item.id, 'label', e.target.value)}
                          className="h-8 flex-grow"
                          placeholder="Label"
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-sm font-mono text-muted-foreground w-12 text-right">{item.value}%</span>
                           <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Palette size={16} style={{ color: item.color }} />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                              <div className="grid grid-cols-5 gap-1">
                                {PREDEFINED_COLORS.map(color => (
                                  <Button
                                    key={color}
                                    variant="outline"
                                    size="icon"
                                    className={cn("h-8 w-8", item.color === color && 'ring-2 ring-primary')}
                                    style={{ backgroundColor: color }}
                                    onClick={() => updateItemAttribute(item.id, 'color', color)}
                                  />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/70 hover:text-destructive"
                            onClick={() => removeBar(item.id)}
                            disabled={items.length <= 1}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                    </div>
                     <Slider
                        value={[item.value]}
                        onValueChange={(value) => updateItemAttribute(item.id, 'value', value[0])}
                        max={100}
                        step={1}
                      />
                  </div>
                ) : (
                   <div className="grid grid-cols-12 items-center gap-x-4 gap-y-1">
                      <p className="font-semibold text-foreground text-right truncate col-span-4">{item.label}</p>
                      <div className="w-full bg-secondary rounded-full h-6 relative col-span-8">
                          <div
                              className="h-6 rounded-full flex items-center justify-end px-2 transition-all duration-300"
                              style={{ width: `${item.value}%`, backgroundColor: item.color }}
                          >
                              {item.value > 10 && <span className="font-mono text-white text-xs font-semibold">{item.value}%</span>}
                          </div>
                          {item.value <= 10 && <span className="absolute left-full ml-2 font-mono text-muted-foreground text-xs">{item.value}%</span>}
                      </div>
                  </div>
                )}
              </div>
            ))}
            {isEditing && (
                <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" className="flex-1" onClick={addBar}>
                        <Plus size={16} className="mr-2"/>
                        Add Item
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
