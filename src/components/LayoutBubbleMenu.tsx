
"use client";

import { BubbleMenu, Editor } from "@tiptap/react";
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

export const LayoutBubbleMenu = ({ editor }: Props) => {
  // This is a simplified and more direct way to update the attribute
  // on the currently selected image node.
  const updateLayoutAttribute = (key: string, value: string) => {
    const currentLayout = editor.getAttributes('image').layout || {};
    editor
      .chain()
      .focus()
      .updateAttributes('image', {
        layout: { ...currentLayout, [key]: value },
      })
      .run();
  };
  
  // This gets the attribute from the selected node to correctly show
  // which toggle is currently active.
  const getLayoutAttribute = (key: string) => {
    return editor.getAttributes('image').layout?.[key] || '';
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: "top" }}
      // This logic now checks if the selected node is an 'image'.
      // This is more specific and reliable.
      // To see the menu, you must click on an image in the editor.
      shouldShow={({ editor }) => {
        return editor.isActive('image');
      }}
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
