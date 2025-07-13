"use client";

import { type Editor } from "@tiptap/react";
import { Bold, Italic, Strikethrough, List, Heading1, CheckSquare, Wand2, Quote, Plus } from "lucide-react";
import { Toggle } from "./ui/toggle";

type Props = {
  editor: Editor | null;
  onAiAssistantClick: () => void;
};

// A curated list of essential mobile actions
export const MobileToolbar = ({ editor, onAiAssistantClick }: Props) => {
  if (!editor) {
    return null;
  }
  
  const handleAddBlock = () => {
    const { from, to } = editor.state.selection;
    editor
      .chain()
      .insertContentAt(to, { type: 'paragraph' })
      .focus(to + 1)
      .insertContent('/')
      .run();
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t shadow-lg md:hidden">
      <div className="flex items-center gap-1 overflow-x-auto p-1 hide-scrollbar">
        <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold size={18} /></Toggle>
        <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic size={18} /></Toggle>
        <Toggle size="sm" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={18} /></Toggle>
        <Toggle size="sm" pressed={editor.isActive("heading", {level: 1})} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={18} /></Toggle>
        <Toggle size="sm" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}><List size={18} /></Toggle>
        <Toggle size="sm" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={18} /></Toggle>
        <Toggle size="sm" pressed={editor.isActive("taskList")} onPressedChange={() => editor.chain().focus().toggleTaskList().run()}><CheckSquare size={18} /></Toggle>
        <button onClick={onAiAssistantClick} className="p-2 rounded-lg flex items-center gap-1 text-accent-foreground"><Wand2 size={18} /><span className="text-sm font-medium">AI</span></button>
        <button onClick={handleAddBlock} className="p-2 rounded-lg flex items-center gap-1"><Plus size={18} /><span className="text-sm font-medium">Block</span></button>
      </div>
       <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
       `}</style>
    </div>
  );
};
