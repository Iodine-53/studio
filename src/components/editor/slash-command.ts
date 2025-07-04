
import type { Editor, Range } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import {
  Heading1, Heading2, Heading3, List, ListOrdered, Pilcrow, CodeSquare, Minus, Table, AlertTriangle, Image, CheckSquare, Brush, BarChart, Rows
} from "lucide-react";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { CommandList } from "./CommandList";
import type { ComponentProps } from 'react';
import Suggestion from '@tiptap/suggestion';
import { processImage } from "@/lib/utils";

// Define a type for our command items
export interface CommandItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

// Type for the props of the CommandList component
type CommandListProps = ComponentProps<typeof CommandList>;

const getCommandItems = (): CommandItem[] => [
  { title: "Paragraph", icon: Pilcrow, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setParagraph().run(); } },
  { title: "Heading 1", icon: Heading1, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(); } },
  { title: "Heading 2", icon: Heading2, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(); } },
  { title: "Heading 3", icon: Heading3, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(); } },
  { title: "Bulleted List", icon: List, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleBulletList().run(); } },
  { title: "Numbered List", icon: ListOrdered, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleOrderedList().run(); } },
  { title: "Checklist", icon: CheckSquare, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleTaskList().run(); } },
  { title: "Todo List", icon: CheckSquare, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).insertTodoList().run(); } },
  { title: "Callout", icon: AlertTriangle, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleCallout({ type: 'info' }).run(); } },
  { title: "Divider", icon: Minus, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setHorizontalRule().run(); } },
  { title: "Code Block", icon: CodeSquare, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleCodeBlock().run(); } },
  { title: "Table", icon: Table, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); } },
  { title: "Accordion", icon: Rows, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).insertAccordion().run(); } },
  {
    title: 'Sketch Canvas',
    icon: Brush,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({ type: 'drawing' }).run();
    },
  },
  {
    title: 'Chart',
    icon: BarChart,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({ type: 'chartBlock' }).run();
    },
  },
  {
    title: "Image",
    icon: Image,
    command: ({ editor, range }: { editor: Editor, range: Range }) => {
      editor.chain().focus().deleteRange(range).run();

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const compressedBase64 = await processImage(file);
          editor.chain().focus().setImage({ src: compressedBase64 }).run();
        } catch (error) {
          console.error("Image processing failed in slash command:", error);
        }
      };
      input.click();
    }
  },
];

const renderItems = () => {
    let component: ReactRenderer<unknown, CommandListProps>;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },
      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },
      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          popup[0].hide();
          return true;
        }
        return (component.ref as any)?.onKeyDown(props);
      },
      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  }

export const SlashCommand = Extension.create({
    name: 'slash-command',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: { editor: Editor; range: Range; props: any }) => {
                    props.command({ editor, range });
                },
                items: ({ query }: { query: string }) => {
                    return getCommandItems()
                      .filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()))
                      .slice(0, 10);
                },
                render: renderItems,
            },
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion
            })
        ]
    }
});
