
"use client";

import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Code,
  Minus,
  Table,
  Trash2,
  Plus,
  Merge,
  Split,
  AlertTriangle,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";

type Props = {
  editor: Editor | null;
};

const Toolbar = ({ editor }: Props) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-1 rounded-t-xl border-b bg-muted/50 p-2">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().toggleBold()}
        aria-label="Toggle bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().toggleItalic()}
        aria-label="Toggle italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().toggleStrike()}
        aria-label="Toggle strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().toggleUnderline()}
        aria-label="Toggle underline"
      >
        <Underline className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive("paragraph")}
        onPressedChange={() => editor.chain().focus().setParagraph().run()}
        disabled={!editor.can().setParagraph()}
        aria-label="Set paragraph"
      >
        <Pilcrow className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        disabled={!editor.can().toggleHeading({ level: 1 })}
        aria-label="Toggle heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        disabled={!editor.can().toggleHeading({ level: 2 })}
        aria-label="Toggle heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        disabled={!editor.can().toggleHeading({ level: 3 })}
        aria-label="Toggle heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        disabled={!editor.can().toggleBulletList()}
        aria-label="Toggle bullet list"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={!editor.can().toggleOrderedList()}
        aria-label="Toggle ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
       <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        disabled={!editor.can().setTextAlign('left')}
        aria-label="Set text align left"
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        disabled={!editor.can().setTextAlign('center')}
        aria-label="Set text align center"
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        disabled={!editor.can().setTextAlign('right')}
        aria-label="Set text align right"
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'justify' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
        disabled={!editor.can().setTextAlign('justify')}
        aria-label="Set text align justify"
      >
        <AlignJustify className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive("codeBlock")}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        disabled={!editor.can().toggleCodeBlock()}
        aria-label="Toggle code block"
      >
        <Code className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={!editor.can().setHorizontalRule()}
        aria-label="Insert horizontal rule"
      >
        <Minus className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        aria-label="Insert table"
      >
        <Table className="h-4 w-4" />
      </Toggle>
      {editor.isActive('table') && (
        <>
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().addColumnAfter().run()}
            aria-label="Add column after"
          >
            <Plus className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().deleteColumn().run()}
            aria-label="Delete column"
          >
            <Minus className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().addRowAfter().run()}
            aria-label="Add row after"
          >
            <Plus className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().deleteRow().run()}
            aria-label="Delete row"
          >
            <Minus className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().mergeOrSplit().run()}
            aria-label="Merge cells"
          >
            <Merge className="h-4 w-4" />
          </Toggle>
           <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().mergeOrSplit().run()}
            aria-label="Split cell"
          >
            <Split className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().deleteTable().run()}
            aria-label="Delete table"
          >
            <Trash2 className="h-4 w-4" />
          </Toggle>
        </>
      )}
      <Separator orientation="vertical" className="h-8 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive('callout')}
        onPressedChange={() => editor.chain().focus().toggleCallout().run()}
        aria-label="Toggle callout"
      >
        <AlertTriangle className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

export default Toolbar;
