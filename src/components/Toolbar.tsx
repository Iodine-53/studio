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
  ArrowLeft,
  PanelLeft,
  Eye,
  Settings,
  Info,
  ChevronRight,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useState } from 'react';
import { cn } from "@/lib/utils";


type Props = {
  editor: Editor | null;
  onAiAssistantClick: () => void;
  onAddToggleClick: () => void;
  onOpenSettingsClick: () => void;
  isMobile: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

const Toolbar = ({ 
  editor, 
  onAiAssistantClick, 
  onAddToggleClick, 
  onOpenSettingsClick,
  isMobile,
  isSidebarOpen,
  onToggleSidebar
}: Props) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const isEditable = editor.isEditable;

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
      <div className="flex w-full items-center bg-card p-2 border-b h-14">
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

          {isEditable ? (
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

                <Separator orientation="vertical" className="h-8 mx-1 shrink-0" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => setIsInfoOpen(true)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Editor Guide</p></TooltipContent>
                </Tooltip>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Badge variant="outline" className="bg-muted/50 text-muted-foreground gap-1.5 px-3 py-1">
                <Eye className="h-3.5 w-3.5" />
                View Only Mode
              </Badge>
            </div>
          )}

          <div className="shrink-0 flex items-center gap-1 ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onOpenSettingsClick}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Settings</p></TooltipContent>
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

      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              Editor Guide & Commands
            </DialogTitle>
            <DialogDescription>
              Learn how to supercharge your documents using slash commands.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="bg-muted p-4 rounded-lg border border-blue-100">
              <h4 className="font-bold flex items-center gap-2 mb-2 text-blue-700">
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs">/</span> The Slash Command
              </h4>
              <p className="text-sm leading-relaxed">
                Type <kbd className="px-1.5 py-0.5 rounded border bg-background font-mono font-bold">/</kbd> on any new line to open the block menu. 
                Search for a block by name (e.g., "chart") and press Enter to insert it instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Content Blocks</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> Paragraph & Headings</li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> Bullet & Numbered Lists</li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> <b>Advanced To-do List</b></li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> <b>Toggle List</b> (Accordion)</li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> Blockquotes & Dividers</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Interactive Tools</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> <b>Chart</b> (Bar, Line, Area, Mixed)</li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> <b>Data Table</b> (Interactive CSV)</li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> <b>Mind Map</b> (Visual Nodes)</li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> <b>Progress Bars</b> (KPI Tracking)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Media & Advanced</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> Image (Upload or AI Generate)</li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> Video Embed (YouTube/Vimeo)</li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> <b>Calculator</b> & Function Plot</li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> <b>2 Columns</b> Layout</li>
                    <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-blue-500"/> Callout & <b>Internal Link</b></li>
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-300 font-medium italic leading-relaxed">
                    Tip: Type <kbd className="px-1 py-0.5 rounded border bg-white dark:bg-blue-950 font-mono">[[</kbd> to quickly search and link other documents in your workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default Toolbar;