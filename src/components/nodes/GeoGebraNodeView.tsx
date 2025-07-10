
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Check as CheckIcon, Loader, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

// Lazy load the GeoGebra component and specify the named export
const Geogebra = dynamic(
  () => import('geogebra-apps-react').then((mod) => mod.Geogebra),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full w-full bg-muted"><Loader className="h-8 w-8 animate-spin text-primary"/></div>,
  }
);


// Simple debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export const GeoGebraNodeView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { ggbBase64, appName, width, height, showToolBar, showMenuBar, showAlgebraInput, textAlign, layout } = node.attrs;
  
  const [isEditing, setIsEditing] = useState(false);
  const [instance, setInstance] = useState<any>(null);
  
  // Local state for the settings panel
  const [currentAppName, setCurrentAppName] = useState(appName);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [currentShowToolBar, setCurrentShowToolBar] = useState(showToolBar);
  const [currentShowMenuBar, setCurrentShowMenuBar] = useState(showMenuBar);
  const [currentShowAlgebraInput, setCurrentShowAlgebraInput] = useState(showAlgebraInput);

  useEffect(() => {
    if (selected) {
      // Sync local state when selected
      setCurrentAppName(appName);
      setCurrentWidth(width);
      setCurrentHeight(height);
      setCurrentShowToolBar(showToolBar);
      setCurrentShowMenuBar(showMenuBar);
      setCurrentShowAlgebraInput(showAlgebraInput);
    } else {
      setIsEditing(false);
    }
  }, [selected, appName, width, height, showToolBar, showMenuBar, showAlgebraInput]);

  const handleSaveSettings = () => {
    updateAttributes({
      appName: currentAppName,
      width: currentWidth,
      height: currentHeight,
      showToolBar: currentShowToolBar,
      showMenuBar: currentShowMenuBar,
      showAlgebraInput: currentShowAlgebraInput,
    });
    setIsEditing(false);
  };

  const debouncedUpdate = useMemo(() => debounce((base64: string) => {
    if (updateAttributes) {
      updateAttributes({ ggbBase64: base64 });
    }
  }, 1000), [updateAttributes]);

  const handleOnReady = (applet: any) => {
    setInstance(applet);
    applet.registerUpdateListener(() => {
      debouncedUpdate(applet.getGGBBase64());
    });
  };

  const handleReset = () => {
    if (instance) {
      instance.reset();
    }
  };
  
  const blockWidth = layout?.width || 100;

  if (isEditing) {
    return (
      <NodeViewWrapper
        className="my-4 custom-node-wrapper"
        data-align={textAlign}
        style={{ width: `${blockWidth}%` }}
      >
        <Card className="w-full ring-2 ring-primary">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>GeoGebra Settings</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleSaveSettings} size="sm"><CheckIcon className="mr-2 h-4 w-4"/> Apply</Button>
                <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">Cancel</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Perspective</Label>
                <Select value={currentAppName} onValueChange={setCurrentAppName}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geometry">Geometry</SelectItem>
                    <SelectItem value="graphing">Graphing Calculator</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="whiteboard">Whiteboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                 <Label>Dimensions</Label>
                 <div className="flex gap-2">
                    <Input type="number" value={currentWidth} onChange={e => setCurrentWidth(Number(e.target.value))} placeholder="Width"/>
                    <Input type="number" value={currentHeight} onChange={e => setCurrentHeight(Number(e.target.value))} placeholder="Height"/>
                 </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2"><Checkbox id="toolbar" checked={currentShowToolBar} onCheckedChange={(checked) => setCurrentShowToolBar(!!checked)}/><Label htmlFor="toolbar">Show Toolbar</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="menubar" checked={currentShowMenuBar} onCheckedChange={(checked) => setCurrentShowMenuBar(!!checked)}/><Label htmlFor="menubar">Show Menubar</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="algebra" checked={currentShowAlgebraInput} onCheckedChange={(checked) => setCurrentShowAlgebraInput(!!checked)}/><Label htmlFor="algebra">Show Algebra Input</Label></div>
            </div>
          </CardContent>
        </Card>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className="my-4 custom-node-wrapper"
      data-align={textAlign}
      style={{ width: `${blockWidth}%` }}
    >
      <div 
        className={cn("relative group border rounded-lg overflow-hidden bg-card", selected && "ring-2 ring-primary")}
        data-drag-handle
      >
        <div style={{ width: `${width}px`, height: `${height}px`, margin: '0 auto' }}>
          <Geogebra
            key={`${appName}-${width}-${height}-${showToolBar}-${showMenuBar}-${showAlgebraInput}`}
            appName={appName}
            width={width}
            height={height}
            showToolBar={showToolBar}
            showMenuBar={showMenuBar}
            showAlgebraInput={showAlgebraInput}
            ggbBase64={ggbBase64}
            onAppletReady={handleOnReady}
            LoadComponent={Skeleton}
          />
        </div>
        {selected && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="secondary" size="icon" className="h-8 w-8" onClick={handleReset} title="Reset Applet">
              <RefreshCw className="h-4 w-4"/>
            </Button>
            <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)} title="Edit Settings">
              <Settings className="h-4 w-4"/>
            </Button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
