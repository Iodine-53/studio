
"use client";

import { BubbleMenu, Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  Scaling,
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
    'layoutBlock',
];

// List of node types that support resizing controls
const RESIZABLE_NODE_TYPES = ['image', 'chartBlock', 'drawing', 'accordion', 'todoList', 'embed', 'interactiveTable', 'progressBarBlock'];

export const LayoutBubbleMenu = ({ editor }: Props) => {
  
  const handleScaleChange = (newWidth: number) => {
    const { selection } = editor.state;
    if (!(selection instanceof NodeSelection && RESIZABLE_NODE_TYPES.includes(selection.node.type.name))) {
        return;
    }

    const { node } = selection;
    const oldLayout = node.attrs.layout || {};
    
    // For charts, we also scale the height proportionally
    if (node.type.name === 'chartBlock') {
        const oldWidth = oldLayout.width ?? 100;
        const oldHeight = oldLayout.height ?? 400;
        const scaleFactor = oldWidth > 0 ? newWidth / oldWidth : 1;
        const newHeight = Math.round(oldHeight * scaleFactor);

        const newLayout = { ...oldLayout, width: newWidth, height: newHeight };
        editor
            .chain()
            .focus()
            .updateAttributes(node.type.name, { layout: newLayout })
            .run();
    } else {
        const newLayout = { ...oldLayout, width: newWidth };
        editor
            .chain()
            .focus()
            .updateAttributes(node.type.name, { layout: newLayout })
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

        return (
          <>
            {/* Resizing controls - only for resizable nodes */}
            {canResize && (
                <Popover>
                  <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                          <Scaling size={16} />
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-4">
                      <div className="space-y-4">
                          <Label htmlFor="width-slider">Scale: {currentWidth}%</Label>
                          <Slider
                              id="width-slider"
                              min={20}
                              max={100}
                              step={1}
                              value={[currentWidth]}
                              onValueChange={(value) => handleScaleChange(value[0])}
                          />
                      </div>
                  </PopoverContent>
                </Popover>
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
