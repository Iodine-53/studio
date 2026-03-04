
"use client";

import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Pilcrow,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Baseline,
  Undo,
  Redo,
  Type,
  Plus,
  Wand2,
  Quote,
  Rows,
  Sigma,
  ArrowLeft,
  PanelLeft,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import React from 'react';
import { cn } from "@/lib/utils";


type Props = {
  editor: Editor | null;
  onAiAssistantClick: () => void;
  onAddToggleClick: () => void;
  onOpenEquationModal: () => void;
  isMobile: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

const Toolbar = ({ 
  editor, 
  onAiAssistantClick, 
  onAddToggleClick, 
  onOpenEquationModal, 
  isMobile,
  isSidebarOpen,
  onToggleSidebar
}: Props) => {

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

  const getActiveLineHeight = () => {
    const types = ['heading', 'paragraph', 'listItem'];
    for (const type of types) {
        if (editor.isActive(type)) {
            const lineHeight = editor.getAttributes(type).lineHeight;
            if (lineHeight) {
                return parseFloat(lineHeight);
            }
        }
    }
    return 1.2; 
  };
  
  const currentLineHeight = getActiveLineHeight();

  const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '30', '36', '48'];
  const FONT_FAMILIES = [
      { name: 'Inter', value: 'Inter, sans-serif' },
      { name: 'Space Grotesk', value: 'Space Grotesk, sans-serif' },
      { name: 'Serif', value: 'serif' },
      { name: 'Monospace', value: 'monospace' },
      { name: 'Cursive', value: 'cursive' },
  ];
  
  const toggleSize = "sm";
  const buttonSize = "sm";

  return (
    <TooltipProvider>
      <div className="flex w-full items-center bg-card p-2 border-b">
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  asChild
                >
                  <a href="/documents">
                      <ArrowLeft className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Back to Documents</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSidebarOpen ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9"
                  onClick={onToggleSidebar}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isSidebarOpen ? 'Hide' : 'Show'} Menu</p></TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-8 mx-1 shrink-0" />

          <div className="flex items-center gap-1 overflow-x-auto flex-nowrap hide-scrollbar flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive("bold")}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().toggleBold()}
                    aria-label="Toggle bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Bold</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive("italic")}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().toggleItalic()}
                    aria-label="Toggle italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Italic</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive("strike")}
                    onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().toggleStrike()}
                    aria-label="Toggle strikethrough"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Strikethrough</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive("underline")}
                    onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                    disabled={!editor.can().toggleUnderline()}
                    aria-label="Toggle underline"
                  >
                    <Underline className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Underline</p></TooltipContent>
              </Tooltip>
              
              <Separator orientation="vertical" className="h-8 mx-1 shrink-0" />
              
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size={buttonSize} className="h-9 w-9" aria-label="Font Settings">
                        <Type className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent><p>Font Settings</p></TooltipContent>
                </Tooltip>
                <PopoverContent className="w-60 p-4">
                    <div className="space-y-4">
                        <div>
                            <Label>Font Family</Label>
                            <Select
                                value={editor.getAttributes('textStyle').fontFamily || 'Inter, sans-serif'}
                                onValueChange={val => editor.chain().focus().setFontFamily(val).run()}
                            >
                                <SelectTrigger><SelectValue placeholder="Select font..." /></SelectTrigger>
                                <SelectContent>
                                    {FONT_FAMILIES.map(font => (
                                        <SelectItem key={font.name} value={font.value} style={{fontFamily: font.value}}>{font.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Font Size</Label>
                            <Select
                                value={editor.isActive('advancedTodoList') ? editor.getAttributes('advancedTodoList').fontSize?.replace('px', '') : editor.getAttributes('textStyle').fontSize?.replace('px', '') || '16'}
                                onValueChange={val => editor.isActive('advancedTodoList') ? editor.chain().focus().updateAttributes('advancedTodoList', { fontSize: `${val}px` }).run() : editor.chain().focus().setFontSize(`${val}px`).run()}
                            >
                                <SelectTrigger><SelectValue placeholder="Select size..." /></SelectTrigger>
                                <SelectContent>
                                    {FONT_SIZES.map(size => (
                                        <SelectItem key={size} value={size}>{size}px</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Font Color</Label>
                            <Input
                                type="color"
                                className="w-full h-10 p-1 cursor-pointer"
                                onInput={(event: React.ChangeEvent<HTMLInputElement>) => editor.isActive('advancedTodoList') ? editor.chain().focus().updateAttributes('advancedTodoList', { color: event.target.value }).run() : editor.chain().focus().setColor(event.target.value).run()}
                                value={editor.isActive('advancedTodoList') ? editor.getAttributes('advancedTodoList').color : editor.getAttributes('textStyle').color || '#000000'}
                            />
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => editor.chain().focus().unsetFontFamily().unsetFontSize().unsetColor().run()}>Reset Formatting</Button>
                    </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size={buttonSize} className="h-9 w-9" aria-label="Line height">
                        <Baseline className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent><p>Line Height</p></TooltipContent>
                </Tooltip>
                <PopoverContent className="w-60 p-4">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="line-height-slider" className="shrink-0 mr-4">Line Height</Label>
                            <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                {currentLineHeight.toFixed(2)}
                            </span>
                        </div>
                        <Slider
                            id="line-height-slider"
                            min={0.25}
                            max={2.0}
                            step={0.05}
                            value={[currentLineHeight]}
                            onValueChange={(value) => {
                                editor.chain().focus().setLineHeight(String(value[0])).run()
                            }}
                        />
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => editor.chain().focus().unsetLineHeight().run()}
                        >
                            Reset to Default
                        </Button>
                    </div>
                </PopoverContent>
              </Popover>
              
              <Separator orientation="vertical" className="h-8 mx-1 shrink-0" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    onPressedChange={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    aria-label="Undo"
                  >
                    <Undo className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Undo</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    onPressedChange={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    aria-label="Redo"
                  >
                    <Redo className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Redo</p></TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-8 mx-1 shrink-0" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={buttonSize}
                    onClick={onAiAssistantClick}
                    className="h-9 w-9 text-accent-foreground"
                    aria-label="AI Assistant"
                  >
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>AI Assistant</p></TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-8 mx-1 shrink-0" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive({ textAlign: 'left' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                    aria-label="Set text align left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Align Left</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive({ textAlign: 'center' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                    aria-label="Set text align center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Align Center</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive({ textAlign: 'right' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                    aria-label="Set text align right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Align Right</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive({ textAlign: 'justify' })}
                    onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
                    aria-label="Set text align justify"
                  >
                    <AlignJustify className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Justify</p></TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-8 mx-1 shrink-0" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive("paragraph")}
                    onPressedChange={() => editor.chain().focus().setParagraph().run()}
                    aria-label="Set paragraph"
                  >
                    <Pilcrow className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Paragraph</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive("heading", { level: 1 })}
                    onPressedChange={() =>
                      editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    aria-label="Toggle heading 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Heading 1</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size={toggleSize}
                    pressed={editor.isActive("blockquote")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleBlockquote().run()
                    }
                    disabled={!editor.can().toggleBlockquote()}
                    aria-label="Toggle blockquote"
                  >
                    <Quote className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent><p>Blockquote</p></TooltipContent>
              </Tooltip>
              
              <Separator orientation="vertical" className="h-8 mx-1 shrink-0" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size={buttonSize}
                    variant="ghost"
                    onClick={onOpenEquationModal}
                    aria-label="Add Equation"
                  >
                    <Sigma className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Add Equation</p></TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                      size={buttonSize}
                      variant="ghost"
                      onClick={onAddToggleClick}
                      aria-label="Add Toggle"
                    >
                      <Rows className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Add Toggle</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                      size={buttonSize}
                      variant="ghost"
                      onClick={handleAddBlock}
                      aria-label="Add block"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>Insert a block (triggers /)</p></TooltipContent>
              </Tooltip>
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
    </TooltipProvider>
  );
};

export default Toolbar;
