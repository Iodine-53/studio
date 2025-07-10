
import type { Editor, Range } from "@tiptap/core";
import { Extension } from "@tiptap/core";
import {
  Heading1, Heading2, Heading3, Pilcrow, Image, Table, List, ListOrdered, CheckSquare, CodeSquare, Minus, AlertTriangle, AreaChart, PenSquare, Rows, ListTodo, Film, SlidersHorizontal, Quote, FunctionSquare, Calculator as CalculatorIcon, ListChecks, FileText, Link, Lightbulb, Target
} from "lucide-react";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { CommandList } from "@/components/editor/CommandList";
import type { ComponentProps } from 'react';
import Suggestion from '@tiptap/suggestion';

// Define a type for our command items
export interface CommandItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

// Type for the props of the CommandList component
type CommandListProps = ComponentProps<typeof CommandList>;

const getCommandItems = (): CommandItem[] => [
  // Basic Text Formatting
  { title: "Paragraph", icon: Pilcrow, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setParagraph().run(); } },
  { title: "Heading 1", icon: Heading1, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(); } },
  { title: "Heading 2", icon: Heading2, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(); } },
  { title: "Heading 3", icon: Heading3, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(); } },
  
  // Lists
  { title: "Bullet List", icon: List, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleBulletList().run(); } },
  { title: "Numbered List", icon: ListOrdered, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleOrderedList().run(); } },

  // Block Elements
  { title: "Blockquote", icon: Quote, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).toggleBlockquote().run(); } },
  { title: "Image", icon: Image, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setImage({ src: null }).run(); } },
  { title: "Table", icon: Table, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).insertInteractiveTable().run(); } },
  { title: "Code Block", icon: CodeSquare, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setCodeBlock().run(); } },
  { title: "Divider", icon: Minus, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setHorizontalRule().run(); } },
  
  // Custom Node Blocks
  { title: "Blank Toggle", icon: Rows, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setToggle({ type: 'blank' }).run(); } },
  { title: "Checklist Toggle", icon: ListChecks, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setToggle({ type: 'checklist' }).run(); } },
  { title: "Notes Toggle", icon: FileText, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setToggle({ type: 'notes' }).run(); } },
  { title: "Links Toggle", icon: Link, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setToggle({ type: 'links' }).run(); } },
  { title: "Ideas Toggle", icon: Lightbulb, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setToggle({ type: 'ideas' }).run(); } },
  { title: "Goals Toggle", icon: Target, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setToggle({ type: 'goals' }).run(); } },
  { title: "Callout", icon: AlertTriangle, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setCallout().run(); } },
  { title: "Chart", icon: AreaChart, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'chartBlock' }).run(); } },
  { title: "Drawing", icon: PenSquare, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'drawing' }).run(); } },
  { title: "Todo List", icon: ListTodo, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).insertTodoList().run(); } },
  { title: "Embed", icon: Film, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).setEmbed({ src: '' }).run(); } },
  { title: "Progress Bars", icon: SlidersHorizontal, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).insertProgressBarBlock().run(); } },
  { title: "Function Plot", icon: FunctionSquare, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'functionPlot' }).run(); } },
  { title: "Calculator", icon: CalculatorIcon, command: ({ editor, range }) => { editor.chain().focus().deleteRange(range).insertContent({ type: 'calculator' }).run(); } },
];

const renderItems = () => {
    let component: ReactRenderer<unknown, CommandListProps> | undefined;
    let popup: any;

    return {
      onStart: (props: any) => {
        // Guard against race-conditions: only render the popup if we have a valid clientRect
        if (typeof props.clientRect !== 'function' || !props.clientRect()) {
          return;
        }

        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        });

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
        component?.updateProps(props);

        // If the position becomes invalid during an update, destroy the popup to prevent crashes.
        if (typeof props.clientRect !== 'function' || !props.clientRect()) {
          if (popup && popup[0]) {
            popup[0].destroy();
            popup = undefined;
          }
          return;
        }

        if (popup && popup[0]) {
            popup[0].setProps({
              getReferenceClientRect: props.clientRect,
            });
        }
      },
      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          if (popup && popup[0]) {
            popup[0].hide();
          }
          return true;
        }
        
        // Add a guard to ensure component and its ref exist before calling onKeyDown
        if (!component?.ref) {
            return false;
        }
        return (component.ref as any)?.onKeyDown(props);
      },
      onExit() {
        if (popup && popup[0]) {
          popup[0].destroy();
        }
        if (component) {
            component.destroy();
        }
        // Reset component to avoid stale references
        component = undefined;
        popup = undefined;
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
