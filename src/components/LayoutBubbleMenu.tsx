
"use client";

import { BubbleMenu, Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  Scaling,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type Props = {
  editor: Editor;
};

// List of node types that support these layout controls
const LAYOUT_NODE_TYPES = ['image', 'chartBlock', 'drawing', 'accordion', 'todoList', 'embed'];

export const LayoutBubbleMenu = ({ editor }: Props) => {
  
  // A helper to get the type and attributes of the currently selected layout node
  const getSelectedLayoutNode = () => {
    const { selection } = editor.state;
    if (selection instanceof NodeSelection && LAYOUT_NODE_TYPES.includes(selection.node.type.name)) {
      return {
        type: selection.node.type,
        layout: selection.node.attrs.layout || {},
      };
    }
    return null;
  };

  const updateLayoutAttribute = (key: string, value: string | number) => {
    const selectedNodeInfo = getSelectedLayoutNode();
    if (!selectedNodeInfo) return;
    
    const { type, layout } = selectedNodeInfo;
    
    editor
      .chain()
      .focus()
      .updateAttributes(type.name, {
        layout: { ...layout, [key]: value },
      })
      .run();
  };
  
  const getLayoutAttribute = (key: string) => {
    const selectedNodeInfo = getSelectedLayoutNode();
    return selectedNodeInfo?.layout[key];
  }

  const currentWidth = getLayoutAttribute('width') ?? 75;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: "top" }}
      // The menu should only show up if a node from our list is selected.
      shouldShow={() => !!getSelectedLayoutNode()}
      className="flex items-center gap-1 p-1 bg-card border rounded-lg shadow-xl"
    >
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
    </BubbleMenu>
  );
};
