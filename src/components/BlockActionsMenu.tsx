"use client";

import { BubbleMenu, Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// List of node types this menu should appear for.
// We are targeting block-level atom nodes and wrappers.
const ACTIONABLE_NODE_TYPES = [
    'image', 
    'chartBlock', 
    'drawing', 
    'accordion', 
    'todoList', 
    'callout', 
    'horizontalRule', 
    'table',
    'embed'
];

type Props = {
  editor: Editor;
};

export const BlockActionsMenu = ({ editor }: Props) => {
  const handleDelete = () => {
    editor.chain().focus().deleteSelection().run();
  };

  const shouldShow = () => {
    const { selection } = editor.state;
    if (selection instanceof NodeSelection && ACTIONABLE_NODE_TYPES.includes(selection.node.type.name)) {
      return true;
    }
    return false;
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: "right-start",
        offset: [0, 8],
      }}
      shouldShow={shouldShow}
      className="flex items-center gap-1 p-1 bg-card border rounded-full shadow-xl"
    >
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete} title="Delete block">
        <Trash2 size={16} />
      </Button>
    </BubbleMenu>
  );
};
