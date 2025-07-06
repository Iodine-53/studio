
"use client";

import { BubbleMenu, Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  Scaling,
  MoveVertical,
  Trash2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type Props = {
  editor: Editor;
};

// List of node types that support ANY layout control (including delete)
const ACTIONABLE_NODE_TYPES = [
    'image', 
    'chartBlock', 
    'drawing', 
    'accordion', 
    'todoList', 
    'callout', 
    'horizontalRule', 
    'interactiveTable',
    'embed',
    'progressBarBlock',
];

// List of node types that support resizing controls
const RESIZABLE_NODE_TYPES = ['image', 'chartBlock', 'drawing', 'accordion', 'todoList', 'embed', 'interactiveTable', 'progressBarBlock'];

export const LayoutBubbleMenu = ({ editor }: Props) => {
  
  const updateLayoutAttribute = (key: string, value: string | number) => {
    const { selection } = editor.state;
    if (selection instanceof NodeSelection && ACTIONABLE_NODE_TYPES.includes(selection.node.type.name)) {
      editor
        .chain()
        .focus()
        .updateAttributes(selection.node.type.name, {
          layout: { ...selection.node.attrs.layout, [key]: value },
        })
        .run();
    }
  };
  
  const handleDelete = () => {
    editor.chain().focus().deleteSelection().run();
  };
  
  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: "top" }}
      shouldShow={() => {
        const { selection } = editor.state;
        return selection instanceof NodeSelection && ACTIONABLE_NODE_TYPES.includes(selection.node.type.name);
      }}
      className="flex items-center gap-1 p-1 bg-card border rounded-lg shadow-xl"
    >
      {/* Immediately-invoked function to get fresh state and render content */}
      {(() => {
        const { selection } = editor.state;
        if (!(selection instanceof NodeSelection && ACTIONABLE_NODE_TYPES.includes(selection.node.type.name))) {
          return null;
        }

        const nodeInfo = {
          type: selection.node.type.name,
          layout: selection.node.attrs.layout || {},
        };

        const canResize = RESIZABLE_NODE_TYPES.includes(nodeInfo.type);
        const currentWidth = nodeInfo.layout.width ?? 100;
        const currentHeight = nodeInfo.layout.height ?? 320;

        return (
          <>
            {/* Resizing controls - only for resizable nodes */}
            {canResize && (
              <>
                {/* Width Controls with Slider */}
                <Popover>
                  <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                          <Scaling size={16} />
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-4">
                      <div className="space-y-4">
                          <Label htmlFor="width-slider">Width: {currentWidth}%</Label>
                          <Slider
                              id="width-slider"
                              min={20}
                              max={100}
                              step={1}
                              value={[currentWidth]}
                              onValueChange={(value) => updateLayoutAttribute('width', value[0])}
                          />
                      </div>
                  </PopoverContent>
                </Popover>

                {/* Height Controls with Slider - ONLY for charts */}
                {nodeInfo.type === 'chartBlock' && (
                  <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoveVertical size={16} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-4">
                        <div className="space-y-4">
                            <Label htmlFor="height-slider">Height: {currentHeight}px</Label>
                            <Slider
                                id="height-slider"
                                min={200}
                                max={800}
                                step={10}
                                value={[currentHeight]}
                                onValueChange={(value) => updateLayoutAttribute('height', value[0])}
                            />
                        </div>
                    </PopoverContent>
                  </Popover>
                )}
              </>
            )}

            {/* Delete button for all actionable nodes */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" 
              onClick={handleDelete} 
              title="Delete block"
            >
              <Trash2 size={16} />
            </Button>
          </>
        )
      })()}
    </BubbleMenu>
  );
};
