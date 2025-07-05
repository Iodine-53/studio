
"use client";

import { type Editor } from "@tiptap/react";
import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type Props = {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
};

export const FindReplace = ({ editor, isOpen, onClose }: Props) => {
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');

  // When the find term changes, update the editor's search term
  useEffect(() => {
    if (editor) {
      editor.commands.setSearchTerm(findTerm);
    }
  }, [findTerm, editor]);

  // When the component opens, focus the find input
  useEffect(() => {
    if (isOpen) {
      document.getElementById('find-input')?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


  if (!isOpen || !editor) {
    return null;
  }
  
  const handleFindNext = () => editor.chain().focus().findNext().run();
  const handleFindPrev = () => editor.chain().focus().findPrevious().run();
  const handleReplace = () => editor.chain().focus().replace(replaceTerm).run();
  const handleReplaceAll = () => editor.chain().focus().replaceAll(replaceTerm).run();

  const handleFindInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFindTerm(e.target.value);
  }

  const handleReplaceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceTerm(e.target.value);
  }

  const handleFindInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleFindNext();
      }
  }

  return (
    <Card className="absolute top-4 right-4 z-20 w-96 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
        <CardTitle className="text-base font-semibold">Find &amp; Replace</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X size={16} />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="relative">
          <Input
            id="find-input"
            type="text"
            value={findTerm}
            onChange={handleFindInputChange}
            onKeyDown={handleFindInputKeyDown}
            placeholder="Find..."
            className="pr-20"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFindPrev} disabled={!findTerm}><ChevronUp size={16} /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleFindNext} disabled={!findTerm}><ChevronDown size={16} /></Button>
          </div>
        </div>
        
        <div>
          <Input
            type="text"
            value={replaceTerm}
            onChange={handleReplaceInputChange}
            placeholder="Replace with..."
          />
        </div>
      
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReplace} disabled={!findTerm}>Replace</Button>
            <Button onClick={handleReplaceAll} disabled={!findTerm}>Replace All</Button>
        </div>
      </CardContent>
    </Card>
  );
};
