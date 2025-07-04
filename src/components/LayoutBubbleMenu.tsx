
"use client";

import { BubbleMenu, Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Maximize,
  Minimize,
  RectangleHorizontal,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";

type Props = {
  editor: Editor;
};

// List of node types that support these layout controls
const LAYOUT_NODE_TYPES = ['image', 'chartBlock', 'drawing'];

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

  const updateLayoutAttribute = (key: string, value: string) => {
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
    return selectedNodeInfo?.layout[key] || '';
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: "top" }}
      // The menu should only show up if a node from our list is selected.
      shouldShow={() => !!getSelectedLayoutNode()}
      className="flex items-center gap-1 p-1 bg-card border rounded-lg shadow-xl"
    >
      {/* Alignment Controls */}
      <Toggle size="sm" pressed={getLayoutAttribute('align') === 'left'} onPressedChange={() => updateLayoutAttribute('align', 'left')} aria-label="Align left"><AlignLeft size={16} /></Toggle>
      <Toggle size="sm" pressed={getLayoutAttribute('align') === 'center'} onPressedChange={() => updateLayoutAttribute('align', 'center')} aria-label="Align center"><AlignCenter size={16} /></Toggle>
      <Toggle size="sm" pressed={getLayoutAttribute('align') === 'right'} onPressedChange={() => updateLayoutAttribute('align', 'right')} aria-label="Align right"><AlignRight size={16} /></Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Width Controls */}
      <Toggle size="sm" pressed={getLayoutAttribute('width') === 'small'} onPressedChange={() => updateLayoutAttribute('width', 'small')} aria-label="Small width"><Minimize size={16} /></Toggle>
      <Toggle size="sm" pressed={getLayoutAttribute('width') === 'default'} onPressedChange={() => updateLayoutAttribute('width', 'default')} aria-label="Default width"><RectangleHorizontal size={16} /></Toggle>
      <Toggle size="sm" pressed={getLayoutAttribute('width') === 'full'} onPressedChange={() => updateLayoutAttribute('width', 'full')} aria-label="Full width"><Maximize size={16} /></Toggle>
    </BubbleMenu>
  );
};
