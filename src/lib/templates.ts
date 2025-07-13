import { type TiptapNode } from './db';

export interface DocumentTemplate {
  id: string;
  label: string;
  icon: string; // lucide-react icon name
  metadata: Record<string, string>;
  content: TiptapNode;
}

export const documentTemplates: DocumentTemplate[] = [
  {
    id: 'meeting-notes',
    label: 'Meeting Notes',
    icon: 'Users',
    metadata: { Status: 'Draft', Type: 'Meeting' },
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Attendees' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Agenda' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action Items' }] },
        { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action Item 1' }] }] }] },
      ],
    },
  },
  {
    id: 'project-plan',
    label: 'Project Plan',
    icon: 'Target',
    metadata: { Status: 'Planning', Priority: 'Medium' },
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Project Goals' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Timeline' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Stakeholders' }] },
        { type: 'paragraph' },
      ],
    },
  },
  {
    id: 'blank-with-properties',
    label: 'Blank with Properties',
    icon: 'FilePlus2',
    metadata: { Status: 'Idea', Topic: '' },
    content: {
      type: 'doc',
      content: [
        { type: 'paragraph' },
      ],
    },
  },
];
