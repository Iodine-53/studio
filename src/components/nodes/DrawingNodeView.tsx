"use client";

import { useRef, useEffect, useState } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { ReactSketchCanvas, type ReactSketchCanvasRef } from 'react-sketch-canvas';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Undo, Redo, Eraser, Pen, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DrawingNodeView = ({ node, updateAttributes, selected }: NodeViewProps) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const { paths, textAlign, layout } = node.attrs;
    const isEditing = selected;
    const width = layout?.width || 40;

    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [eraserWidth, setEraserWidth] = useState(10);
    const [isErasing, setIsErasing] = useState(false);

    useEffect(() => {
        if (canvasRef.current && paths) {
            try {
                const parsedPaths = JSON.parse(paths);
                if (Array.isArray(parsedPaths) && parsedPaths.length > 0) {
                    canvasRef.current.loadPaths(parsedPaths);
                }
            } catch (e) {
                console.error("Failed to parse sketch paths", e);
            }
        }
    }, []);

    const handleStroke = async () => {
        if (canvasRef.current) {
            const exportedPaths = await canvasRef.current.exportPaths();
            updateAttributes({ paths: JSON.stringify(exportedPaths) });
        }
    };

    const handleUndo = () => canvasRef.current?.undo();
    const handleRedo = () => canvasRef.current?.redo();
    const handleClear = () => {
        canvasRef.current?.clearCanvas();
        updateAttributes({ paths: '[]' });
    };
    
    const setPenMode = () => {
        setIsErasing(false);
        canvasRef.current?.eraseMode(false);
    }
    
    const setEraserMode = () => {
        setIsErasing(true);
        canvasRef.current?.eraseMode(true);
    }

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStrokeColor(e.target.value);
        if (isErasing) {
            setPenMode();
        }
    }

    return (
        <NodeViewWrapper
            className="my-4 custom-node-wrapper"
            data-align={textAlign}
            style={{ width: `${width}%` }}
        >
            <div
                className={cn(
                    "p-2 border rounded-lg bg-card transition-shadow relative w-full",
                    isEditing && "ring-2 ring-primary shadow-lg",
                )}
                data-drag-handle
            >
                {isEditing && (
                    <div className="flex flex-wrap items-center justify-start gap-4 mb-2 p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handleUndo} title="Undo"><Undo className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={handleRedo} title="Redo"><Redo className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={setPenMode} title="Pen" className={cn(!isErasing && "bg-accent text-accent-foreground")}><Pen className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={setEraserMode} title="Eraser" className={cn(isErasing && "bg-accent text-accent-foreground")}><Eraser className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="sm" onClick={handleClear}>Clear</Button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="color-picker" className="text-sm">Color</Label>
                                 <Input 
                                    id="color-picker"
                                    type="color" 
                                    value={strokeColor}
                                    onChange={handleColorChange}
                                    className="w-10 h-8 p-1"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-32">
                               <Label htmlFor="size-slider" className="text-sm">{isErasing ? 'Eraser' : 'Brush'}</Label>
                               <Slider
                                    id="size-slider"
                                    min={1}
                                    max={50}
                                    step={1}
                                    value={[isErasing ? eraserWidth : strokeWidth]}
                                    onValueChange={(value) => isErasing ? setEraserWidth(value[0]) : setStrokeWidth(value[0])}
                               />
                            </div>
                        </div>
                    </div>
                )}
                
                <ReactSketchCanvas
                    ref={canvasRef}
                    className="w-full aspect-[4/3] bg-background rounded-md"
                    strokeWidth={strokeWidth}
                    eraserWidth={eraserWidth}
                    strokeColor={strokeColor}
                    canvasColor="hsl(var(--background))"
                    onStroke={handleStroke}
                    readOnly={!isEditing}
                />

                {!isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-card/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border">
                             <Edit className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-semibold text-muted-foreground">Select to draw</span>
                        </div>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
};
