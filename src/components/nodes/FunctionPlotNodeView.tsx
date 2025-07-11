
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import functionPlot from 'function-plot';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

export const FunctionPlotNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const { fn, xDomain, yDomain, width, height } = node.attrs;
  const plotRef = useRef<HTMLDivElement>(null);

  const [currentFn, setCurrentFn] = useState(fn);
  const isEditing = selected;

  const drawPlot = useCallback(() => {
    if (plotRef.current) {
        // Clear previous plot
        plotRef.current.innerHTML = '';
        const plotWidth = plotRef.current.clientWidth;
        
        try {
            functionPlot({
                target: plotRef.current,
                width: plotWidth,
                height: height,
                xAxis: { domain: xDomain },
                yAxis: { domain: yDomain },
                grid: true,
                data: [{
                    fn: fn,
                    graphType: 'polyline'
                }]
            });
        } catch (error) {
            console.error("Function plot error:", error);
            plotRef.current.innerHTML = `<div class="p-4 text-destructive-foreground bg-destructive/80 rounded-md">Error plotting function: ${fn}</div>`;
        }
    }
  }, [fn, xDomain, yDomain, height]);

  useEffect(() => {
    drawPlot();
    // Add resize listener to redraw the plot when the window size changes
    window.addEventListener('resize', drawPlot);
    return () => {
      window.removeEventListener('resize', drawPlot);
    };
  }, [drawPlot]);


  const handleUpdate = () => {
    updateAttributes({ fn: currentFn });
  };
  
  return (
    <NodeViewWrapper className="my-4">
      <div className={cn("p-4 border rounded-lg bg-card transition-shadow relative", isEditing && "ring-2 ring-primary shadow-lg")}>
        <div ref={plotRef} style={{ width: '100%', height: `${height}px` }} className="w-full" />
        {isEditing && (
          <div className="mt-4 p-2 bg-muted/50 rounded-md space-y-2">
            <Label htmlFor="fn-input" className="font-semibold">Function f(x)</Label>
            <div className="flex gap-2">
              <Input
                id="fn-input"
                value={currentFn}
                onChange={(e) => setCurrentFn(e.target.value)}
                placeholder="e.g., sin(x)"
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
              />
              <Button onClick={handleUpdate} aria-label="Update Plot">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
