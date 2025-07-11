
"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Template = {
  id: string;
  title: string;
  description: string;
};

const TOGGLE_TEMPLATES: Template[] = [
  { id: 'blank', title: '📝 Blank Toggle', description: 'Start with an empty toggle.' },
  { id: 'checklist', title: '✅ Checklist', description: 'A list with interactive checkboxes.' },
  { id: 'notes', title: '📋 Notes', description: 'A simple paragraph for notes.' },
  { id: 'goals', title: '🎯 Goals', description: 'Track your objectives.' },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
};

export const ToggleTemplateModal = ({ isOpen, onClose, onSelect }: Props) => {

  const handleSelect = (templateId: string) => {
    onSelect(templateId);
    onClose();
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
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="font-medium">{template.title}</div>
                  <div className="text-sm text-muted-foreground">{template.description}</div>
                </button>
              ))}
            </div>
        </DialogContent>
    </Dialog>
  );
};
