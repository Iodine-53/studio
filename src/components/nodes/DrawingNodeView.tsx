"use client";

import { useRef, useEffect } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { ReactSketchCanvas, type ReactSketchCanvasRef } from 'react-sketch-canvas';
import { Button } from '@/components/ui/button';
import { Undo, Redo, Eraser } from 'lucide-react';

export const DrawingNodeView = ({ node, updateAttributes }: NodeViewProps) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const { paths } = node.attrs;

    useEffect(() => {
        // Load initial paths when the component mounts
        if (canvasRef.current && paths) {
            try {
                const parsedPaths = JSON.parse(paths);
                if(Array.isArray(parsedPaths)) {
                    canvasRef.current.loadPaths(parsedPaths);
                }
            } catch (e) {
                console.error("Failed to parse sketch paths", e);
            }
        }
    }, []); // Only run on mount to load initial state

    const handleStroke = async () => {
        if (canvasRef.current) {
            const exportedPaths = await canvasRef.current.exportPaths();
            updateAttributes({ paths: JSON.stringify(exportedPaths) });
        }
    };

    const handleUndo = () => canvasRef.current?.undo();
    const handleRedo = () => canvasRef.current?.redo();
    const handleClear = () => {
        canvasRef.current?.clearAll();
        // After clearing, we need to save the empty state
        updateAttributes({ paths: '[]' });
    };

    return (
        <NodeViewWrapper className="my-4 p-2 border rounded-lg bg-card">
             <div className="flex justify-end gap-2 mb-2">
                <Button variant="outline" size="icon" onClick={handleUndo} title="Undo">
                    <Undo className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleRedo} title="Redo">
                    <Redo className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={handleClear} title="Clear">
                    <Eraser className="h-4 w-4" />
                </Button>
             </div>
            <ReactSketchCanvas
                ref={canvasRef}
                className="w-full h-96 bg-background rounded-md"
                strokeWidth={4}
                strokeColor="hsl(var(--foreground))"
                canvasColor="hsl(var(--background))"
                onStroke={handleStroke}
            />
        </NodeViewWrapper>
    );
};
