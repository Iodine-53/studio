
"use client";

import { X, Pencil, CheckSquare, FileText, Link as LinkIcon, Lightbulb, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Template = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const TOGGLE_TEMPLATES: Template[] = [
  { id: 'blank', title: 'Blank Toggle', description: 'Start with empty content.', icon: <Pencil size={20} /> },
  { id: 'checklist', title: 'Checklist', description: 'A list with interactive checkboxes.', icon: <CheckSquare size={20} /> },
  { id: 'notes', title: 'Notes', description: 'A simple paragraph for notes.', icon: <FileText size={20} /> },
  { id: 'links', title: 'Links & Resources', description: 'A bullet list for links.', icon: <LinkIcon size={20} /> },
  { id: 'ideas', title: 'Ideas', description: 'A paragraph for brainstorming.', icon: <Lightbulb size={20} /> },
  { id: 'goals', title: 'Goals', description: 'A paragraph to track objectives.', icon: <Target size={20} /> },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
};

export const ToggleTemplateModal = ({ isOpen, onClose, onSelect }: Props) => {
  if (!isOpen) return null;

  const handleSelect = (templateId: string) => {
    onSelect(templateId);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Choose a Toggle Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 pt-4">
              {TOGGLE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-4"
                >
                    <div className="p-2 bg-muted rounded-md">{template.icon}</div>
                    <div>
                        <div className="font-medium">{template.title}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                    </div>
                </button>
              ))}
            </div>
        </DialogContent>
    </Dialog>
  );
};
