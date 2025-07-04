
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
  const updateLayoutAttribute = (key: string, value: string) => {
    const { from, to } = editor.state.selection;
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isBlock || !node.type.spec.attrs?.layout) return;

      const currentLayout = node.attrs.layout || {};
      editor
        .chain()
        .focus()
        // We need to select the node to apply attributes to it
        .setNodeSelection(pos)
        .updateAttributes(node.type.name, {
          layout: { ...currentLayout, [key]: value },
        })
        .run();
    });
  };

  const getLayoutAttribute = (key: string) => {
      const { from } = editor.state.selection;
      const node = editor.state.doc.nodeAt(from);
      return node?.attrs.layout?.[key] || '';
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: "top" }}
      // Show this menu only when a node with layout attributes is selected
      shouldShow={({ editor, state }) => {
        const { from } = state.selection;
        const node = editor.state.doc.nodeAt(from);
        // Only show for nodes that have a 'layout' attribute defined
        return !!node?.type.spec.attrs?.layout;
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
