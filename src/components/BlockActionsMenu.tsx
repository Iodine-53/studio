"use client";

import { BubbleMenu, Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { MoreVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  editor: Editor;
};

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
    'table'
];

export const BlockActionsMenu = ({ editor }: Props) => {
  const handleDelete = () => {
    editor.chain().focus().deleteSelection().run();
  };

  const handleAddBlockBelow = () => {
    const { to } = editor.state.selection;
    editor.chain().focus().insertContentAt(to, { type: 'paragraph' }).run();
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
        placement: "left-start",
        offset: [0, 8],
      }}
      shouldShow={shouldShow}
      className="flex items-center gap-1 p-1 bg-card border rounded-full shadow-xl"
    >
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleAddBlockBelow} title="Add block below">
        <Plus size={16} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="More options">
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete block</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </BubbleMenu>
  );
};
